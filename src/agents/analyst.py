from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from src.state import AgentState
from src.tools.market_tools import toolkit
import os
from src.llm_utils import get_llm

from langchain_core.messages import AIMessage, ToolMessage

def filter_messages(messages):
    """
    Filter out tool messages and tool calls from previous agents.
    Keep all HumanMessages.
    Keep all AIMessages that are reports (no tool calls).
    Keep tool-related messages ONLY if they are part of the current unfinished sequence.
    Also truncate very long tool responses to prevent context overflow.
    """
    filtered = []
    MAX_TOOL_RESPONSE_LENGTH = 2000  # Drastically limit to stay within free tier quota
    
    # Find indices of all "Report" messages (AIMessages without tool calls)
    report_indices = [i for i, m in enumerate(messages) if isinstance(m, AIMessage) and not m.tool_calls]
    
    for i, m in enumerate(messages):
        # Always keep HumanMessages
        if not isinstance(m, (AIMessage, ToolMessage)):
            filtered.append(m)
            continue
            
        # Check if it's a Report (AIMessage with no tool calls)
        if isinstance(m, AIMessage) and not m.tool_calls:
            # Truncate very long reports
            if len(m.content) > MAX_TOOL_RESPONSE_LENGTH:
                truncated_message = AIMessage(
                    content=m.content[:MAX_TOOL_RESPONSE_LENGTH] + "\n\n[... Report truncated for brevity ...]"
                )
                filtered.append(truncated_message)
            else:
                filtered.append(m)
            continue
            
        # It's a ToolMessage or AIMessage with tool calls
        # Check if there is a Report message AFTER this one
        has_subsequent_report = any(r_idx > i for r_idx in report_indices)
        
        if not has_subsequent_report:
            # This is part of the current active chain (no report finished it yet)
            # Truncate tool messages if they're too long
            if isinstance(m, ToolMessage) and len(m.content) > MAX_TOOL_RESPONSE_LENGTH:
                truncated_tool_msg = ToolMessage(
                    content=m.content[:MAX_TOOL_RESPONSE_LENGTH] + "\n\n[... Tool response truncated ...]",
                    tool_call_id=m.tool_call_id
                )
                filtered.append(truncated_tool_msg)
            else:
                filtered.append(m)
            
    return filtered

def create_analyst_node(llm, system_message, tools, output_field):
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    # Bind tools to LLM
    llm_with_tools = llm.bind_tools(tools)
    
    def analyst_node(state: AgentState):
        messages = state["messages"]
        
        # Filter messages to reduce context size
        filtered_messages = filter_messages(messages)
        
        chain = prompt | llm_with_tools
        result = chain.invoke({"messages": filtered_messages})
        
        print(f"DEBUG: Analyst Node Result Type: {type(result)}")
        # print(f"DEBUG: Analyst Node Result: {result}") # Reduce log noise

        # Check if result has tool_calls attribute
        if not hasattr(result, 'tool_calls'):
            print("WARNING: Result does not have tool_calls attribute.")
            # If it's a message but missing tool_calls, it might be just content
            if hasattr(result, 'content'):
                 return {
                    "messages": [result],
                    output_field: result.content,
                    "sender": "Analyst" 
                }
            return {"messages": [result], "sender": "Analyst"}

        if not result.tool_calls:
            # If no tool calls, we assume the analyst has finished and provided the report.
            # We return the content as the report.
            return {
                "messages": [result],
                output_field: result.content,
                "sender": "Analyst" 
            }
        
        # If tool calls, return the message with tool calls so the tool node can execute them
        return {"messages": [result], "sender": "Analyst"}
    return analyst_node

# Define System Messages
market_analyst_system_message = "You are a trading assistant specialized in analyzing financial markets. Your role is to select the most relevant technical indicators to analyze a stock's price action, momentum, and volatility. You must use your tools to get historical data and then generate a report with your findings, including a summary table."
social_analyst_system_message = "You are a social media analyst. Your job is to analyze social media posts and public sentiment for a specific company over the past week. Use your tools to find relevant discussions and write a comprehensive report detailing your analysis, insights, and implications for traders, including a summary table."
news_analyst_system_message = "You are a news researcher analyzing recent news and trends over the past week. Write a comprehensive report on the current state of the world relevant for trading and macroeconomics. Use your tools to be comprehensive and provide detailed analysis, including a summary table."
fundamentals_analyst_system_message = "You are a researcher analyzing fundamental information about a company. Write a comprehensive report on the company's financials, insider sentiment, and transactions to gain a full view of its fundamental health, including a summary table."

# Factory functions to create nodes on demand
def get_market_analyst_node():
    llm = get_llm()
    return create_analyst_node(llm, market_analyst_system_message, [toolkit.get_yfinance_data, toolkit.get_technical_indicators], "market_report")

def get_social_analyst_node():
    llm = get_llm()
    return create_analyst_node(llm, social_analyst_system_message, [toolkit.get_social_media_sentiment], "sentiment_report")

def get_news_analyst_node():
    llm = get_llm()
    return create_analyst_node(llm, news_analyst_system_message, [toolkit.get_finnhub_news, toolkit.get_macroeconomic_news], "news_report")

def get_fundamentals_analyst_node():
    llm = get_llm()
    return create_analyst_node(llm, fundamentals_analyst_system_message, [toolkit.get_fundamental_analysis], "fundamentals_report")
