import { useState, useEffect } from "react";
import { Search, Settings, X, Download, ArrowUpAZ, ArrowDownAZ, CalendarDays, Coffee, Dices, Sparkles, Bug } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import { load } from '@tauri-apps/plugin-store';
import clsx from 'clsx';
import { isTauri } from '../utils/env';
import { Logo } from './Logo';
import { getShortPlatformName } from '../utils/platforms';

interface HeaderProps {
    filters: string[];
    filterCounts: Record<string, number>;
    onSearchChange: (query: string) => void;
    onFilterChange: (filter: string) => void;
    activeFilter: string;
    onRefreshCatalog: (url?: string) => void;
    sortOption: 'alpha' | 'recent';
    onSortChange: (option: 'alpha' | 'recent') => void;
    sortReverse: boolean;
    onSortReverseToggle: () => void;
    recentOnly: boolean;
    onRecentOnlyToggle: (val: boolean) => void;
    onRandomGame: () => void;
    searchQuery: string;
}

export function Header({
    filters,
    filterCounts,
    onSearchChange,
    onFilterChange,
    activeFilter,
    onRefreshCatalog,
    sortOption,
    onSortChange,
    sortReverse,
    onSortReverseToggle,
    recentOnly,
    onRecentOnlyToggle,
    onRandomGame,
    searchQuery,
}: HeaderProps) {
    const [showSettings, setShowSettings] = useState(false);

    // Settings state
    const [apiKey, setApiKey] = useState('');
    const [switchIp, setSwitchIp] = useState('');
    const [switchFtpPort, setSwitchFtpPort] = useState<number>(5000);
    const [localExportPath, setLocalExportPath] = useState('./switch/');
    const [catalogUrl, setCatalogUrl] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!isTauri) return;
        const loadSettings = async () => {
            const store = await load('settings.json');
            setApiKey(await store.get<string>('steamgriddb_api_key') || '');
            setSwitchIp(await store.get<string>('switch_ip') || '');
            setSwitchFtpPort(await store.get<number>('switch_ftp_port') || 5000);
            setLocalExportPath(await store.get<string>('local_export_path') || './switch/');
            setCatalogUrl(await store.get<string>('catalog_url') || '');
        };
        loadSettings();
    }, []);

    const saveSettings = async () => {
        if (!isTauri) return;
        const store = await load('settings.json');
        await store.set('steamgriddb_api_key', apiKey);
        await store.set('switch_ip', switchIp);
        await store.set('switch_ftp_port', switchFtpPort);
        await store.set('local_export_path', localExportPath);
        await store.set('catalog_url', catalogUrl);
        await store.save();

        if (apiKey) {
            localStorage.setItem("sgdb_api_key", apiKey);
        }

        setShowSettings(false);
    };

    const handleTestConnection = async () => {
        if (!isTauri) return;
        setConnStatus('testing');
        try {
            await invoke('test_ftp_connection', { host: switchIp, port: switchFtpPort });
            setConnStatus('success');
        } catch (e) {
            console.error(e);
            setConnStatus('error');
        }
        setTimeout(() => setConnStatus('idle'), 3000);
    };

    const handleClearCache = async () => {
        if (!isTauri) return;
        try {
            await invoke('clear_image_cache');
            alert("Image cache cleared successfully.");
        } catch (e) {
            console.error(e);
            alert("Failed to clear cache.");
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value);
    };

    const handleLogoClick = () => {
        onSearchChange('');
        onFilterChange('All');
        onRecentOnlyToggle(false);
    };

    return (
        <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-center">
                {/* Brand & Mobile Actions */}
                <div className="flex items-center justify-between w-full lg:w-auto">
                    <Logo onClick={handleLogoClick} />

                    <div className="flex items-center gap-2 lg:hidden">
                        {/* Mobile Random Port Button */}
                        <button
                            onClick={onRandomGame}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg flex items-center justify-center transition-colors"
                            title="Open a random port"
                            aria-label="Random Port"
                        >
                            <Dices className="w-5 h-5" />
                        </button>

                        <a
                            href="https://github.com/Niecks90/nsw-ports/issues/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-750 text-rose-400 border border-slate-700 rounded-lg flex items-center justify-center transition-colors"
                            title="Report Issue"
                        >
                            <Bug className="w-5 h-5" />
                        </a>

                        <a
                            href="https://ko-fi.com/niecks90"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#72a4f2]/20 hover:bg-[#72a4f2]/30 text-[#72a4f2] border border-[#72a4f2]/40 transition-colors p-2 rounded-lg flex items-center justify-center"
                            title="Support on Ko-fi"
                        >
                            <Coffee className="w-5 h-5" />
                        </a>

                        {!isTauri && (
                            <a
                                href="https://github.com/Niecks90/PortsDL-NX/releases"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow flex items-center justify-center"
                                title="Download Windows App"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Search & Controls Container */}
                <div className="w-full flex-1 max-w-3xl flex flex-col sm:flex-row items-center gap-2">
                    {/* Search Input */}
                    <div className="relative w-full flex-1 min-w-[200px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search games, authors, platforms..."
                            className="block w-full pl-9 pr-8 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-750 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter & Sort Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-between sm:justify-start">
                        {/* "Recently Updated" Filter Toggle Chip */}
                        <button
                            onClick={() => onRecentOnlyToggle(!recentOnly)}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap border cursor-pointer",
                                recentOnly
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30"
                                    : "bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-750"
                            )}
                            title="Filter to ports updated in the last 7 days"
                        >
                            <Sparkles className={clsx("w-3.5 h-3.5", recentOnly ? "text-emerald-400" : "text-slate-400")} />
                            <span>Recently Updated</span>
                        </button>

                        {/* Sort Dropdown */}
                        <select
                            value={sortOption}
                            onChange={(e) => onSortChange(e.target.value as 'alpha' | 'recent')}
                            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg py-2 px-2.5 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition duration-150 cursor-pointer"
                        >
                            <option value="alpha">Alphabetical (A - Z)</option>
                            <option value="recent">Recently Updated</option>
                        </select>

                        {/* Sort Reverse Toggle Button */}
                        <button
                            onClick={onSortReverseToggle}
                            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                            aria-label="Toggle sort direction"
                            title="Toggle sort direction"
                        >
                            {sortOption === 'alpha' ? (
                                sortReverse ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpAZ className="w-4 h-4" />
                            ) : (
                                <CalendarDays className="w-4 h-4" />
                            )}
                        </button>

                        {/* Random Port Button (Desktop) */}
                        <button
                            onClick={onRandomGame}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-lg transition-colors text-xs sm:text-sm font-medium cursor-pointer"
                            title="Pick a random port from current catalog"
                            aria-label="Pick a random port"
                        >
                            <Dices className="w-4 h-4 text-cyan-400" />
                            <span>Random</span>
                        </button>

                        {/* Settings Button (Tauri Desktop only) */}
                        {isTauri && (
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Settings"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* External Actions (Desktop) */}
                <div className="hidden lg:flex items-center gap-2.5">
                    <a
                        href="https://ko-fi.com/niecks90"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#72a4f2]/20 hover:bg-[#72a4f2]/30 text-[#72a4f2] border border-[#72a4f2]/40 transition-colors px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <Coffee className="w-4 h-4" />
                        <span>Support on Ko-fi</span>
                    </a>

                    <a
                        href="https://github.com/Niecks90/nsw-ports/issues/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
                        title="Report an issue or suggest a port"
                    >
                        <Bug className="w-4 h-4 text-rose-400" />
                        <span>Report Issue</span>
                    </a>

                    {!isTauri && (
                        <a
                            href="https://github.com/Niecks90/PortsDL-NX/releases"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow text-xs"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download App</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Platform Filter Pills with Counts: e.g. All (406), PC (80), Xbox 360 (45) */}
            <div className="mt-3 flex md:flex-wrap overflow-x-auto no-scrollbar scroll-smooth gap-1.5 sm:gap-2 py-1 -mx-3 px-3 sm:-mx-4 sm:px-4 [&::-webkit-scrollbar]:hidden">
                {filters.map(filter => {
                    const count = filterCounts[filter] ?? 0;
                    const isActive = activeFilter === filter;
                    return (
                        <button
                            key={filter}
                            onClick={() => onFilterChange(filter)}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 cursor-pointer font-medium",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40"
                                    : "bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60"
                            )}
                        >
                            <span>{getShortPlatformName(filter)}</span>
                            <span className={clsx(
                                "text-[11px] font-mono",
                                isActive ? "text-blue-100 opacity-90" : "text-slate-400"
                            )}>
                                ({count})
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Settings Modal (Tauri Desktop) */}
            {isTauri && showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">SteamGridDB API Key</label>
                                    <div className="flex gap-2">
                                        <input
                                            type={showApiKey ? "text" : "password"}
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-slate-600"
                                            placeholder="Enter your API key..."
                                        />
                                        <button
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="px-3 py-2 bg-slate-800 rounded-md text-slate-300 hover:bg-slate-700"
                                        >
                                            {showApiKey ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Switch IP Address</label>
                                    <input
                                        type="text"
                                        value={switchIp}
                                        onChange={(e) => setSwitchIp(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-slate-600"
                                        placeholder="e.g. 192.168.1.50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Switch FTP Port</label>
                                    <input
                                        type="number"
                                        value={switchFtpPort}
                                        onChange={(e) => setSwitchFtpPort(parseInt(e.target.value) || 5000)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-slate-600"
                                        placeholder="5000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Local Export Path</label>
                                    <input
                                        type="text"
                                        value={localExportPath}
                                        onChange={(e) => setLocalExportPath(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-slate-600"
                                        placeholder="./switch/"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Catalog URL</label>
                                    <input
                                        type="text"
                                        value={catalogUrl}
                                        onChange={(e) => setCatalogUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-slate-600"
                                        placeholder="URL to catalog.json"
                                    />
                                </div>

                                <div className="pt-2 border-t border-slate-800 space-y-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleTestConnection}
                                            disabled={connStatus === 'testing'}
                                            className="flex-1 px-3 py-2 bg-slate-800 rounded-md text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                                        >
                                            Test Connection
                                        </button>
                                        {connStatus === 'success' && <span className="flex items-center px-3 text-emerald-500 font-bold bg-emerald-500/10 rounded-md">OK</span>}
                                        {connStatus === 'error' && <span className="flex items-center px-3 text-red-500 font-bold bg-red-500/10 rounded-md">Fail</span>}
                                    </div>
                                    <button
                                        onClick={handleClearCache}
                                        className="w-full px-3 py-2 bg-slate-800 rounded-md text-slate-300 hover:bg-slate-700"
                                    >
                                        Clear Image Cache
                                    </button>
                                    <button
                                        onClick={() => onRefreshCatalog(catalogUrl)}
                                        className="w-full px-3 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500 font-medium"
                                    >
                                        Refresh Catalog
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
                                <button
                                    onClick={saveSettings}
                                    className="px-4 py-2 bg-white text-black font-medium rounded-md hover:bg-slate-200 transition-colors"
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
