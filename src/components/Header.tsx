import React, { useState } from 'react';
import { Search, Settings, X } from 'lucide-react';
import clsx from 'clsx';

interface HeaderProps {
    onSearchChange: (search: string) => void;
    onFilterChange: (filter: string) => void;
    activeFilter: string;
}

const FILTERS = ['All', 'Native', 'Emulators', 'Requires Files'];

export function Header({ onSearchChange, onFilterChange, activeFilter }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('sgdb_api_key') || '');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        onSearchChange(val);
    };

    const saveSettings = () => {
        localStorage.setItem('sgdb_api_key', apiKey);
        setShowSettings(false);
    };

    return (
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 pb-4 pt-6 px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                         Switch Ports
                    </h1>
                </div>

                <div className="flex-1 max-w-xl flex items-center gap-2 relative">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search games..."
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-800 rounded-md leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-zinc-800 focus:border-zinc-700 transition duration-150 ease-in-out sm:text-sm"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                        aria-label="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map(filter => (
                    <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                            activeFilter === filter
                                ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">SteamGridDB API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                                    placeholder="Enter your API key..."
                                />
                                <p className="text-xs text-zinc-500 mt-1">Used to fetch high-quality cover art for games without cached images.</p>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={saveSettings}
                                    className="px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-zinc-200 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
