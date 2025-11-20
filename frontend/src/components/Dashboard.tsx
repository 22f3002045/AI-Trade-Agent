import React, { useState, useEffect } from 'react';
import { type TradeResponse } from '../api';
import { Activity, TrendingUp, AlertTriangle, FileText, MessageSquare, CheckCircle, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';

interface DashboardProps {
    ticker: string;
    setTicker: (ticker: string) => void;
    loading: boolean;
    result: Partial<TradeResponse> | null;
    logs: string[];
    handleTrade: (e: React.FormEvent) => Promise<void>;
    onClearApiKeys: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    ticker,
    setTicker,
    loading,
    result,
    logs,
    handleTrade,
    onClearApiKeys
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        console.log('Dashboard result updated:', result);
    }, [result]);

    const handleDownloadPDF = () => {
        if (!result) return;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            const lines = pdf.splitTextToSize(text, maxWidth);
            lines.forEach((line: string) => {
                if (yPosition > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }
                pdf.text(line, margin, yPosition);
                yPosition += fontSize * 0.5;
            });
            yPosition += 3;
        };

        const cleanMarkdown = (text: string): string => {
            if (typeof text !== 'string') return '';
            return text.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1').replace(/`/g, '').trim();
        };

        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AI Trading Analysis Report', pageWidth / 2, 20, { align: 'center' });
        yPosition = 40;
        pdf.setTextColor(0, 0, 0);

        addText(`Ticker: ${ticker.toUpperCase()}`, 14, true);
        addText(`Generated: ${new Date().toLocaleString()}`, 10);
        yPosition += 5;

        if (result.final_decision) {
            pdf.setFillColor(220, 252, 231);
            pdf.rect(margin - 5, yPosition - 5, maxWidth + 10, 10, 'F');
            addText('FINAL DECISION', 16, true);
            addText(cleanMarkdown(result.final_decision), 10);
            yPosition += 5;
        }
        if (result.market_report) {
            addText('MARKET ANALYSIS', 14, true);
            addText(cleanMarkdown(result.market_report), 9);
            yPosition += 5;
        }
        if (result.sentiment_report) {
            addText('SENTIMENT ANALYSIS', 14, true);
            addText(cleanMarkdown(result.sentiment_report), 9);
            yPosition += 5;
        }
        if (result.news_report) {
            addText('NEWS REPORT', 14, true);
            addText(cleanMarkdown(result.news_report), 9);
            yPosition += 5;
        }
        if (result.fundamentals_report) {
            addText('FUNDAMENTAL ANALYSIS', 14, true);
            addText(cleanMarkdown(result.fundamentals_report), 9);
            yPosition += 5;
        }
        if (result.investment_plan) {
            addText('INVESTMENT PLAN', 14, true);
            addText(cleanMarkdown(result.investment_plan), 9);
            yPosition += 5;
        }
        if (result.trader_plan) {
            addText('TRADER PLAN', 14, true);
            addText(cleanMarkdown(result.trader_plan), 9);
            yPosition += 5;
        }
        if (result.risk_debate) {
            addText('RISK DEBATE', 14, true);
            addText(cleanMarkdown(result.risk_debate), 9);
            yPosition += 5;
        }
        if (result.investment_debate) {
            addText('INVESTMENT DEBATE', 14, true);
            addText(cleanMarkdown(result.investment_debate), 9);
        }

        const fileName = `${ticker.toUpperCase()}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                            AI Trading Agent
                        </h1>
                        <p className="text-gray-400 mt-2">Multi-Agent Financial Analysis System</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center">
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                placeholder="Enter Ticker (e.g. AAPL)"
                                className="bg-transparent border-none focus:ring-0 text-white font-bold placeholder-gray-500 w-32"
                            />
                            <button
                                onClick={handleTrade}
                                disabled={loading || !ticker}
                                className={`ml-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Analyzing...' : 'Run Analysis'}
                            </button>
                        </div>
                        {result && (
                            <button
                                onClick={handleDownloadPDF}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2"
                                title="Download Analysis as PDF"
                            >
                                <Download size={18} />
                                Download PDF
                            </button>
                        )}
                        <button
                            onClick={onClearApiKeys}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-md font-medium transition-all"
                            title="Clear API Keys and Logout"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {(loading || logs.length > 0) && (
                    <div className="mb-8 bg-gray-800 rounded-xl border border-gray-700 p-4">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                            <Activity className="mr-2 text-blue-400" size={20} />
                            Live Activity
                        </h3>
                        <div className="h-32 overflow-y-auto font-mono text-sm text-gray-300 bg-gray-900 p-3 rounded border border-gray-800">
                            {logs.map((log, i) => {
                                const isRateLimit = log.includes('⏱️') || log.includes('Rate limiting');
                                return (
                                    <div key={i} className={`mb-1 ${isRateLimit ? 'text-yellow-400 font-semibold' : ''}`}>
                                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                                    </div>
                                );
                            })}
                            {loading && <div className="animate-pulse text-blue-400">Processing...</div>}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-2">
                        {[
                            { id: 'overview', label: 'Overview & Decision', icon: TrendingUp },
                            { id: 'market', label: 'Market Analysis', icon: Activity },
                            { id: 'sentiment', label: 'Sentiment & News', icon: MessageSquare },
                            { id: 'fundamentals', label: 'Fundamentals', icon: FileText },
                            { id: 'strategy', label: 'Strategy & Risk', icon: AlertTriangle },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                            >
                                <item.icon size={18} className="mr-3" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-3 bg-gray-800 rounded-xl border border-gray-700 p-6 min-h-[600px]">
                        {!result ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Activity size={48} className="mb-4 opacity-50" />
                                <p className="text-xl">Enter a ticker and run analysis to see data</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700">
                                            <h2 className="text-2xl font-bold mb-4 flex items-center">
                                                <CheckCircle className="mr-3 text-green-400" />
                                                Final Decision
                                            </h2>
                                            <div className="prose prose-invert max-w-none">
                                                <ReactMarkdown>{result.final_decision || 'Pending final decision...'}</ReactMarkdown>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
                                                <h3 className="font-semibold text-blue-400 mb-3">Trader's Plan</h3>
                                                <div className="prose prose-invert text-sm max-w-none">
                                                    <ReactMarkdown>{result.trader_plan || 'Pending trader plan...'}</ReactMarkdown>
                                                </div>
                                            </div>
                                            <div className="bg-gray-900 p-5 rounded-xl border border-gray-800">
                                                <h3 className="font-semibold text-purple-400 mb-3">Investment Plan</h3>
                                                <div className="prose prose-invert text-sm max-w-none">
                                                    <ReactMarkdown>{result.investment_plan || 'Pending investment plan...'}</ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'market' && (
                                    <div className="prose prose-invert max-w-none">
                                        <h2>Market Analysis</h2>
                                        {result.market_report ? (
                                            <ReactMarkdown>{result.market_report}</ReactMarkdown>
                                        ) : (
                                            <p className="text-gray-400">Waiting for market analysis data...</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'sentiment' && (
                                    <div className="space-y-8">
                                        <div className="prose prose-invert max-w-none">
                                            <h2>Sentiment Analysis</h2>
                                            {result.sentiment_report ? (
                                                <ReactMarkdown>{result.sentiment_report}</ReactMarkdown>
                                            ) : (
                                                <p className="text-gray-400">Waiting for sentiment analysis data...</p>
                                            )}
                                        </div>
                                        <div className="border-t border-gray-700 pt-8 prose prose-invert max-w-none">
                                            <h2>News Report</h2>
                                            {result.news_report ? (
                                                <ReactMarkdown>{result.news_report}</ReactMarkdown>
                                            ) : (
                                                <p className="text-gray-400">Waiting for news data...</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'fundamentals' && (
                                    <div className="prose prose-invert max-w-none">
                                        <h2>Fundamental Analysis</h2>
                                        {result.fundamentals_report ? (
                                            <ReactMarkdown>{result.fundamentals_report}</ReactMarkdown>
                                        ) : (
                                            <p className="text-gray-400">Waiting for fundamental analysis data...</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'strategy' && (
                                    <div className="space-y-8">
                                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                            <h3 className="text-xl font-bold text-yellow-400 mb-4">Risk Debate</h3>
                                            <div className="prose prose-invert max-w-none text-sm">
                                                {result.risk_debate ? (
                                                    <ReactMarkdown>{result.risk_debate}</ReactMarkdown>
                                                ) : (
                                                    <p className="text-gray-400">Debate in progress...</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                                            <h3 className="text-xl font-bold text-indigo-400 mb-4">Investment Debate</h3>
                                            <div className="prose prose-invert max-w-none text-sm">
                                                {result.investment_debate ? (
                                                    <ReactMarkdown>{result.investment_debate}</ReactMarkdown>
                                                ) : (
                                                    <p className="text-gray-400">Debate in progress...</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
