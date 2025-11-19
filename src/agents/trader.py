from src.state import AgentState
from src.memory import FinancialSituationMemory
from src.llm_utils import get_llm
import functools

def create_trader(llm, memory):
    def trader_node(state: AgentState, name):
        prompt = f"""You are a trading agent. Based on the provided investment plan, create a concise trading proposal. 
        Your response must end with 'FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL**'.
        
        Proposed Investment Plan: {state['investment_plan']}"""
        result = llm.invoke(prompt)
        return {"trader_investment_plan": result.content, "sender": name}
    return trader_node

trader_memory = FinancialSituationMemory("trader_memory")

def get_trader_node():
    llm = get_llm(model_name="gpt-4o-mini")
    trader_node_func = create_trader(llm, trader_memory)
    return functools.partial(trader_node_func, name="Trader")

