"""
Integration Test - Client Data System
Tests the complete flow from client lookup to report generation
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from agents.client_lookup_agent import client_lookup_agent
from services.client_repository import client_repository


async def test_client_lookup():
    """Test client lookup functionality"""
    print("\n=== Testing Client Lookup ===\n")
    
    # Test 1: Direct repository search
    print("Test 1: Direct repository search")
    client = client_repository.find_client("Robert Anderson")
    if client:
        print(f"✓ Found: {client['name']} (${client['aum']:,})")
    else:
        print("✗ Client not found")
    
    # Test 2: Fuzzy search
    print("\nTest 2: Fuzzy search")
    client = client_repository.find_client("robert")
    if client:
        print(f"✓ Fuzzy matched: {client['name']}")
    else:
        print("✗ Fuzzy match failed")
    
    # Test 3: Agent-based lookup
    print("\nTest 3: Agent-based lookup")
    result = await client_lookup_agent.find_and_load_client("Sarah Mitchell")
    if result["found"]:
        print(f"✓ Agent found: {result['client']['name']}")
        print(f"  - Holdings: {len(result['holdings'])} positions")
        print(f"  - Transactions: {len(result['transactions'])} records")
    else:
        print("✗ Agent lookup failed")
    
    # Test 4: Extract client from message
    print("\nTest 4: Extract client from natural language")
    messages = [
        "Generate report for David Chen Q4 2025",
        "Show me Emily's performance",
        "James Patterson allocation"
    ]
    
    for msg in messages:
        name = await client_lookup_agent.extract_client_from_message(msg)
        print(f"  '{msg}' → {name}")
    
    # Test 5: List all clients
    print("\nTest 5: List all clients")
    clients = client_repository.list_all_clients()
    print(f"✓ Total clients: {len(clients)}")
    for c in clients:
        print(f"  - {c['name']}: ${c['aum']:,}")
    
    print("\n=== All Tests Complete ===\n")


if __name__ == "__main__":
    asyncio.run(test_client_lookup())
