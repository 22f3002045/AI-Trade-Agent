import os
import yfinance as yf
import finnhub
import pandas as pd
from langchain_core.tools import tool
from stockstats import wrap as stockstats_wrap
from typing import Annotated

# Tavily tool will be initialized lazily to avoid import-time errors
tavily_tool = None

def get_tavily_tool():
    global tavily_tool
    if tavily_tool is None:
        try:
            from langchain_community.tools.tavily_search import TavilySearchResults
            tavily_tool = TavilySearchResults(max_results=3)
        except Exception as e:
            print(f"Warning: Could not initialize Tavily tool: {e}")
            tavily_tool = None
    return tavily_tool

@tool
def get_yfinance_data(
    symbol: Annotated[str, "ticker symbol of the company"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """Retrieve the stock price data for a given ticker symbol from Yahoo Finance."""
    try:
        ticker = yf.Ticker(symbol.upper())
        data = ticker.history(start=start_date, end=end_date)
        if data.empty:
            return f"No data found for symbol '{symbol}' between {start_date} and {end_date}"
        
        # Truncate if too large to avoid token limits
        if len(data) > 50:
            return f"Data truncated. Showing first 25 and last 25 rows:\n{data.head(25).to_csv()}\n...\n{data.tail(25).to_csv()}"
        
        return data.to_csv()
    except Exception as e:
        return f"Error fetching Yahoo Finance data: {e}"

@tool
def get_technical_indicators(
    symbol: Annotated[str, "ticker symbol of the company"],
    start_date: Annotated[str, "Start date in yyyy-mm-dd format"],
    end_date: Annotated[str, "End date in yyyy-mm-dd format"],
) -> str:
    """Retrieve key technical indicators for a stock using stockstats library."""
    try:
        df = yf.download(symbol, start=start_date, end=end_date, progress=False)
        if df.empty:
            return "No data to calculate indicators."
        stock_df = stockstats_wrap(df)
        indicators = stock_df[['macd', 'rsi_14', 'boll', 'boll_ub', 'boll_lb', 'close_50_sma', 'close_200_sma']]
        return indicators.tail().to_csv() # Return last 5 days for brevity
    except Exception as e:
        return f"Error calculating stockstats indicators: {e}"

@tool
def get_finnhub_news(ticker: str, start_date: str, end_date: str) -> str:
    """Get company news from Finnhub within a date range."""
    try:
        api_key = os.environ.get("FINNHUB_API_KEY")
        if not api_key:
            return "FINNHUB_API_KEY not found."
            
        finnhub_client = finnhub.Client(api_key=api_key)
        news_list = finnhub_client.company_news(ticker, _from=start_date, to=end_date)
        news_items = []
        for news in news_list[:5]: # Limit to 5 results
            news_items.append(f"Headline: {news['headline']}\nSummary: {news['summary']}")
        return "\n\n".join(news_items) if news_items else "No Finnhub news found."
    except Exception as e:
        return f"Error fetching Finnhub news: {e}"

@tool
def get_social_media_sentiment(ticker: str, trade_date: str) -> str:
    """Performs a live web search for social media sentiment regarding a stock."""
    tool = get_tavily_tool()
    if tool is None:
        return "Tavily API not configured. Please set TAVILY_API_KEY."
    query = f"social media sentiment and discussions for {ticker} stock around {trade_date}"
    return tool.invoke({"query": query})

@tool
def get_fundamental_analysis(ticker: str, trade_date: str) -> str:
    """Performs a live web search for recent fundamental analysis of a stock."""
    tool = get_tavily_tool()
    if tool is None:
        return "Tavily API not configured. Please set TAVILY_API_KEY."
    query = f"fundamental analysis and key financial metrics for {ticker} stock published around {trade_date}"
    return tool.invoke({"query": query})

@tool
def get_macroeconomic_news(trade_date: str) -> str:
    """Performs a live web search for macroeconomic news relevant to the stock market."""
    tool = get_tavily_tool()
    if tool is None:
        return "Tavily API not configured. Please set TAVILY_API_KEY."
    query = f"macroeconomic news and market trends affecting the stock market on {trade_date}"
    return tool.invoke({"query": query})

class Toolkit:
    def __init__(self):
        self.get_yfinance_data = get_yfinance_data
        self.get_technical_indicators = get_technical_indicators
        self.get_finnhub_news = get_finnhub_news
        self.get_social_media_sentiment = get_social_media_sentiment
        self.get_fundamental_analysis = get_fundamental_analysis
        self.get_macroeconomic_news = get_macroeconomic_news

toolkit = Toolkit()
