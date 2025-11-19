import React, { useState } from 'react';
import { Eye, EyeOff, Key } from 'lucide-react';

interface ApiKeyFormProps {
    onStart: (keys: Record<string, string>) => void;
    loading: boolean;
}

export const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onStart, loading }) => {
    const [keys, setKeys] = useState({
        OPENAI_API_KEY: '',
        GEMINI_API_KEY: '',
        OPENROUTER_API_KEY: '',
        TAVILY_API_KEY: '',
        FINNHUB_API_KEY: '',
        LANGSMITH_API_KEY: '',
    });
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeys({ ...keys, [e.target.name]: e.target.value });
    };

    const toggleShow = (key: string) => {
        setShowKeys({ ...showKeys, [key]: !showKeys[key] });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStart(keys);
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <div className="flex items-center justify-center mb-6">
                <div className="bg-blue-600 p-3 rounded-full">
                    <Key className="text-white" size={24} />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-white mb-6">System Access</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {Object.keys(keys).map((key) => (
                    <div key={key} className="relative group">
                        <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
                            {key.replace('_API_KEY', '').replace('_', ' ')} Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKeys[key] ? 'text' : 'password'}
                                name={key}
                                value={keys[key as keyof typeof keys]}
                                onChange={handleChange}
                                placeholder={`Enter ${key}`}
                                className="w-full bg-gray-900 text-white rounded-lg px-4 py-3 pr-10 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                required={key === 'TAVILY_API_KEY' || key === 'FINNHUB_API_KEY'}
                            />
                            <button
                                type="button"
                                onClick={() => toggleShow(key)}
                                className="absolute right-3 top-3 text-gray-500 hover:text-white transition-colors"
                            >
                                {showKeys[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Initializing Agents...' : 'Launch Trading System'}
                </button>
            </form>
        </div>
    );
};
