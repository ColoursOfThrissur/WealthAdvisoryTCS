"""
Client Lookup Agent - Searches and retrieves client data from repository
Uses LangChain tools for flexible client data access
"""
import os
from typing import Dict, Optional, List
from dotenv import load_dotenv

load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage

from services.client_repository import client_repository


# Define tools for client lookup
@tool
def search_client(query: str) -> str:
    """
    Search for a client by name or ID.
    
    Args:
        query: Client name or ID to search for
    
    Returns:
        JSON string with client information or error message
    """
    import json
    
    client = client_repository.find_client(query)
    
    if client:
        return json.dumps({
            "found": True,
            "client_id": client["client_id"],
            "name": client["name"],
            "aum": client["aum"],
            "risk_profile": client["risk_profile"],
            "advisor": client["advisor"],
            "benchmark": client.get("benchmark", "^GSPC"),
            "status": client["status"]
        })
    else:
        return json.dumps({
            "found": False,
            "message": f"No client found matching '{query}'"
        })


@tool
def get_client_holdings(client_id: str) -> str:
    """
    Get holdings data for a specific client.
    
    Args:
        client_id: Client ID (e.g., CLT-001)
    
    Returns:
        JSON string with holdings data
    """
    import json
    
    holdings_data = client_repository.get_holdings(client_id)
    
    if holdings_data:
        return json.dumps({
            "success": True,
            "holdings": holdings_data.get("holdings", []),
            "accounts": holdings_data.get("accounts", []),
            "target_allocation": holdings_data.get("target_allocation", {}),
            "total_positions": len(holdings_data.get("holdings", []))
        })
    else:
        return json.dumps({
            "success": False,
            "message": f"No holdings found for client {client_id}"
        })


@tool
def get_client_transactions(client_id: str) -> str:
    """
    Get transaction history for a specific client.
    
    Args:
        client_id: Client ID (e.g., CLT-001)
    
    Returns:
        JSON string with transactions data
    """
    import json
    
    transactions = client_repository.get_transactions(client_id)
    
    if transactions:
        return json.dumps({
            "success": True,
            "transactions": transactions,
            "total_transactions": len(transactions)
        })
    else:
        return json.dumps({
            "success": False,
            "message": f"No transactions found for client {client_id}"
        })


@tool
def list_all_clients() -> str:
    """
    List all active clients in the system.
    
    Returns:
        JSON string with list of all clients
    """
    import json
    
    clients = client_repository.list_all_clients()
    
    client_list = [
        {
            "client_id": c["client_id"],
            "name": c["name"],
            "aum": c["aum"],
            "risk_profile": c["risk_profile"]
        }
        for c in clients
    ]
    
    return json.dumps({
        "success": True,
        "total_clients": len(client_list),
        "clients": client_list
    })


from observability.langchain_adapter import LangChainObservabilityAdapter


class ClientLookupAgent:
    """
    Agent that searches for clients and retrieves their data
    Uses direct tool calls instead of agent executor
    """
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )
        self.observer = LangChainObservabilityAdapter(
            agent_name="client_lookup_agent",
            description="Searches and retrieves client data from repository",
            evaluators=["llm_judge"],
            llm_judge_dimensions=["accuracy", "relevance", "hallucination", "safety"],
            llm_judge_model="gpt-4o-mini",
        )
    
    async def find_and_load_client(self, query: str) -> Dict:
        """Find client and load their complete data"""
        import json
        
        # Direct lookup using repository
        client = client_repository.find_client(query)
        
        if client:
            client_id = client["client_id"]
            holdings_data = client_repository.get_holdings(client_id)
            transactions = client_repository.get_transactions(client_id)
            
            return {
                "found": True,
                "client": client,
                "holdings": holdings_data.get("holdings", []) if holdings_data else [],
                "accounts": holdings_data.get("accounts", []) if holdings_data else [],
                "target_allocation": holdings_data.get("target_allocation", {}) if holdings_data else {},
                "transactions": transactions,
                "message": f"Found {client['name']} with {len(holdings_data.get('holdings', []))} holdings"
            }
        else:
            return {
                "found": False,
                "client": None,
                "holdings": [],
                "transactions": [],
                "message": f"No client found matching '{query}'"
            }
    
    async def extract_client_from_message(self, message: str) -> Optional[str]:
        """Extract client name from natural language message"""
        
        system_prompt = """Extract the client name from the user's message.

Return ONLY the client name, or "NONE" if no client name is mentioned.

Examples:
- "Generate report for John Mitchell" → "John Mitchell"
- "Show me Sarah's performance" → "Sarah"
- "David Chen Q4 report" → "David Chen"
- "Generate performance summary" → "NONE"
- "Robert Anderson's allocation" → "Robert Anderson"

Return ONLY the name or NONE, no other text."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message)
        ]
        
        try:
            response = await self.observer.ainvoke(self.llm, messages, metadata={"operation": "client_name_extract"})
            name = response.content.strip()
            return None if name == "NONE" else name
        except Exception as e:
            print(f"[ClientLookupAgent] Error extracting name: {e}")
            return None


# Global instance
client_lookup_agent = ClientLookupAgent()
