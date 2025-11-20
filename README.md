# AI Trading Agent 🤖📈

A sophisticated multi-agent financial analysis system powered by LangGraph and Google's Gemini AI. This project leverages multiple specialized AI agents working in concert to provide comprehensive stock market analysis, combining technical indicators, sentiment analysis, fundamental data, and strategic risk assessment.

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![LangGraph](https://img.shields.io/badge/LangGraph-Latest-FF6B6B.svg)

## 🌟 Features

### Multi-Agent Architecture
- **Market Analyst**: Analyzes technical indicators, price action, and volatility using yfinance and stockstats
- **Social Analyst**: Evaluates social media sentiment and public discussions
- **News Analyst**: Aggregates and analyzes recent news and macroeconomic trends
- **Fundamentals Analyst**: Examines company financials, insider transactions, and fundamental health
- **Investment Debaters**: Bull vs Bear debate to evaluate investment potential
- **Risk Debaters**: Three-way debate (Risky, Safe, Neutral) to assess risk profiles
- **Portfolio Manager**: Synthesizes all analyses into actionable investment strategies

### Intelligent Rate Limiting
- Automatic API request throttling to stay within Gemini's free tier limits
- Real-time rate limiting notifications in the UI
- Configurable delays for different API plans
- Thread-safe implementation preventing quota exceeded errors

### Modern Web Interface
- Real-time streaming updates during analysis
- Interactive navigation between different analysis sections
- Live activity log with color-coded status messages
- Responsive design with dark mode aesthetics
- URL-based routing for bookmarkable views

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dashboard  │  Market  │  Sentiment  │  Strategy     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/SSE
┌────────────────────────▼────────────────────────────────────┐
│                   Backend (FastAPI + LangGraph)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Multi-Agent Workflow (LangGraph)            │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │  │
│  │  │Market  │→ │Social  │→ │News    │→ │Fundmtl │    │  │
│  │  │Analyst │  │Analyst │  │Analyst │  │Analyst │    │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │  │
│  │       ↓           ↓           ↓           ↓         │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │         Investment & Risk Debates            │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                        ↓                            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │         Portfolio Manager (Final Decision)   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              External APIs & Data Sources                    │
│  • Gemini AI (LLM)  • Yahoo Finance  • Finnhub  • Tavily   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18+ and npm
- API Keys:
  - Google Gemini API key (required)
  - Finnhub API key (optional, for news)
  - Tavily API key (optional, for web search)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Trading AI Agent"
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

### Running the Application

1. **Start the Backend**
   ```bash
   python -m src.main
   ```
   Backend will run on `http://localhost:8000`

2. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

3. **Access the Application**
   - Open your browser to `http://localhost:5173`
   - Enter your API keys when prompted
   - Input a stock ticker (e.g., AAPL, TSLA, NVDA)
   - Click "Run Analysis" and watch the magic happen!

## 📊 Usage Example

```bash
# Example: Analyzing Apple Inc.
1. Enter ticker: AAPL
2. Click "Run Analysis"
3. Watch real-time updates in the Live Activity log
4. Navigate between tabs to view different analyses:
   - Overview & Decision: Final trading recommendation
   - Market Analysis: Technical indicators and price action
   - Sentiment & News: Social sentiment and recent news
   - Fundamentals: Financial health and metrics
   - Strategy & Risk: Debate outcomes and risk assessment
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: High-performance async web framework
- **LangGraph**: Agent orchestration and workflow management
- **LangChain**: LLM integration and tooling
- **Google Gemini**: Advanced language model (gemini-2.5-flash)
- **yfinance**: Stock market data retrieval
- **stockstats**: Technical indicator calculations
- **Finnhub**: Financial news API
- **Tavily**: Web search for sentiment analysis

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **React Router**: Client-side routing
- **TailwindCSS**: Utility-first styling
- **Lucide React**: Beautiful icon library
- **React Markdown**: Markdown rendering

## ⚙️ Configuration

### Rate Limiting

The system includes intelligent rate limiting to prevent API quota issues:

```python
# In src/llm_utils.py
_min_delay = 10.0  # 10 seconds between requests (6 RPM)
```

Adjust based on your Gemini API plan:
- Free tier: 10 RPM → `_min_delay = 10.0`
- Paid tier (30 RPM): `_min_delay = 2.0`
- Paid tier (60 RPM): `_min_delay = 1.0`

See `RATE_LIMITING_GUIDE.md` for detailed information.

### Request Timeout

```python
# In src/llm_utils.py
request_timeout=120  # 120 seconds for complex analyses
```

Increase if you experience timeout errors on slower connections.

## 📁 Project Structure

```
Trading AI Agent/
├── src/
│   ├── agents/          # Agent implementations
│   │   ├── analyst.py   # Market/Social/News/Fundamentals analysts
│   │   ├── debate.py    # Investment and risk debate agents
│   │   ├── trader.py    # Portfolio manager
│   │   └── risk_manager.py
│   ├── tools/           # External API integrations
│   │   └── market_tools.py
│   ├── config.py        # Configuration management
│   ├── graph.py         # LangGraph workflow definition
│   ├── llm_utils.py     # LLM initialization and rate limiting
│   ├── main.py          # FastAPI application
│   ├── memory.py        # Agent memory management
│   └── state.py         # State definitions
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── Dashboard.tsx
│   │   │   └── ApiKeyForm.tsx
│   │   ├── App.tsx      # Main application
│   │   ├── api.ts       # API client
│   │   └── main.tsx     # Entry point
│   ├── public/
│   └── package.json
├── .env.example         # Environment variable template
├── .gitignore
├── requirements.txt     # Python dependencies
├── README.md
└── RATE_LIMITING_GUIDE.md
```

## 🔒 Security Notes

- Never commit your `.env` file or API keys to version control
- The `.env.example` file is provided as a template
- API keys are entered through the UI and stored only in memory
- All sensitive data is excluded via `.gitignore`

## 🐛 Troubleshooting

### Rate Limit Errors
- **Issue**: `ResourceExhausted: 429 You exceeded your current quota`
- **Solution**: The rate limiter should prevent this. If it occurs, increase `_min_delay` in `src/llm_utils.py`

### Timeout Errors
- **Issue**: `DeadlineExceeded: 504 The request timed out`
- **Solution**: Increase `request_timeout` in `src/llm_utils.py` to 180 or 240

### Port Already in Use
- **Issue**: `error while attempting to bind on address`
- **Solution**: 
  ```bash
  npx kill-port 8000 5173
  ```

### Missing Dependencies
- **Issue**: `ModuleNotFoundError`
- **Solution**: 
  ```bash
  pip install -r requirements.txt
  cd frontend && npm install
  ```

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests with improvements
- Share your analysis results and insights

## 📝 License

This project is provided as-is for educational and personal use.

## 🙏 Acknowledgments

- Google Gemini for powerful AI capabilities
- LangChain and LangGraph teams for excellent agent frameworks
- The open-source community for amazing tools and libraries

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

*Disclaimer: This tool is for educational and informational purposes only. Not financial advice. Always do your own research before making investment decisions.*
