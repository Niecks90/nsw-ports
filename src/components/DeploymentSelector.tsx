import { useState, useEffect } from "react";
import { PortData } from '../types';
import { HardDrive, Server, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { load } from '@tauri-apps/plugin-store';
import clsx from 'clsx';

interface DeploymentSelectorProps {
    game: PortData;
    assetsReady: boolean;
}

type DeployMode = 'local' | 'ftp';

export function DeploymentSelector({ game, assetsReady }: DeploymentSelectorProps) {
    const [mode, setMode] = useState<DeployMode>('local');
    const [ftpIp, setFtpIp] = useState('');
    const [ftpPort, setFtpPort] = useState('5000');
    const [localPath, setLocalPath] = useState('./switch/');

    const [status, setStatus] = useState<'idle' | 'downloading' | 'extracting' | 'deploying' | 'success' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const initSettings = async () => {
            const store = await load('settings.json');
            const ip = await store.get<string>('switch_ip');
            if (ip) setFtpIp(ip);
            const port = await store.get<number>('switch_ftp_port');
            if (port) setFtpPort(port.toString());
            const path = await store.get<string>('local_export_path');
            if (path) setLocalPath(path);
        };
        initSettings();

        const unlistenProgress = listen<{ progress: number, message: string }>('deploy_progress', (event) => {
            setProgress(event.payload.progress);
            setMessage(event.payload.message);
        });

        return () => {
            unlistenProgress.then(fn => fn());
        };
    }, []);

    const handleDeploy = async () => {
        setStatus('downloading');
        setProgress(0);
        setMessage('Starting download...');

        try {
            // 1. Download
            const archivePath = await invoke<string>('download_port', { gameId: game.id });

            // 2. Deploy
            setStatus('deploying');
            if (mode === 'local') {
                setMessage('Deploying to local folder...');
                await invoke('deploy_local', { stagingPath: archivePath, outputDir: localPath });
            } else {
                setMessage('Deploying via FTP...');
                const store = await load('settings.json');
                await store.set('switch_ip', ftpIp);
                await store.set('switch_ftp_port', parseInt(ftpPort, 10) || 5000);
                await store.save();

                await invoke('deploy_ftp', {
                    host: ftpIp,
                    port: parseInt(ftpPort, 10) || 5000,
                    stagingPath: archivePath,
                    remoteDest: '/switch'
                });
            }

            setStatus('success');
            setMessage('Deployment successful!');

        } catch (e: any) {
            console.error(e);
            setStatus('error');
            setMessage(e.toString());
        }
    };

    const isDeployable = !game.requires_original_assets || assetsReady;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
                Deploy
            </h3>

            <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg">
                <button
                    onClick={() => setMode('local')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors",
                        mode === 'local' ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                    )}
                >
                    <HardDrive className="w-4 h-4" /> Local Folder
                </button>
                <button
                    onClick={() => setMode('ftp')}
                    className={clsx(
                        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors",
                        mode === 'ftp' ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
                    )}
                >
                    <Server className="w-4 h-4" /> Switch FTP
                </button>
            </div>

            {mode === 'ftp' && (
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Switch IP Address</label>
                        <input
                            type="text"
                            placeholder="192.168.1.100"
                            value={ftpIp}
                            onChange={e => setFtpIp(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-600"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Port</label>
                        <input
                            type="text"
                            value={ftpPort}
                            onChange={e => setFtpPort(e.target.value)}
                            className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-white focus:outline-none focus:border-zinc-600"
                        />
                    </div>
                    <div className="col-span-3 text-xs text-amber-500/80">
                        * Sys-ftpd must be running in single-threaded, passive mode.
                    </div>
                </div>
            )}

            <div className="pt-2">
                {status === 'idle' && (
                    <button
                        onClick={handleDeploy}
                        disabled={!isDeployable}
                        className={clsx(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-md font-bold transition-colors",
                            isDeployable
                                ? "bg-blue-600 hover:bg-blue-500 text-white"
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        )}
                    >
                        <Download className="w-5 h-5" />
                        Download & Deploy
                    </button>
                )}

                {(status === 'downloading' || status === 'deploying') && (
                    <div className="space-y-2 bg-zinc-900 p-4 rounded-md border border-zinc-800">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-300 font-medium">{message}</span>
                            <span className="text-zinc-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{message}</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{message}</span>
                        </div>
                        <button
                            onClick={() => setStatus('idle')}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-md transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
