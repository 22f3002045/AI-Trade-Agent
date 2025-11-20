# Gemini API Rate Limiting Guide

## Overview
This system implements intelligent rate limiting to prevent hitting Gemini's API quota limits while providing real-time feedback to users.

## Implementation Details

### Backend Rate Limiting (`src/llm_utils.py`)

**Key Features:**
- **10-second delay** between consecutive API requests (6 requests/minute)
- **Request tracking** with global counter
- **Callback system** for real-time notifications
- **Thread-safe** implementation using locks

**Configuration:**
```python
_min_delay = 10.0  # 10 seconds between requests
```

### Request Timeout
- Increased from 60s to **120 seconds** to handle complex analysis tasks
- Prevents `DeadlineExceeded` errors during long-running operations

### Frontend Display (`frontend/src/components/Dashboard.tsx`)

**Visual Indicators:**
- Rate limiting messages appear in **yellow** in the Live Activity log
- Clock emoji (⏱️) prefix for easy identification
- Shows wait time and request number
- Example: `⏱️ Rate limiting: Waiting 7.5s (Request #3)`

## How It Works

1. **Before Each Request:**
   - System checks time since last request
   - If < 10 seconds, waits for remaining time
   - Displays notification in UI

2. **During Analysis:**
   - Multiple agents make sequential API calls
   - Each call is automatically throttled
   - Users see progress in real-time

3. **User Experience:**
   - Transparent rate limiting status
   - No unexpected errors
   - Clear indication of system activity

## Gemini Free Tier Limits

- **10 requests per minute** per model
- **1,500 requests per day**
- Our implementation: **6 requests per minute** (safe buffer)

## Testing the System

### 1. Start Backend
```bash
cd "E:\Trading AI Agent"
python -m src.main
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Run Analysis
- Enter a ticker (e.g., AAPL)
- Click "Run Analysis"
- Watch the Live Activity log for rate limiting messages

### Expected Behavior
You should see messages like:
```
[timestamp] Agent started: Market Analyst
[timestamp] ⏱️ Rate limiting: Waiting 8.2s (Request #2)
[timestamp] Agent finished: Market Analyst
[timestamp] Agent started: Social Analyst
[timestamp] ⏱️ Rate limiting: Waiting 9.5s (Request #3)
```

## Monitoring API Usage

### Backend Console
The backend logs show:
```
DEBUG: Using LLM Provider: gemini
⏱️ Rate limiting: Waiting 7.9s (Request #2)
```

### Frontend UI
- **Live Activity** section shows all rate limiting events
- Yellow highlighting makes them easy to spot
- Timestamps help track analysis progress

## Troubleshooting

### Still Getting Rate Limit Errors?

1. **Check the delay setting:**
   - Open `src/llm_utils.py`
   - Increase `_min_delay` to 12.0 or 15.0

2. **Verify single instance:**
   - Ensure only one backend server is running
   - Kill any duplicate processes on port 8000

3. **Monitor request count:**
   - Backend logs show request numbers
   - If hitting daily limit, wait 24 hours or upgrade plan

### Timeout Errors?

1. **Increase timeout:**
   - In `src/llm_utils.py`, increase `request_timeout=120` to 180 or 240

2. **Check network:**
   - Slow connections may need higher timeouts
   - Verify stable internet connection

## Upgrading Gemini Plan

If you upgrade to a paid plan with higher limits:

1. **Adjust rate limit:**
   ```python
   # In src/llm_utils.py
   _min_delay = 2.0  # For 30 RPM plan
   _min_delay = 1.0  # For 60 RPM plan
   ```

2. **Restart backend** to apply changes

## Benefits

✅ **No quota exceeded errors**
✅ **Transparent user experience**
✅ **Real-time progress tracking**
✅ **Automatic request throttling**
✅ **Thread-safe implementation**
✅ **Easy to configure**

## Technical Architecture

```
User Request
    ↓
Frontend (App.tsx)
    ↓
Backend API (main.py)
    ↓
Graph Execution
    ↓
Multiple Agents
    ↓
RateLimitWrapper (llm_utils.py)
    ↓
Gemini API
    ↓
Response Stream
    ↓
Frontend Display
```

## Files Modified

1. **`src/llm_utils.py`** - Core rate limiting logic
2. **`src/main.py`** - Event streaming with rate limit notifications
3. **`frontend/src/App.tsx`** - Rate limit event handling
4. **`frontend/src/components/Dashboard.tsx`** - UI display enhancements