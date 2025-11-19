from src.state import AgentState
from src.memory import FinancialSituationMemory
from src.llm_utils import get_llm

def create_researcher_node(llm, memory, role_prompt, agent_name):
    def researcher_node(state: AgentState):
        # Combine all reports and debate history for context.
        # Truncate reports to avoid hitting token limits
        market_report = state['market_report'][:2000] + "..." if len(state['market_report']) > 2000 else state['market_report']
        sentiment_report = state['sentiment_report'][:2000] + "..." if len(state['sentiment_report']) > 2000 else state['sentiment_report']
        news_report = state['news_report'][:2000] + "..." if len(state['news_report']) > 2000 else state['news_report']
        fundamentals_report = state['fundamentals_report'][:2000] + "..." if len(state['fundamentals_report']) > 2000 else state['fundamentals_report']

        situation_summary = f"""
        Market Report: {market_report}
        Sentiment Report: {sentiment_report}
        News Report: {news_report}
        Fundamentals Report: {fundamentals_report}
        """
        past_memories = memory.get_memories(situation_summary)
        past_memory_str = "\n".join([mem['recommendation'] for mem in past_memories])
        
        prompt = f"""{role_prompt}
        Here is the current state of the analysis:
        {situation_summary}
        Conversation history: {state['investment_debate_state']['history']}
        Your opponent's last argument: {state['investment_debate_state']['current_response']}
        Reflections from similar past situations: {past_memory_str or 'No past memories found.'}
        Based on all this information, present your argument conversationally."""
        
        response = llm.invoke(prompt)
        argument = f"{agent_name}: {response.content}"
        
        # Update the debate state
        debate_state = state['investment_debate_state'].copy()
        debate_state['history'] += "\n" + argument
        if agent_name == 'Bull Analyst':
            debate_state['bull_history'] += "\n" + argument
        else:
            debate_state['bear_history'] += "\n" + argument
        debate_state['current_response'] = argument
        debate_state['count'] += 1
        return {"investment_debate_state": debate_state}

    return researcher_node

def create_research_manager(llm, memory):
    def research_manager_node(state: AgentState):
        prompt = f"""As the Research Manager, your role is to critically evaluate the debate between the Bull and Bear analysts and make a definitive decision.
        Summarize the key points, then provide a clear recommendation: Buy, Sell, or Hold. Develop a detailed investment plan for the trader, including your rationale and strategic actions.
        
        Debate History:
        {state['investment_debate_state']['history']}"""
        response = llm.invoke(prompt)
        return {"investment_plan": response.content}
    return research_manager_node

# Initialize Memories (these are safe to initialize at module level)
bull_memory = FinancialSituationMemory("bull_memory")
bear_memory = FinancialSituationMemory("bear_memory")
invest_judge_memory = FinancialSituationMemory("invest_judge_memory")

bull_prompt = "You are a Bull Analyst. Your goal is to argue for investing in the stock. Focus on growth potential, competitive advantages, and positive indicators from the reports. Counter the bear's arguments effectively."
bear_prompt = "You are a Bear Analyst. Your goal is to argue against investing in the stock. Focus on risks, challenges, and negative indicators. Counter the bull's arguments effectively."

# Factory functions
def get_bull_researcher_node():
    llm = get_llm(model_name="gpt-4o-mini")
    return create_researcher_node(llm, bull_memory, bull_prompt, "Bull Analyst")

def get_bear_researcher_node():
    llm = get_llm(model_name="gpt-4o-mini")
    return create_researcher_node(llm, bear_memory, bear_prompt, "Bear Analyst")

def get_research_manager_node():
    deep_llm = get_llm(model_name="gpt-4o")
    return create_research_manager(deep_llm, invest_judge_memory)

