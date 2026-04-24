"""
Test script to verify MCP server connectivity
Run this to diagnose connection issues before starting the main API
"""
import asyncio
import sys
from mcp_client import mcp_manager

async def test_connection():
    print("=" * 60)
    print("MCP Server Connection Test")
    print("=" * 60)
    
    # Test configuration loading
    print("\n1. Testing configuration loading...")
    print(f"   Loaded servers: {list(mcp_manager.servers.keys())}")
    
    for server_name, config in mcp_manager.servers.items():
        print(f"\n   Server: {server_name}")
        print(f"   Type: {config.get('type')}")
        print(f"   URL: {config.get('url', 'N/A')}")
    
    # Test connection to each server
    print("\n2. Testing connections...")
    for server_name in mcp_manager.servers.keys():
        print(f"\n   Connecting to '{server_name}'...")
        try:
            client = await mcp_manager.get_client(server_name)
            if client:
                print(f"   ✓ Successfully connected to '{server_name}'")
                
                # Try to list available tools
                try:
                    tools = await client.list_tools()
                    print(f"   ✓ Available tools: {len(tools.tools)}")
                    for tool in tools.tools[:3]:  # Show first 3 tools
                        print(f"      - {tool.name}")
                    if len(tools.tools) > 3:
                        print(f"      ... and {len(tools.tools) - 3} more")
                except Exception as e:
                    print(f"   ✗ Failed to list tools: {e}")
            else:
                print(f"   ✗ Failed to connect to '{server_name}'")
        except Exception as e:
            print(f"   ✗ Connection error: {e}")
            import traceback
            traceback.print_exc()
    
    # Test a simple tool call
    print("\n3. Testing tool call (get_portfolio_data)...")
    try:
        client = await mcp_manager.get_client("portfolio-rebalance")
        if client:
            result = await client.call_tool("get_portfolio_data", {"client_id": "15634602"})
            print("   ✓ Tool call successful!")
            print(f"   Response type: {type(result)}")
            if hasattr(result, 'content'):
                print(f"   Content items: {len(result.content)}")
        else:
            print("   ✗ Could not get client")
    except Exception as e:
        print(f"   ✗ Tool call failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)
    
    # Cleanup
    await mcp_manager.cleanup()

if __name__ == "__main__":
    try:
        asyncio.run(test_connection())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(0)
