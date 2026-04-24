"""
Test complete integration: Client Repository -> Planner -> Orchestrator -> Parameters Agent
"""
import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from core.state_manager import WorkflowState, state_manager
from agents.planner_agent import PlannerAgent
from agents.parameters_agent import ParametersAgent
from core.orchestrator import orchestrator

async def test_full_flow():
    print("=" * 60)
    print("INTEGRATION TEST: Client Repository -> Full Report Flow")
    print("=" * 60)
    
    # Test 1: Planner extracts and loads client
    print("\n[TEST 1] Planner Intent Recognition")
    print("-" * 60)
    state = WorkflowState('test-session-1')
    planner = PlannerAgent()
    
    intent = await planner.interpret_user_intent('generate report for David Chen', state)
    print(f"✓ Client found: {intent.get('client_found')}")
    print(f"✓ Client name: {intent.get('client_data', {}).get('client', {}).get('name')}")
    print(f"✓ Holdings loaded: {len(intent.get('client_data', {}).get('holdings', []))}")
    print(f"✓ Transactions loaded: {len(intent.get('client_data', {}).get('transactions', []))}")
    print(f"✓ Needs clarification: {intent.get('needs_clarification')}")
    print(f"✓ Question: {intent.get('clarification_question')}")
    
    # Test 2: Orchestrator handles first message
    print("\n[TEST 2] Orchestrator - First Message (Client Request)")
    print("-" * 60)
    result1 = await orchestrator.handle_message('test-session-2', 'generate report for Sarah Mitchell', None, None)
    print(f"✓ Response type: {result1.get('type')}")
    print(f"✓ Message: {result1.get('message')}")
    
    session_state = state_manager.get_session('test-session-2')
    if session_state:
        print(f"✓ Client in state: {session_state.collected_data.get('client_name')}")
        print(f"✓ Holdings in state: {len(session_state.collected_data.get('holdings', []))}")
        print(f"✓ Transactions in state: {len(session_state.collected_data.get('transactions', []))}")
    
    # Test 3: Orchestrator handles period response
    print("\n[TEST 3] Orchestrator - Second Message (Period Response)")
    print("-" * 60)
    result2 = await orchestrator.handle_message('test-session-2', 'Q4 2025', None, None)
    print(f"✓ Response type: {result2.get('type')}")
    print(f"✓ Message: {result2.get('message')[:100]}...")
    
    if session_state:
        print(f"✓ Period in state: {session_state.collected_data.get('period')}")
        print(f"✓ Completed steps: {len(session_state.completed_steps)}")
    
    # Test 4: Parameters Agent with repository data
    print("\n[TEST 4] Parameters Agent - Repository Data")
    print("-" * 60)
    params_agent = ParametersAgent()
    
    test_data = {
        'client_name': 'David Chen',
        'period': 'Q4-2025',
        'holdings': [
            {'ticker': 'AAPL', 'shares': 100, 'cost_basis': 15000, 'account': 'Brokerage'},
            {'ticker': 'MSFT', 'shares': 50, 'cost_basis': 17500, 'account': 'Brokerage'}
        ],
        'accounts': [{'account_name': 'Brokerage', 'account_type': 'Taxable'}],
        'target_allocation': {'US Equity': 80, 'Fixed Income': 20},
        'transactions': [],
        'benchmark': '^GSPC'
    }
    
    params_result = await params_agent.execute(test_data)
    print(f"✓ Status: {params_result.get('status')}")
    print(f"✓ Holdings processed: {len(params_result.get('parameters', {}).get('holdings', []))}")
    print(f"✓ Client name: {params_result.get('parameters', {}).get('client_name')}")
    print(f"✓ Period: {params_result.get('parameters', {}).get('period', {}).get('name')}")
    
    # Test 5: Check required inputs logic
    print("\n[TEST 5] Required Inputs Check")
    print("-" * 60)
    from core.orchestrator import ReportOrchestrator
    orch = ReportOrchestrator()
    
    state3 = WorkflowState('test-session-3')
    state3.add_data('client_name', 'Test Client')
    state3.add_data('period', 'Q4-2025')
    state3.add_data('holdings', [{'ticker': 'AAPL', 'shares': 100}])
    
    # This should NOT require portfolio_file since holdings exist
    from core.report_schema import get_required_inputs
    required = get_required_inputs(1)
    print(f"✓ Required inputs for Step 1: {required['required']}")
    
    basic_user_inputs = ['period', 'client_name', 'benchmark']
    if 'holdings' not in state3.collected_data:
        basic_user_inputs.append('portfolio_file')
    
    missing = [req for req in required['required'] if req in basic_user_inputs and req not in state3.collected_data]
    print(f"✓ Missing inputs (should be empty or just benchmark): {missing}")
    
    print("\n" + "=" * 60)
    print("INTEGRATION TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_full_flow())
