import React, { useState } from 'react';
import { Eye, EyeOff, Key, Lock } from 'lucide-react';

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

    const apiKeyGroups = [
        {
            title: 'LLM Providers',
            subtitle: 'At least one required',
            keys: ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'OPENROUTER_API_KEY']
        },
        {
            title: 'Data Sources',
            subtitle: 'Required for analysis',
            keys: ['TAVILY_API_KEY', 'FINNHUB_API_KEY']
        },
        {
            title: 'Optional',
            subtitle: 'For monitoring',
            keys: ['LANGSMITH_API_KEY']
        }
    ];

    return (
        <div className="w-full max-w-2xl">
            {/* Header Card */}
            <div className="bg-black rounded-2xl p-8 mb-6 border border-zinc-800 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FFCA0B] rounded-full mb-4">
                    <Lock className="text-black" size={32} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">System Access</h2>
                <p className="text-zinc-400">Configure your API credentials to unlock the trading system</p>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-black rounded-2xl p-8 border border-zinc-800 space-y-6">
                {apiKeyGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">{group.subtitle}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {group.keys.map((key) => {
                                const isRequired = key === 'TAVILY_API_KEY' || key === 'FINNHUB_API_KEY';
                                const displayName = key.replace('_API_KEY', '').replace('_', ' ');

                                return (
                                    <div key={key} className="relative group">
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                                            {displayName}
                                            {isRequired && <span className="text-[#FFCA0B] ml-1">*</span>}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                                                <Key size={16} />
                                            </div>
                                            <input
                                                type={showKeys[key] ? 'text' : 'password'}
                                                name={key}
                                                value={keys[key as keyof typeof keys]}
                                                onChange={handleChange}
                                                placeholder={`Enter ${displayName} key`}
                                                className="w-full bg-zinc-900 text-white rounded-lg pl-10 pr-12 py-3 border border-zinc-800 focus:outline-none focus:border-[#FFCA0B] focus:ring-2 focus:ring-[#FFCA0B]/20 transition-all placeholder-zinc-600"
                                                required={isRequired}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleShow(key)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#FFCA0B] transition-colors"
                                            >
                                                {showKeys[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Info Box */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <div className="flex gap-3">
                        <div className="text-[#FFCA0B] mt-0.5">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-zinc-400">
                                Your API keys are stored locally in your browser and never sent to our servers.
                                They are only used to communicate directly with the respective API providers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-[#FFCA0B] text-black font-bold py-4 px-6 rounded-lg transition-all transform hover:bg-white hover:scale-[1.02] active:scale-[0.98] shadow-lg text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            Initializing Agents...
                        </span>
                    ) : (
                        'Launch Trading System'
                    )}
                </button>
            </form>
        </div>
    );
};
