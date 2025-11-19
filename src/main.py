from dotenv import load_dotenv
import os

# Load environment variables from .env file FIRST
load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.graph import get_graph
from src.state import AgentState, InvestDebateState, RiskDebateState
from src.config import config
from langchain_core.messages import HumanMessage
import datetime
import uvicorn
import threading
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Multi-Agent Trading System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TradeRequest(BaseModel):
    ticker: str
    api_keys: dict

@app.post("/trade")
async def run_trade(request: TradeRequest):
    # Update API keys in environment
    config.update_api_keys(request.api_keys)
    
    # Initialize State
    trade_date = datetime.date.today().strftime('%Y-%m-%d')
from dotenv import load_dotenv
import os

# Load environment variables from .env file FIRST
load_dotenv()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.graph import get_graph
from src.state import AgentState, InvestDebateState, RiskDebateState
from src.config import config
from langchain_core.messages import HumanMessage
import datetime
import uvicorn
import threading
from fastapi.middleware.cors import CORSMiddleware
import traceback

app = FastAPI(title="Multi-Agent Trading System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TradeRequest(BaseModel):
    ticker: str
    api_keys: dict

from fastapi.responses import StreamingResponse
import json

@app.post("/trade")
async def run_trade(request: TradeRequest):
    # Update config with provided API keys
    config.update_api_keys(request.api_keys)
    
    try:
        config.validate_config()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    initial_state = {
        "company_of_interest": request.ticker,
        "trade_date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "sender": "User",
        "messages": [HumanMessage(content=f"Analyze {request.ticker}")],
        "market_report": "",
        "sentiment_report": "",
        "news_report": "",
        "fundamentals_report": "",
        "investment_plan": "",
        "trader_investment_plan": "",
        "final_trade_decision": "",
        "investment_debate_state": {
            "bull_history": "",
            "bear_history": "",
            "history": "",
            "current_response": "",
            "judge_decision": "",
            "count": 0
        },
        "risk_debate_state": {
            "risky_history": "",
            "safe_history": "",
            "neutral_history": "",
            "history": "",
            "latest_speaker": "",
            "current_risky_response": "",
            "current_safe_response": "",
            "current_neutral_response": "",
            "judge_decision": "",
            "count": 0
        }
    }

    def event_stream():
        import queue
        rate_limit_queue = queue.Queue()
        
        def rate_limit_callback(data):
            rate_limit_queue.put(data)
        
        try:
            # Import and set the rate limit callback
            from src.llm_utils import set_rate_limit_callback
            set_rate_limit_callback(rate_limit_callback)
            
            graph = get_graph()
            
            # Use stream to get updates from each node
            for event in graph.stream(initial_state):
                # Check for any rate limit events
                while not rate_limit_queue.empty():
                    try:
                        rate_data = rate_limit_queue.get_nowait()
                        yield json.dumps({
                            "type": "rate_limit",
                            "message": f"⏱️ Rate limiting: Waiting {rate_data['sleep_time']:.1f}s (Request #{rate_data['request_number']})",
                            "sleep_time": rate_data['sleep_time'],
                            "request_number": rate_data['request_number']
                        }) + "\n"
                    except queue.Empty:
                        break
                
                # event is a dict like {'Node Name': {'updated_key': 'value'}}
                for node_name, data in event.items():
                    # Create a simplified event object for the frontend
                    payload = {
                        "type": "update",
                        "node": node_name,
                        "data": data
                    }
                    yield json.dumps(payload, default=str) + "\n"
            
            # Signal completion
            yield json.dumps({"type": "complete"}) + "\n"
            
        except Exception as e:
            print("Error running trade workflow:")
            traceback.print_exc()
            yield json.dumps({"type": "error", "error": str(e)}) + "\n"
        finally:
            # Clear the callback
            from src.llm_utils import set_rate_limit_callback
            set_rate_limit_callback(None)

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
