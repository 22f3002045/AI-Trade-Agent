import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ApiKeyForm } from './components/ApiKeyForm';
import { Dashboard } from './components/Dashboard';
import { runTradeStream, type TradeResponse } from './api';

const App: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string> | null>(null);
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Partial<TradeResponse> | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleApiKeysSubmit = (keys: Record<string, string>) => {
    setApiKeys(keys);
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
              // Map known state keys to result keys
              if (data.data.market_report) newState.market_report = data.data.market_report;
              if (data.data.sentiment_report) newState.sentiment_report = data.data.sentiment_report;
              if (data.data.news_report) newState.news_report = data.data.news_report;
              if (data.data.fundamentals_report) newState.fundamentals_report = data.data.fundamentals_report;
              if (data.data.investment_plan) newState.investment_plan = data.data.investment_plan;
              if (data.data.trader_investment_plan) newState.trader_plan = data.data.trader_investment_plan;
              if (data.data.final_trade_decision) newState.final_decision = data.data.final_trade_decision;

              // Handle debate states which are nested
              if (data.data.investment_debate_state) newState.investment_debate = data.data.investment_debate_state.history;
              if (data.data.risk_debate_state) newState.risk_debate = data.data.risk_debate_state.history;
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

  const dashboardProps = {
    ticker,
    setTicker,
    loading,
    result,
    logs,
    handleTrade
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
        <Routes>
          <Route path="/" element={<Dashboard {...dashboardProps} />} />
          <Route path="/market" element={<Dashboard {...dashboardProps} />} />
          <Route path="/sentiment" element={<Dashboard {...dashboardProps} />} />
          <Route path="/fundamentals" element={<Dashboard {...dashboardProps} />} />
          <Route path="/strategy" element={<Dashboard {...dashboardProps} />} />
        </Routes>
      )}
    </div>
  );
};

export default App;
