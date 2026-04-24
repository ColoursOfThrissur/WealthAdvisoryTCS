import json
import asyncio
from typing import Dict, Any, List, Optional
from contextlib import AsyncExitStack

# Using the official MCP Python SDK
from mcp import ClientSession
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.sse import sse_client

class MCPManager:
    def __init__(self, config_path: str = "mcp_config.json"):
        self.config_path = config_path
        self.servers: Dict[str, dict] = {}
        
        # We store the active sessions and exit stacks so we can keep connections alive
        self.sessions: Dict[str, ClientSession] = {}
        self.exit_stacks: Dict[str, AsyncExitStack] = {}
        
        self.load_config()

    def load_config(self):
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.servers = data.get("servers", {})
        except Exception as e:
            print(f"Could not load MCP config: {e}")

    async def get_client(self, server_name: str) -> Optional[ClientSession]:
        """
        Returns an active, initialized ClientSession for the requested server name.
        """
        if server_name in self.sessions:
            return self.sessions[server_name]
        
        cfg = self.servers.get(server_name)
        if not cfg:
            print(f"Server '{server_name}' not found in configuration.")
            return None
        
        server_type = cfg.get("type")
        stack = AsyncExitStack()
        
        try:
            if server_type == "stdio":
                command = cfg.get("command")
                args = cfg.get("args", [])
                env = cfg.get("env")
                
                server_params = StdioServerParameters(command=command, args=args, env=env)
                read, write = await stack.enter_async_context(stdio_client(server_params))
                
            elif server_type == "sse":
                url = cfg.get("url")
                if not url:
                    raise ValueError(f"SSE server '{server_name}' requires a 'url'")
                
                read, write = await stack.enter_async_context(sse_client(url))
                
            else:
                raise ValueError(f"Unknown server type: {server_type}")
                
            # Initialize the session
            session = await stack.enter_async_context(ClientSession(read, write))
            await session.initialize()
            
            # Store them for reuse
            self.sessions[server_name] = session
            self.exit_stacks[server_name] = stack
            
            print(f"Connected to MCP server: {server_name} ({server_type})")
            return session
            
        except Exception as e:
            print(f"Failed to connect to MCP server '{server_name}': {e}")
            await stack.aclose()
            return None

    async def cleanup(self):
        """Clean up all active sessions and network connections."""
        for name, stack in self.exit_stacks.items():
            print(f"Closing MCP connection to {name}...")
            await stack.aclose()
        self.sessions.clear()
        self.exit_stacks.clear()

# Global instance
mcp_manager = MCPManager()
