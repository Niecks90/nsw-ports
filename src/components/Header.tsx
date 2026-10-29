import { useState, useEffect } from "react";
import { Search, Settings, X, Download } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import { load } from '@tauri-apps/plugin-store';
import clsx from 'clsx';
import { isTauri } from '../utils/env';

interface HeaderProps {
    filters: string[];
    onSearchChange: (query: string) => void;
    onFilterChange: (filter: string) => void;
    activeFilter: string;
    onRefreshCatalog: (url?: string) => void;
}

export function Header({ filters, onSearchChange, onFilterChange, activeFilter, onRefreshCatalog }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
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
        setSearchQuery(e.target.value);
        onSearchChange(e.target.value);
    };

    return (
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                         {isTauri ? "PortsDL-NX Launcher" : "PortsDL-NX Showcase"}
                    </h1>
                </div>

                <div className="flex-1 max-w-xl flex items-center gap-2 relative">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search games..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-700 focus:border-slate-600 transition duration-150 ease-in-out sm:text-sm"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                    {isTauri && (
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                            aria-label="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {!isTauri && (
                    <div>
                        <a
                            href="https://github.com/Niecks90/PortsDL-NX/releases"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors shadow-lg"
                        >
                            <Download className="w-4 h-4" />
                            Download Windows App
                        </a>
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {filters.map(filter => (
                    <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                            activeFilter === filter
                                ? "bg-slate-100 text-slate-900 border-slate-100"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200"
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {isTauri && showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
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
