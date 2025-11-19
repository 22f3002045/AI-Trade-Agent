from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from src.config import config
import os
import time
import threading
from typing import Any, List, Optional
from langchain_core.messages import BaseMessage
from langchain_core.language_models import BaseChatModel
from langchain_core.outputs import ChatResult
from langchain_core.callbacks import CallbackManagerForLLMRun

# Global lock and timestamp for rate limiting
_rate_limit_lock = threading.Lock()
_last_request_time = 0
_min_delay = 10.0  # 10 seconds between requests (6 requests/min to be safe)
_request_count = 0
_rate_limit_callback = None

def set_rate_limit_callback(callback):
    """Set a callback function to be called when rate limiting occurs"""
    global _rate_limit_callback
    _rate_limit_callback = callback

def get_rate_limit_stats():
    """Get current rate limiting statistics"""
    return {
        "total_requests": _request_count,
        "min_delay_seconds": _min_delay,
        "last_request_time": _last_request_time
    }

class RateLimitWrapper(BaseChatModel):
    """Wrapper to enforce rate limits on LLM calls"""
    llm: BaseChatModel
    
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        global _last_request_time, _request_count, _rate_limit_callback
        
        with _rate_limit_lock:
            current_time = time.time()
            time_since_last = current_time - _last_request_time
            if time_since_last < _min_delay:
                sleep_time = _min_delay - time_since_last
                print(f"⏱️  Rate limiting: Waiting {sleep_time:.1f}s (Request #{_request_count + 1})")
                
                # Notify callback if set
                if _rate_limit_callback:
                    try:
                        _rate_limit_callback({
                            "type": "rate_limit",
                            "sleep_time": sleep_time,
                            "request_number": _request_count + 1
                        })
                    except Exception as e:
                        print(f"Warning: Rate limit callback failed: {e}")
                
                time.sleep(sleep_time)
            
            _last_request_time = time.time()
            _request_count += 1
            
        return self.llm._generate(messages, stop=stop, run_manager=run_manager, **kwargs)

    @property
    def _llm_type(self) -> str:
        return "rate_limited_gemini"
        
    def bind_tools(self, tools, **kwargs):
        # Let the underlying LLM handle the tool conversion/binding logic
        binding = self.llm.bind_tools(tools, **kwargs)
        
        # Create a new binding that uses 'self' (the wrapper) but keeps the formatted tools
        # We use the same class as the returned binding (usually RunnableBinding)
        return binding.__class__(bound=self, kwargs=binding.kwargs, config=binding.config)

def get_llm(model_name="gpt-4o-mini", provider=None):
    """Get LLM instance based on provider"""
    if provider is None:
        provider = config.get_llm_provider()
    
    print(f"DEBUG: Using LLM Provider: {provider}")

    if provider == "gemini":
        # Allow user to override model via env var.
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        llm = ChatGoogleGenerativeAI(
            model=model_name, 
            temperature=0.1,
            max_retries=5,
            request_timeout=120
        )
        return RateLimitWrapper(llm=llm)
    
    # Default to OpenAI
    return ChatOpenAI(model=model_name, temperature=0.1)

