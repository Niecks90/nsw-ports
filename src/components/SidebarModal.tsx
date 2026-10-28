import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";
import { PortData } from '../types';
import { X } from 'lucide-react';
import { AssetPicker } from './AssetPicker';
import { DeploymentSelector } from './DeploymentSelector';
import { fetchGameCoverUrl } from '../services/steamgriddb';

interface SidebarModalProps {
    game: PortData | null;
    onClose: () => void;
}

export function SidebarModal({ game, onClose }: SidebarModalProps) {
    const [assetsReady, setAssetsReady] = useState(false);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!game) return;
        let mounted = true;
        fetchGameCoverUrl(game.title, game.steamgriddb_id).then(url => {
            if (mounted && url) setCoverUrl(url);
        });
        return () => { mounted = false; };
    }, [game]);

    if (!game) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden transition-transform transform translate-x-0">

                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={onClose}
                        className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Banner / Cover */}
                <div className="relative h-64 w-full bg-zinc-900 flex-shrink-0">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={game.title}
                            className="w-full h-full object-cover object-top opacity-50"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-zinc-600 font-medium">No cover art</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <h2 className="text-3xl font-bold text-white mb-1 shadow-black drop-shadow-md">{game.title}</h2>
                        <div className="flex flex-wrap gap-2 text-sm text-zinc-300 font-medium">
                            <span className="bg-zinc-800/80 px-2 py-1 rounded backdrop-blur-sm">v{game.version}</span>
                            <span className="bg-zinc-800/80 px-2 py-1 rounded backdrop-blur-sm">By {game.author}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">

                    {/* Instructions */}
                    <AssetPicker game={game} onAssetReady={setAssetsReady} />
                    <DeploymentSelector game={game} assetsReady={assetsReady} />

                    {game.instructions_markdown && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-2">
                                Info
                            </h3>
                            <div className="prose prose-invert prose-sm text-zinc-400">
                                <ReactMarkdown>{game.instructions_markdown}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
