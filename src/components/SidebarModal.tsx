import ReactMarkdown from "react-markdown";
import { PortData } from '../types';
import { X, ExternalLink, Download } from 'lucide-react';

interface SidebarModalProps {
    game: PortData | null;
    onClose: () => void;
}

export function SidebarModal({ game, onClose }: SidebarModalProps) {
    if (!game) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col overflow-hidden transition-transform transform translate-x-0">

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
                <div className="relative h-64 w-full bg-slate-900 flex-shrink-0">
                    {game.grid_image_url ? (
                        <img
                            src={game.grid_image_url}
                            alt={game.title}
                            className="w-full h-full object-cover object-top opacity-50"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-slate-600 font-medium">No cover art</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6 w-full">
                        <h2 className="text-3xl font-bold text-white mb-1 shadow-black drop-shadow-md">{game.title}</h2>
                        <div className="flex flex-wrap gap-2 text-sm text-slate-300 font-medium">
                            <span className="bg-slate-800/80 px-2 py-1 rounded backdrop-blur-sm">v{game.version}</span>
                            <span className="bg-slate-800/80 px-2 py-1 rounded backdrop-blur-sm">By {game.author}</span>
                            <span className="bg-slate-800/80 px-2 py-1 rounded backdrop-blur-sm">{game.original_platform}</span>
                            <span className="bg-slate-800/80 px-2 py-1 rounded backdrop-blur-sm">.{game.asset_type}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    {/* Requires Assets Warning */}
                    {game.requires_original_assets && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                            <h4 className="font-semibold text-amber-500 mb-2">Original Assets Required</h4>
                            <p className="text-sm text-slate-300">
                                {game.expected_asset_hint || "You must provide your own game files to play this port."}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <a
                            href={game.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-md font-medium transition-colors border border-slate-700"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Source / Download
                        </a>
                    </div>

                    {/* Desktop App Promo Banner */}
                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4 text-center">
                        <h4 className="font-semibold text-blue-400 mb-2">Want 1-click FTP install to your Switch?</h4>
                        <p className="text-sm text-slate-300 mb-4">
                            Use the PortsDL-NX Desktop Launcher to easily download, prepare assets, and deploy directly to your console.
                        </p>
                        <a
                            href="https://github.com/Niecks90/PortsDL-NX/releases"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors shadow-lg text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Get Desktop App
                        </a>
                    </div>

                    {game.instructions_markdown && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                                Info
                            </h3>
                            <div className="prose prose-invert prose-sm text-slate-400">
                                <ReactMarkdown>{game.instructions_markdown}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
