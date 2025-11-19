from typing import TypedDict, Annotated, List
from langgraph.graph import MessagesState
from langchain_core.messages import BaseMessage
import operator

class InvestDebateState(TypedDict):
    bull_history: str
    bear_history: str
    history: str
    current_response: str
    judge_decision: str
    count: int

class RiskDebateState(TypedDict):
    risky_history: str
    safe_history: str
    neutral_history: str
    history: str
    latest_speaker: str
    current_risky_response: str
    current_safe_response: str
    current_neutral_response: str
    judge_decision: str
    count: int

class AgentState(MessagesState):
    company_of_interest: str
    trade_date: str
    sender: str
    market_report: str
    sentiment_report: str
    news_report: str
    fundamentals_report: str
    investment_debate_state: InvestDebateState
    investment_plan: str
    trader_investment_plan: str
    risk_debate_state: RiskDebateState
    final_trade_decision: str
