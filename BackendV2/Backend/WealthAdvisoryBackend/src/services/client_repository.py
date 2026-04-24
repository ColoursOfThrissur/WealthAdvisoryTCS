"""
Client Repository - Manages client data from JSON registry
"""
import json
from pathlib import Path
from typing import Dict, List, Optional
from difflib import SequenceMatcher


class ClientRepository:
    """Manages client portfolio data from JSON files"""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.clients = []
        self.clients_by_id = {}
        self.clients_by_name = {}
        self.load_registry()
    
    def load_registry(self):
        """Load clients from registry JSON"""
        registry_path = self.data_dir / "clients_registry.json"
        
        if not registry_path.exists():
            print(f"[ClientRepository] Registry not found: {registry_path}")
            return
        
        with open(registry_path, 'r') as f:
            data = json.load(f)
        
        self.clients = data.get("clients", [])
        
        # Build lookup indexes
        for client in self.clients:
            client_id = client["client_id"]
            self.clients_by_id[client_id] = client
            
            # Index by name and variations
            name_lower = client["name"].lower()
            self.clients_by_name[name_lower] = client
            
            for variation in client.get("name_variations", []):
                self.clients_by_name[variation.lower()] = client
        
        print(f"[ClientRepository] Loaded {len(self.clients)} clients")
    
    def find_client(self, name_or_id: str) -> Optional[Dict]:
        """
        Find client by name or ID with fuzzy matching
        
        Args:
            name_or_id: Client name or ID
        
        Returns:
            Client dict or None
        """
        if not name_or_id:
            return None
        
        search_key = name_or_id.lower().strip()
        
        # Exact match by ID
        if search_key in self.clients_by_id:
            return self.clients_by_id[search_key]
        
        # Exact match by name/variation
        if search_key in self.clients_by_name:
            return self.clients_by_name[search_key]
        
        # Fuzzy match
        best_match = None
        best_score = 0.0
        
        for name, client in self.clients_by_name.items():
            score = SequenceMatcher(None, search_key, name).ratio()
            if score > best_score and score > 0.6:  # 60% similarity threshold
                best_score = score
                best_match = client
        
        if best_match:
            print(f"[ClientRepository] Fuzzy matched '{name_or_id}' to '{best_match['name']}' (score: {best_score:.2f})")
        
        return best_match
    
    def get_holdings(self, client_id: str) -> Dict:
        """Load holdings JSON for client"""
        client = self.clients_by_id.get(client_id)
        if not client:
            return {}
        
        holdings_path = Path(client["data_files"]["holdings"])
        
        if not holdings_path.exists():
            print(f"[ClientRepository] Holdings not found: {holdings_path}")
            return {}
        
        with open(holdings_path, 'r') as f:
            return json.load(f)
    
    def get_transactions(self, client_id: str) -> List[Dict]:
        """Load transactions JSON for client"""
        client = self.clients_by_id.get(client_id)
        if not client:
            return []
        
        transactions_path = Path(client["data_files"]["transactions"])
        
        if not transactions_path.exists():
            print(f"[ClientRepository] Transactions not found: {transactions_path}")
            return []
        
        with open(transactions_path, 'r') as f:
            data = json.load(f)
            return data.get("transactions", [])
    
    def list_all_clients(self) -> List[Dict]:
        """Return all active clients"""
        return [c for c in self.clients if c.get("status") == "active"]
    
    def get_client_summary(self, client_id: str) -> str:
        """Get formatted client summary"""
        client = self.clients_by_id.get(client_id)
        if not client:
            return ""
        
        return f"{client['name']} (${client['aum']:,} AUM, {client['risk_profile']})"


# Global instance
client_repository = ClientRepository()
