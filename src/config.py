import os
from typing import Dict, Any

class Config:
    def __init__(self):
        self.RESULTS_DIR = "./results"
        self.DATA_CACHE_DIR = "./data_cache"
        self.MAX_DEBATE_ROUNDS = 2
        self.MAX_RISK_DISCUSS_ROUNDS = 1
import os
from typing import Dict, Any

class Config:
    def __init__(self):
        self.RESULTS_DIR = "./results"
        self.DATA_CACHE_DIR = "./data_cache"
        self.MAX_DEBATE_ROUNDS = 2
        self.MAX_RISK_DISCUSS_ROUNDS = 1
        self.MAX_RECUR_LIMIT = 100
        
        # Create directories
        os.makedirs(self.RESULTS_DIR, exist_ok=True)
        os.makedirs(self.DATA_CACHE_DIR, exist_ok=True)

    def update_api_keys(self, api_keys: Dict[str, str]):
        """Update environment variables with provided API keys"""
        for key, value in api_keys.items():
            if value:
                os.environ[key] = value

    def validate_config(self):
        # Check for essential data tools
        if not os.getenv("TAVILY_API_KEY"):
            raise ValueError("TAVILY_API_KEY is required")
        if not os.getenv("FINNHUB_API_KEY"):
            raise ValueError("FINNHUB_API_KEY is required")
            
        # Check for at least one LLM provider
        if not (os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("OPENROUTER_API_KEY")):
             raise ValueError("At least one LLM API key (OpenAI, Gemini, or OpenRouter) is required")

    def get_llm_provider(self):
        if os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_API_KEY").strip():
            return "openai"
        elif os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY").strip():
            return "gemini"
        elif os.getenv("OPENROUTER_API_KEY") and os.getenv("OPENROUTER_API_KEY").strip():
            return "openrouter"
        return "openai" # Default fallback

config = Config()
