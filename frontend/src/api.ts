import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
});

export interface TradeResponse {
    status: string;
    final_decision: string;
    market_report: string;
    sentiment_report: string;
    news_report: string;
    fundamentals_report: string;
    investment_plan: string;
    trader_plan: string;
    risk_debate: string;
    investment_debate: string;
}

export const runTradeStream = async (
    ticker: string,
    apiKeys: any,
    onUpdate: (data: any) => void
) => {
    const response = await fetch(`${API_URL}/trade`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker, api_keys: apiKeys }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Handle multiple JSON objects in one chunk
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.trim()) {
                try {
                    const data = JSON.parse(line);
                    onUpdate(data);
                } catch (e) {
                    console.error('Error parsing JSON chunk', e);
                }
            }
        }
    }
};

export const runTrade = async (ticker: string, apiKeys: Record<string, string>): Promise<TradeResponse> => {
    const response = await api.post('/trade', { ticker, api_keys: apiKeys });
    return response.data;
};
