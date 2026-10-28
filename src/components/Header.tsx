import React, { useState } from 'react';
import { Search, Settings, X } from 'lucide-react';
import clsx from 'clsx';

import { Store, load } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';

interface HeaderProps {
    onSearchChange: (search: string) => void;
    onFilterChange: (filter: string) => void;
    activeFilter: string;
    onRefreshCatalog: (url: string) => void;
}

const FILTERS = ['All', 'Native', 'Emulators', 'Requires Files'];

export function Header({ onSearchChange, onFilterChange, activeFilter, onRefreshCatalog }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    // New state variables
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [switchIp, setSwitchIp] = useState('');
    const [switchFtpPort, setSwitchFtpPort] = useState(5000);
    const [localExportPath, setLocalExportPath] = useState('./switch/');
    const [catalogUrl, setCatalogUrl] = useState('');

    // Connection test state
    const [connStatus, setConnStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        onSearchChange(val);
    };

    const [store, setStore] = useState<Store | null>(null);

    React.useEffect(() => {
        const initStore = async () => {
            const newStore = await load('settings.json');
            setStore(newStore);

            const loadedApiKey = await newStore.get<string>('steamgriddb_api_key');
            if (loadedApiKey) setApiKey(loadedApiKey);

            const loadedSwitchIp = await newStore.get<string>('switch_ip');
            if (loadedSwitchIp) setSwitchIp(loadedSwitchIp);

            const loadedSwitchFtpPort = await newStore.get<number>('switch_ftp_port');
            if (loadedSwitchFtpPort) setSwitchFtpPort(loadedSwitchFtpPort);

            const loadedLocalExportPath = await newStore.get<string>('local_export_path');
            if (loadedLocalExportPath) setLocalExportPath(loadedLocalExportPath);

            const loadedCatalogUrl = await newStore.get<string>('catalog_url');
            if (loadedCatalogUrl) setCatalogUrl(loadedCatalogUrl);
        };
        initStore();
    }, []);

    const saveSettings = async () => {
        if (store) {
            await store.set('steamgriddb_api_key', apiKey);
            await store.set('switch_ip', switchIp);
            await store.set('switch_ftp_port', switchFtpPort);
            await store.set('local_export_path', localExportPath);
            await store.set('catalog_url', catalogUrl);
            await store.save();
        }
        setShowSettings(false);
    };

    const handleTestConnection = async () => {
        setConnStatus('testing');
        try {
            await invoke('test_ftp_connection', { host: switchIp, port: switchFtpPort });
            setConnStatus('success');
        } catch (e) {
            setConnStatus('error');
        }
        setTimeout(() => setConnStatus('idle'), 3000);
    };

    const handleClearCache = async () => {
        try {
            await invoke('clear_image_cache');
            alert('Image cache cleared successfully!');
        } catch (e) {
            alert('Failed to clear cache: ' + e);
        }
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
                            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">SteamGridDB API Key</label>
                                    <div className="flex gap-2">
                                        <input
                                            type={showApiKey ? "text" : "password"}
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                                            placeholder="Enter your API key..."
                                        />
                                        <button
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="px-3 py-2 bg-zinc-800 rounded-md text-zinc-300 hover:bg-zinc-700"
                                        >
                                            {showApiKey ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Switch IP Address</label>
                                    <input
                                        type="text"
                                        value={switchIp}
                                        onChange={(e) => setSwitchIp(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                                        placeholder="e.g. 192.168.1.50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Switch FTP Port</label>
                                    <input
                                        type="number"
                                        value={switchFtpPort}
                                        onChange={(e) => setSwitchFtpPort(parseInt(e.target.value) || 5000)}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                                        placeholder="5000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Local Export Path</label>
                                    <input
                                        type="text"
                                        value={localExportPath}
                                        onChange={(e) => setLocalExportPath(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                                        placeholder="./switch/"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Catalog URL</label>
                                    <input
                                        type="text"
                                        value={catalogUrl}
                                        onChange={(e) => setCatalogUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-zinc-600"
                                        placeholder="URL to catalog.json"
                                    />
                                </div>

                                <div className="pt-2 border-t border-zinc-800 space-y-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleTestConnection}
                                            disabled={connStatus === 'testing'}
                                            className="flex-1 px-3 py-2 bg-zinc-800 rounded-md text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                                        >
                                            Test Connection
                                        </button>
                                        {connStatus === 'success' && <span className="flex items-center px-3 text-emerald-500 font-bold bg-emerald-500/10 rounded-md">OK</span>}
                                        {connStatus === 'error' && <span className="flex items-center px-3 text-red-500 font-bold bg-red-500/10 rounded-md">Fail</span>}
                                    </div>
                                    <button
                                        onClick={handleClearCache}
                                        className="w-full px-3 py-2 bg-zinc-800 rounded-md text-zinc-300 hover:bg-zinc-700"
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

                            <div className="flex justify-end pt-4 mt-4 border-t border-zinc-800">
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
