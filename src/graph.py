from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import HumanMessage, RemoveMessage
from src.state import AgentState
from src.config import config
from src.tools.market_tools import toolkit

class ConditionalLogic:
    def __init__(self, max_debate_rounds=1, max_risk_discuss_rounds=1):
        self.max_debate_rounds = max_debate_rounds
        self.max_risk_discuss_rounds = max_risk_discuss_rounds

    def should_continue_analyst(self, state: AgentState):
        return "tools" if tools_condition(state) == "tools" else "continue"

    def should_continue_debate(self, state: AgentState) -> str:
        if state["investment_debate_state"]["count"] >= 2 * self.max_debate_rounds:
            return "Research Manager"
        return "Bear Researcher" if state["investment_debate_state"]["current_response"].startswith("Bull") else "Bull Researcher"

    def should_continue_risk_analysis(self, state: AgentState) -> str:
        if state["risk_debate_state"]["count"] >= 3 * self.max_risk_discuss_rounds:
            return "Risk Judge"
        speaker = state["risk_debate_state"]["latest_speaker"]
        if speaker == "Risky Analyst": return "Safe Analyst"
        if speaker == "Safe Analyst": return "Neutral Analyst"
        return "Risky Analyst"

def create_msg_delete():
    def delete_messages(state):
        return {"messages": [RemoveMessage(id=m.id) for m in state["messages"]] + [HumanMessage(content="Continue")]}
    return delete_messages

def build_graph():
    """Build the graph lazily when needed"""
    # Import agent factory functions
    from src.agents.analyst import (
        get_market_analyst_node,
        get_social_analyst_node,
        get_news_analyst_node,
        get_fundamentals_analyst_node,
    )
    from src.agents.researcher import (
        get_bull_researcher_node,
        get_bear_researcher_node,
        get_research_manager_node,
    )
    from src.agents.trader import get_trader_node
    from src.agents.risk_manager import (
        get_risky_node,
        get_safe_node,
        get_neutral_node,
        get_risk_manager_node,
    )
    
    conditional_logic = ConditionalLogic(
        max_debate_rounds=config.MAX_DEBATE_ROUNDS,
        max_risk_discuss_rounds=config.MAX_RISK_DISCUSS_ROUNDS
    )
    msg_clear_node = create_msg_delete()

    # Create tool nodes
    market_tool_node = ToolNode([toolkit.get_yfinance_data, toolkit.get_technical_indicators])
    social_tool_node = ToolNode([toolkit.get_social_media_sentiment])
    news_tool_node = ToolNode([toolkit.get_finnhub_news, toolkit.get_macroeconomic_news])
    fundamentals_tool_node = ToolNode([toolkit.get_fundamental_analysis])

    workflow = StateGraph(AgentState)

    # Add Analyst Nodes
    workflow.add_node("Market Analyst", get_market_analyst_node())
    workflow.add_node("Social Analyst", get_social_analyst_node())
    workflow.add_node("News Analyst", get_news_analyst_node())
    workflow.add_node("Fundamentals Analyst", get_fundamentals_analyst_node())
    workflow.add_node("Msg Clear", msg_clear_node)

    # Add tool nodes
    workflow.add_node("market_tools", market_tool_node)
    workflow.add_node("social_tools", social_tool_node)
    workflow.add_node("news_tools", news_tool_node)
    workflow.add_node("fundamentals_tools", fundamentals_tool_node)

    # Add Researcher Nodes
    workflow.add_node("Bull Researcher", get_bull_researcher_node())
    workflow.add_node("Bear Researcher", get_bear_researcher_node())
    workflow.add_node("Research Manager", get_research_manager_node())

    # Add Trader and Risk Nodes
    workflow.add_node("Trader", get_trader_node())
    workflow.add_node("Risky Analyst", get_risky_node())
    workflow.add_node("Safe Analyst", get_safe_node())
    workflow.add_node("Neutral Analyst", get_neutral_node())
    workflow.add_node("Risk Judge", get_risk_manager_node())

    # Define Entry Point
    workflow.set_entry_point("Market Analyst")

    # Analyst edges
    workflow.add_conditional_edges("Market Analyst", conditional_logic.should_continue_analyst, {"tools": "market_tools", "continue": "Social Analyst"})
    workflow.add_edge("market_tools", "Market Analyst")

    workflow.add_conditional_edges("Social Analyst", conditional_logic.should_continue_analyst, {"tools": "social_tools", "continue": "News Analyst"})
    workflow.add_edge("social_tools", "Social Analyst")

    workflow.add_conditional_edges("News Analyst", conditional_logic.should_continue_analyst, {"tools": "news_tools", "continue": "Fundamentals Analyst"})
    workflow.add_edge("news_tools", "News Analyst")

    workflow.add_conditional_edges("Fundamentals Analyst", conditional_logic.should_continue_analyst, {"tools": "fundamentals_tools", "continue": "Bull Researcher"})
    workflow.add_edge("fundamentals_tools", "Fundamentals Analyst")

    # Researcher Debate
    workflow.add_edge("Bull Researcher", "Bear Researcher")
    workflow.add_conditional_edges("Bear Researcher", conditional_logic.should_continue_debate, 
                                   {"Bull Researcher": "Bull Researcher", "Research Manager": "Research Manager"})

    # Manager to Trader
    workflow.add_edge("Research Manager", "Trader")

    # Trader to Risk
    workflow.add_edge("Trader", "Risky Analyst")

    # Risk Debate
    workflow.add_edge("Risky Analyst", "Safe Analyst")
    workflow.add_edge("Safe Analyst", "Neutral Analyst")
    workflow.add_conditional_edges("Neutral Analyst", conditional_logic.should_continue_risk_analysis,
                                   {"Risky Analyst": "Risky Analyst", "Safe Analyst": "Safe Analyst", "Risk Judge": "Risk Judge"})

    workflow.add_edge("Risk Judge", END)

    return workflow.compile()

# Don't build the graph at import time
graph = None

def get_graph():
    """Get or build the graph"""
    global graph
    if graph is None:
        graph = build_graph()
    return graph
