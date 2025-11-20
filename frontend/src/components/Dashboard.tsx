import React, { useState, useEffect } from 'react';
import { type TradeResponse } from '../api';
import { Activity, TrendingUp, Shield, FileText, PieChart, Terminal, ArrowUpRight, Download, MessageSquare } from 'lucide-react';
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

        pdf.setFillColor(255, 202, 11);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text('AI Trading Analysis Report', pageWidth / 2, 20, { align: 'center' });
        yPosition = 40;

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

    // Helper component for sidebar items
    const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                    ? "bg-zinc-900 text-white border-l-4 border-[#FFCA0B]"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-900"
                }`}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );

    // Helper component for log lines
    const LogLine = ({ time, text, color }: { time: string; text: string; color: string }) => (
        <div className="flex gap-3">
            <span className="text-zinc-600 shrink-0">[{time}]</span>
            <span className={color}>{text}</span>
        </div>
    );

    // Extract decision type from final_decision
    const getDecisionType = () => {
        if (!result?.final_decision) return 'ANALYZING';
        const decision = result.final_decision.toUpperCase();
        if (decision.includes('STRONG BUY') || decision.includes('STRONGBUY')) return 'STRONG BUY';
        if (decision.includes('BUY')) return 'BUY';
        if (decision.includes('STRONG SELL') || decision.includes('STRONGSELL')) return 'STRONG SELL';
        if (decision.includes('SELL')) return 'SELL';
        if (decision.includes('HOLD')) return 'HOLD';
        return 'ANALYZING';
    };

    return (
        <div className="min-h-screen bg-[#FFCA0B] p-8 font-sans text-white flex gap-6">

            {/* SIDEBAR - Floating Black Island */}
            <div className="w-64 bg-black rounded-2xl p-6 flex flex-col shadow-2xl shrink-0">
                <h1 className="text-2xl font-bold tracking-tighter mb-10 text-white">
                    TRADER<span className="text-[#FFCA0B]">.AI</span>
                </h1>

                <nav className="space-y-2 flex-1">
                    <SidebarItem
                        icon={<Activity size={20} />}
                        label="Overview"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <SidebarItem
                        icon={<TrendingUp size={20} />}
                        label="Market Analysis"
                        active={activeTab === 'market'}
                        onClick={() => setActiveTab('market')}
                    />
                    <SidebarItem
                        icon={<MessageSquare size={20} />}
                        label="Sentiment"
                        active={activeTab === 'sentiment'}
                        onClick={() => setActiveTab('sentiment')}
                    />
                    <SidebarItem
                        icon={<PieChart size={20} />}
                        label="Fundamentals"
                        active={activeTab === 'fundamentals'}
                        onClick={() => setActiveTab('fundamentals')}
                    />
                    <SidebarItem
                        icon={<Shield size={20} />}
                        label="Risk Strategy"
                        active={activeTab === 'strategy'}
                        onClick={() => setActiveTab('strategy')}
                    />
                </nav>

                <div className="mt-auto pt-6 border-t border-zinc-800">
                    <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-[#FFCA0B]' : 'bg-[#ADFA1D]'} animate-pulse`}></div>
                        {loading ? 'Processing...' : 'System Operational'}
                    </div>
                    <button
                        onClick={onClearApiKeys}
                        className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition text-sm font-medium text-zinc-400 hover:text-white"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col gap-6">

                {/* HEADER CARD */}
                <div className="bg-black rounded-2xl p-6 flex justify-between items-center shadow-xl">
                    <div>
                        <h2 className="text-zinc-400 text-sm uppercase tracking-widest font-medium">Active Ticker</h2>
                        <div className="flex items-baseline gap-4 mt-1">
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                placeholder="ENTER TICKER"
                                className="text-4xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-zinc-700 w-48"
                            />
                            {result && (
                                <span className="text-[#ADFA1D] flex items-center gap-1 font-mono text-lg">
                                    <ArrowUpRight size={20} /> Active
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {result && (
                            <button
                                onClick={handleDownloadPDF}
                                className="px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition text-sm font-medium flex items-center gap-2"
                            >
                                <Download size={18} />
                                Download Report
                            </button>
                        )}
                        <button
                            onClick={handleTrade}
                            disabled={loading || !ticker}
                            className={`px-6 py-3 rounded-lg bg-[#FFCA0B] text-black font-bold hover:bg-white transition text-sm ${loading || !ticker ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Analyzing...' : 'Execute Analysis'}
                        </button>
                    </div>
                </div>

                {/* TERMINAL / LIVE LOGS */}
                <div className="bg-black rounded-2xl p-1 overflow-hidden shadow-xl border border-zinc-800">
                    <div className="bg-zinc-900/50 px-4 py-2 flex items-center gap-2 border-b border-zinc-800">
                        <Terminal size={14} className="text-zinc-500" />
                        <span className="text-xs font-mono text-zinc-500">AGENT LOGS</span>
                    </div>
                    <div className="p-4 font-mono text-sm h-48 overflow-y-auto space-y-2 opacity-90">
                        {logs.length === 0 && !loading ? (
                            <div className="text-zinc-600">Waiting for analysis to start...</div>
                        ) : (
                            logs.map((log, i) => {
                                const isRateLimit = log.includes('⏱️') || log.includes('Rate limiting');
                                const isError = log.includes('ERROR') || log.includes('Error');
                                const isSuccess = log.includes('complete') || log.includes('finished');

                                let color = 'text-zinc-400';
                                if (isRateLimit) color = 'text-[#FFCA0B]';
                                if (isError) color = 'text-red-400';
                                if (isSuccess) color = 'text-[#ADFA1D]';

                                return (
                                    <LogLine
                                        key={i}
                                        time={new Date().toLocaleTimeString()}
                                        text={log}
                                        color={color}
                                    />
                                );
                            })
                        )}
                        {loading && (
                            <div className="flex items-center gap-2 text-zinc-500 mt-4">
                                <span className="animate-pulse">_</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* GRID LAYOUT */}
                <div className="grid grid-cols-3 gap-6 flex-1">

                    {/* MAIN CONTENT AREA - Takes 2 columns */}
                    <div className="col-span-2 bg-black rounded-2xl p-8 border border-zinc-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-32 bg-[#ADFA1D] blur-[100px] opacity-10 group-hover:opacity-20 transition duration-500"></div>

                        <div className="relative z-10">
                            {!result ? (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                    <Activity size={48} className="mb-4 opacity-50" />
                                    <p className="text-xl">Enter a ticker and run analysis to see data</p>
                                </div>
                            ) : (
                                <>
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-[#ADFA1D]/20 rounded-lg text-[#ADFA1D]">
                                                    <TrendingUp size={24} />
                                                </div>
                                                <h3 className="text-xl font-semibold">Final Recommendation</h3>
                                            </div>

                                            <p className="text-3xl font-bold text-white mb-2">{getDecisionType()}</p>
                                            <div className="text-zinc-400 leading-relaxed max-w-3xl prose prose-invert">
                                                <ReactMarkdown>{result.final_decision || 'Analyzing market conditions...'}</ReactMarkdown>
                                            </div>

                                            {result.trader_plan && (
                                                <div className="mt-8 pt-6 border-t border-zinc-800">
                                                    <h4 className="text-lg font-semibold text-[#FFCA0B] mb-3">Trader's Plan</h4>
                                                    <div className="prose prose-invert text-sm">
                                                        <ReactMarkdown>{result.trader_plan}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'market' && (
                                        <div className="prose prose-invert max-w-none">
                                            <h2 className="text-2xl font-bold mb-4">Market Analysis</h2>
                                            {result.market_report ? (
                                                <ReactMarkdown>{result.market_report}</ReactMarkdown>
                                            ) : (
                                                <p className="text-zinc-400">Waiting for market analysis data...</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'sentiment' && (
                                        <div className="space-y-8">
                                            <div className="prose prose-invert max-w-none">
                                                <h2 className="text-2xl font-bold mb-4">Sentiment Analysis</h2>
                                                {result.sentiment_report ? (
                                                    <ReactMarkdown>{result.sentiment_report}</ReactMarkdown>
                                                ) : (
                                                    <p className="text-zinc-400">Waiting for sentiment analysis data...</p>
                                                )}
                                            </div>
                                            <div className="border-t border-zinc-700 pt-8 prose prose-invert max-w-none">
                                                <h2 className="text-2xl font-bold mb-4">News Report</h2>
                                                {result.news_report ? (
                                                    <ReactMarkdown>{result.news_report}</ReactMarkdown>
                                                ) : (
                                                    <p className="text-zinc-400">Waiting for news data...</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'fundamentals' && (
                                        <div className="prose prose-invert max-w-none">
                                            <h2 className="text-2xl font-bold mb-4">Fundamental Analysis</h2>
                                            {result.fundamentals_report ? (
                                                <ReactMarkdown>{result.fundamentals_report}</ReactMarkdown>
                                            ) : (
                                                <p className="text-zinc-400">Waiting for fundamental analysis data...</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'strategy' && (
                                        <div className="space-y-8">
                                            <div className="prose prose-invert max-w-none">
                                                <h3 className="text-xl font-bold text-[#FFCA0B] mb-4">Investment Plan</h3>
                                                {result.investment_plan ? (
                                                    <ReactMarkdown>{result.investment_plan}</ReactMarkdown>
                                                ) : (
                                                    <p className="text-zinc-400">Generating investment plan...</p>
                                                )}
                                            </div>
                                            <div className="border-t border-zinc-700 pt-8 prose prose-invert max-w-none">
                                                <h3 className="text-xl font-bold text-yellow-400 mb-4">Risk Debate</h3>
                                                {result.risk_debate ? (
                                                    <ReactMarkdown>{result.risk_debate}</ReactMarkdown>
                                                ) : (
                                                    <p className="text-zinc-400">Risk analysis in progress...</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* CONFIDENCE SCORE CARD */}
                    <div className="bg-black rounded-2xl p-8 border border-zinc-800 flex flex-col justify-center items-center text-center">
                        <div className="w-32 h-32 rounded-full border-8 border-zinc-800 border-t-[#FFCA0B] border-r-[#FFCA0B] rotate-45 mb-4 flex items-center justify-center">
                            <span className="text-2xl font-bold font-mono -rotate-45">
                                {result ? '85%' : '--'}
                            </span>
                        </div>
                        <h3 className="text-lg font-medium text-white">Confidence Score</h3>
                        <p className="text-zinc-500 text-sm mt-2">AI Agent Certainty</p>

                        {result && (
                            <div className="mt-6 w-full space-y-3">
                                <div className="bg-zinc-900 rounded-lg p-3">
                                    <div className="text-xs text-zinc-500 mb-1">Market Signal</div>
                                    <div className="text-sm font-semibold text-[#ADFA1D]">Strong</div>
                                </div>
                                <div className="bg-zinc-900 rounded-lg p-3">
                                    <div className="text-xs text-zinc-500 mb-1">Risk Level</div>
                                    <div className="text-sm font-semibold text-[#FFCA0B]">Moderate</div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
