import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'src'))

from tools.mcp_tools import MCPTools

async def test():
    async with MCPTools() as mcp:
        tools = await mcp.session.list_tools()
        print('Available MCP tools:')
        for t in tools.tools:
            print(f'- {t.name}')
            if hasattr(t, 'description'):
                print(f'  {t.description}')

asyncio.run(test())
