import React, { useState, useEffect } from 'react';
import { ApiKeyForm } from './components/ApiKeyForm';
import { Dashboard } from './components/Dashboard';
import { runTradeStream, type TradeResponse } from './api';

const STORAGE_KEY = 'ai_trading_agent_api_keys';

const App: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string> | null>(null);
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Partial<TradeResponse> | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Load API keys from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setApiKeys(parsed);
      }
    } catch (error) {
      console.error('Failed to load API keys from storage:', error);
    }
  }, []);

  const handleApiKeysSubmit = (keys: Record<string, string>) => {
    setApiKeys(keys);
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save API keys to storage:', error);
    }
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeys) return;

    setLoading(true);
    setResult(null);
    setLogs(['Starting analysis...']);

    try {
      await runTradeStream(ticker, apiKeys, (data) => {
        if (data.type === 'update') {
          const nodeName = data.node;
          setLogs((prev) => [...prev, `Agent finished: ${nodeName}`]);

          // Update result state with new data
          setResult((prev) => {
            const newState = { ...prev };
            if (data.data) {
              console.log('Received data from node:', nodeName, data.data);

              // Helper function to extract content from AIMessage objects or return string
              const extractContent = (field: any): string => {
                if (!field) return '';
                if (typeof field === 'string') return field;
                if (field.content) return field.content;
                return JSON.stringify(field);
              };

              // Map known state keys to result keys, extracting content from AIMessage objects
              if (data.data.market_report) newState.market_report = extractContent(data.data.market_report);
              if (data.data.sentiment_report) newState.sentiment_report = extractContent(data.data.sentiment_report);
              if (data.data.news_report) newState.news_report = extractContent(data.data.news_report);
              if (data.data.fundamentals_report) newState.fundamentals_report = extractContent(data.data.fundamentals_report);
              if (data.data.investment_plan) newState.investment_plan = extractContent(data.data.investment_plan);
              if (data.data.trader_investment_plan) newState.trader_plan = extractContent(data.data.trader_investment_plan);
              if (data.data.final_trade_decision) newState.final_decision = extractContent(data.data.final_trade_decision);

              // Handle debate states which are nested
              if (data.data.investment_debate_state) newState.investment_debate = data.data.investment_debate_state.history;
              if (data.data.risk_debate_state) newState.risk_debate = data.data.risk_debate_state.history;

              console.log('Updated state:', newState);
            }
            return newState;
          });
        } else if (data.type === 'rate_limit') {
          setLogs((prev) => [...prev, data.message || `⏱️ Rate limiting: Waiting ${data.sleep_time}s`]);
        } else if (data.type === 'complete') {
          setLogs((prev) => [...prev, 'Analysis complete.']);
          setLoading(false);
        } else if (data.type === 'error') {
          setLogs((prev) => [...prev, `Error: ${data.error}`]);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Trade failed:", error);
      setLogs((prev) => [...prev, 'Failed to start trade analysis.']);
      setLoading(false);
    }
  };

  const handleClearApiKeys = () => {
    setApiKeys(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear API keys from storage:', error);
    }
  };

  const dashboardProps = {
    ticker,
    setTicker,
    loading,
    result,
    logs,
    handleTrade,
    onClearApiKeys: handleClearApiKeys
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {!apiKeys ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
                AI Trading Agent
              </h1>
              <p className="text-gray-400">Configure your API keys to get started</p>
            </div>
            <ApiKeyForm onStart={handleApiKeysSubmit} loading={false} />
          </div>
        </div>
      ) : (
        <Dashboard {...dashboardProps} />
      )}
    </div>
  );
};

export default App;
