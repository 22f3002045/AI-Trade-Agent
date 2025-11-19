from src.state import AgentState
from src.memory import FinancialSituationMemory
from src.llm_utils import get_llm

def create_risk_debator(llm, role_prompt, agent_name):
    def risk_debator_node(state: AgentState):
        # Get the arguments from the other two debaters.
        risk_state = state['risk_debate_state']
        opponents_args = []
        if agent_name != 'Risky Analyst' and risk_state['current_risky_response']: opponents_args.append(f"Risky: {risk_state['current_risky_response']}")
        if agent_name != 'Safe Analyst' and risk_state['current_safe_response']: opponents_args.append(f"Safe: {risk_state['current_safe_response']}")
        if agent_name != 'Neutral Analyst' and risk_state['current_neutral_response']: opponents_args.append(f"Neutral: {risk_state['current_neutral_response']}")
        
        # Truncate inputs to avoid token limits
        trader_plan = state['trader_investment_plan'][:5000] + "..." if len(state['trader_investment_plan']) > 5000 else state['trader_investment_plan']
        debate_history = risk_state['history'][-5000:] if len(risk_state['history']) > 5000 else risk_state['history']

        prompt = f"""{role_prompt}
        Here is the trader's plan: {trader_plan}
        Debate history: ...{debate_history}
        Your opponents' last arguments:\n{'\n'.join(opponents_args)}
        Critique or support the plan from your perspective."""
        
        response = llm.invoke(prompt).content
        
        # Update state
        new_risk_state = risk_state.copy()
        new_risk_state['history'] += f"\n{agent_name}: {response}"
        new_risk_state['latest_speaker'] = agent_name
        if agent_name == 'Risky Analyst': new_risk_state['current_risky_response'] = response
        elif agent_name == 'Safe Analyst': new_risk_state['current_safe_response'] = response
        else: new_risk_state['current_neutral_response'] = response
        new_risk_state['count'] += 1
        return {"risk_debate_state": new_risk_state}

    return risk_debator_node

def create_risk_manager(llm, memory):
    def risk_manager_node(state: AgentState):
        # Truncate inputs
        trader_plan = state['trader_investment_plan'][:5000] + "..." if len(state['trader_investment_plan']) > 5000 else state['trader_investment_plan']
        debate_history = state['risk_debate_state']['history'][-5000:] if len(state['risk_debate_state']['history']) > 5000 else state['risk_debate_state']['history']

        prompt = f"""As the Portfolio Manager, your decision is final. Review the trader's plan and the risk debate.
        Provide a final, binding decision: Buy, Sell, or Hold, and a brief justification.
        
        Trader's Plan: {trader_plan}
        Risk Debate: ...{debate_history}"""
        response = llm.invoke(prompt).content
        return {"final_trade_decision": response}
    return risk_manager_node

risk_manager_memory = FinancialSituationMemory("risk_manager_memory")

risky_prompt = "You are the Risky Risk Analyst. You advocate for high-reward opportunities and bold strategies."
safe_prompt = "You are the Safe/Conservative Risk Analyst. You prioritize capital preservation and minimizing volatility."
neutral_prompt = "You are the Neutral Risk Analyst. You provide a balanced perspective, weighing both benefits and risks."

def get_risky_node():
    llm = get_llm(model_name="gpt-4o-mini")
    return create_risk_debator(llm, risky_prompt, "Risky Analyst")

def get_safe_node():
    llm = get_llm(model_name="gpt-4o-mini")
    return create_risk_debator(llm, safe_prompt, "Safe Analyst")

def get_neutral_node():
    llm = get_llm(model_name="gpt-4o-mini")
    return create_risk_debator(llm, neutral_prompt, "Neutral Analyst")

def get_risk_manager_node():
    deep_llm = get_llm(model_name="gpt-4o")
    return create_risk_manager(deep_llm, risk_manager_memory)
