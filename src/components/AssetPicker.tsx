import { useState } from "react";
import { PortData } from '../types';
import { Folder, FileArchive, CheckCircle2, AlertCircle } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import clsx from 'clsx';

interface AssetPickerProps {
    game: PortData;
    onAssetReady: (ready: boolean) => void;
}

export function AssetPicker({ game, onAssetReady }: AssetPickerProps) {
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [isInjecting, setIsInjecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleBrowse = async (directory: boolean) => {
        try {
            const result = await open({
                directory,
                multiple: false,
                title: directory ? "Select Folder Containing Assets" : "Select Asset File",
            });

            if (result && typeof result === 'string') {
                setSelectedPath(result);
                setError(null);
                setSuccess(false);
                onAssetReady(false);
            }
        } catch (e) {
            console.error("Failed to open dialog", e);
        }
    };

    const handleInject = async () => {
        if (!selectedPath) return;
        setIsInjecting(true);
        setError(null);

        try {
            await invoke("inject_game_assets", {
                gameId: game.id,
                sourcePath: selectedPath
            });
            setSuccess(true);
            onAssetReady(true);
        } catch (e: any) {
            setError(e.toString());
            onAssetReady(false);
        } finally {
            setIsInjecting(false);
        }
    };

    return (
        <div className="space-y-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-amber-500">Commercial Assets Required</h4>
                    <p className="text-sm text-zinc-300 mt-1">
                        You must provide your own game files to play this port.
                    </p>
                </div>
            </div>

            {!success ? (
                <div className="mt-4 space-y-3 pl-8">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleBrowse(false)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-md transition-colors border border-zinc-700"
                        >
                            <FileArchive className="w-4 h-4" /> Browse File
                        </button>
                        <button
                            onClick={() => handleBrowse(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-md transition-colors border border-zinc-700"
                        >
                            <Folder className="w-4 h-4" /> Browse Folder
                        </button>
                    </div>

                    {selectedPath && (
                        <div className="space-y-3">
                            <div className="text-xs font-mono text-zinc-400 bg-zinc-900 p-2 rounded truncate border border-zinc-800">
                                {selectedPath}
                            </div>

                            <button
                                onClick={handleInject}
                                disabled={isInjecting}
                                className={clsx(
                                    "w-full py-2 rounded-md font-medium text-sm transition-all",
                                    isInjecting
                                        ? "bg-amber-600/50 text-white/50 cursor-not-allowed"
                                        : "bg-amber-600 hover:bg-amber-500 text-white"
                                )}
                            >
                                {isInjecting ? "Processing Assets..." : "Prepare Assets"}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                            Error: {error}
                        </div>
                    )}
                </div>
            ) : (
                <div className="pl-8 flex items-center gap-2 text-emerald-500 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Assets verified and ready
                </div>
            )}
        </div>
    );
}
