import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";
import { PortData } from '../types';
import { X, ExternalLink, Download, Loader2 } from 'lucide-react';
import { AssetPicker } from './AssetPicker';
import { DeploymentSelector } from './DeploymentSelector';
import { fetchGameCoverUrl } from '../services/steamgriddb';
import { isTauri } from '../utils/env';
import { getShortPlatformName, getPlatformBadgeClasses } from '../utils/platforms';
import clsx from 'clsx';

interface SidebarModalProps {
    game: PortData | null;
    onClose: () => void;
}

export function SidebarModal({ game, onClose }: SidebarModalProps) {
    const [assetsReady, setAssetsReady] = useState(false);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [readmeContent, setReadmeContent] = useState<string | null>(null);
    const [readmeLoading, setReadmeLoading] = useState(false);

    useEffect(() => {
        if (!game) return;
        let mounted = true;
        fetchGameCoverUrl(game.title, game.steamgriddb_id, game.grid_image_url).then(url => {
            if (mounted && url) setCoverUrl(url);
        });

        // Reset README state
        setReadmeContent(null);

        if (game.url && game.url.includes("github.com")) {
            setReadmeLoading(true);
            const githubSlugMatch = game.url.match(/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)/);
            if (githubSlugMatch) {
                const slug = githubSlugMatch[1].replace(/\/$/, "");
                const fetchReadme = async () => {
                    const branches = ['HEAD', 'main', 'master'];
                    for (const branch of branches) {
                        try {
                            const res = await fetch(`https://raw.githubusercontent.com/${slug}/${branch}/README.md`);
                            if (res.ok) {
                                const text = await res.text();
                                if (mounted) {
                                    setReadmeContent(text);
                                    setReadmeLoading(false);
                                }
                                return;
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (mounted) {
                        setReadmeLoading(false);
                    }
                };
                fetchReadme();
            } else {
                setReadmeLoading(false);
            }
        } else {
            setReadmeLoading(false);
        }

        return () => { mounted = false; };
    }, [game]);

    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!game) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden z-10">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Column: Sidebar / Metadata */}
                <div className="w-full md:w-80 bg-slate-950/50 p-6 flex flex-col gap-6 flex-shrink-0 md:border-r border-slate-800 md:overflow-y-auto">
                    {/* Game Poster */}
                    <div className="w-48 md:w-full mx-auto aspect-[2/3] bg-slate-800 rounded-xl overflow-hidden shadow-md flex items-center justify-center flex-shrink-0">
                        {coverUrl ? (
                            <img
                                src={coverUrl}
                                alt={game.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-slate-600 font-medium">No cover art</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white leading-tight">{game.title}</h2>

                        <div className="flex flex-wrap gap-2 justify-center md:justify-start text-xs text-slate-300 font-medium mt-1">
                            {game.original_platform && (
                                <span className={clsx("px-2 py-1 rounded font-semibold", getPlatformBadgeClasses(game.original_platform))}>
                                    {getShortPlatformName(game.original_platform)}
                                </span>
                            )}
                            <span className="bg-slate-800 px-2 py-1 rounded">v{game.version}</span>
                            <span className="bg-slate-800 px-2 py-1 rounded">By {game.author}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Requires Assets Warning (Web Mode only, handled by AssetPicker in Tauri) */}
                        {!isTauri && game.requires_original_assets && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-left">
                                <h4 className="font-semibold text-amber-500 text-sm mb-1">Original Assets Required</h4>
                                <p className="text-xs text-slate-400 leading-snug">
                                    {game.expected_asset_hint || "You must provide your own game files to play this port."}
                                </p>
                            </div>
                        )}

                        {isTauri && <AssetPicker game={game} onAssetReady={setAssetsReady} />}
                        {isTauri && <DeploymentSelector game={game} assetsReady={assetsReady} />}

                        {!isTauri && (
                            <div className="flex flex-col gap-3">
                                <a
                                    href={game.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium transition-colors border border-slate-700 text-sm shadow-sm"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Source / Download
                                </a>

                                <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 text-center">
                                    <h4 className="font-semibold text-blue-400 text-xs mb-1">Want 1-click FTP install to your Switch?</h4>
                                    <p className="text-[10px] text-slate-400 mb-3 leading-snug">
                                        Use the PortsDL-NX Desktop Launcher to easily download, prepare assets, and deploy directly to your console.
                                    </p>
                                    <a
                                        href="https://github.com/Niecks90/PortsDL-NX/releases"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors shadow text-xs"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Get Desktop App
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Main Content (README) */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col bg-slate-900">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
                        About & Installation
                    </h3>

                    <div className="prose prose-invert max-w-none break-words text-slate-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-a:text-blue-400 hover:prose-a:text-blue-300">
                        {readmeLoading ? (
                            <div className="flex items-center gap-3 text-slate-500 py-8 justify-center">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Loading README...</span>
                            </div>
                        ) : readmeContent ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {readmeContent}
                            </ReactMarkdown>
                        ) : (
                            <div className="text-slate-500 py-8 italic text-center bg-slate-800/30 rounded-lg border border-slate-800/50">
                                No README available for this port — visit repository for more information.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
