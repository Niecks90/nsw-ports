import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useState, useEffect } from "react";
import { PortData } from '../types';
import { X, ExternalLink, Download, Loader2, Calendar, User, Info } from 'lucide-react';
import { AssetPicker } from './AssetPicker';
import { DeploymentSelector } from './DeploymentSelector';
import { fetchGameCoverUrl } from '../services/steamgriddb';
import { isTauri } from '../utils/env';
import { getShortPlatformName, getPlatformBadgeClasses } from '../utils/platforms';
import { formatVersion } from '../utils/version';
import { formatDisplayDate } from '../utils/dates';
import { resolveGithubRawUrl } from '../utils/github';
import { cleanGameTitle } from '../utils/title';
import clsx from 'clsx';

interface SidebarModalProps {
    game: PortData | null;
    onClose: () => void;
    onSelectAuthor?: (author: string) => void;
}

export function SidebarModal({ game, onClose, onSelectAuthor }: SidebarModalProps) {
    const [assetsReady, setAssetsReady] = useState(false);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [readmeContent, setReadmeContent] = useState<string | null>(null);
    const [readmeLoading, setReadmeLoading] = useState(false);
    const displayTitle = cleanTitle(game?.title);

    const displayTitle = cleanGameTitle(game?.title, game?.author);

    useEffect(() => {
        if (!game) return;
        let mounted = true;
        fetchGameCoverUrl(displayTitle, game.steamgriddb_id, game.grid_image_url).then(url => {
            if (mounted && url) setCoverUrl(url);
        });

        // Reset README state
        setReadmeContent(null);

        if (game.url && game.url.includes("github.com")) {
            setReadmeLoading(true);
            const githubSlugMatch = game.url.match(/github\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+)/);
            if (githubSlugMatch) {
                const slug = githubSlugMatch[1].replace(/\/$/, "").replace(/\.git$/, "");
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

    const cleanVersion = formatVersion(game.version);
    const formattedDate = formatDisplayDate(game.last_updated);

    const handleSaveCover = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!coverUrl) return;

        try {
            const response = await fetch(coverUrl);
            if (response.ok) {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                const safeName = displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                a.download = `${safeName}-cover.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                return;
            }
        } catch (err) {
            console.warn("Direct blob download failed, falling back to window.open", err);
        }

        // Fallback: open directly in a new tab
        window.open(coverUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative max-w-5xl w-full max-h-[92vh] md:max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden z-10">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors backdrop-blur-md cursor-pointer"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Column: Sidebar / Metadata with Steam/Playnite Ambient Glow */}
                <div className="relative w-full md:w-80 bg-slate-950/70 p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 flex-shrink-0 md:border-r border-slate-800 overflow-y-auto overflow-x-hidden">
                    {/* Ambient Glow Backdrop */}
                    {coverUrl && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
                            <img
                                src={coverUrl}
                                alt=""
                                className="w-full h-full object-cover blur-2xl opacity-20 scale-110 transform -translate-y-6"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950" />
                        </div>
                    )}

                    {/* Column Content */}
                    <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
                        {/* Game Poster with "Save Cover" Overlay */}
                        <div className="relative group w-full max-h-52 sm:max-h-64 mx-auto bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800/80 flex items-center justify-center flex-shrink-0">
                            {coverUrl ? (
                                <>
                                    <img
                                        src={coverUrl}
                                        alt={displayTitle}
                                        className="w-full h-full object-contain md:object-cover"
                                    />
                                    {/* Subtle Save Cover Download Button Overlay */}
                                    <button
                                        onClick={handleSaveCover}
                                        className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 bg-slate-950/85 hover:bg-slate-900 text-slate-200 hover:text-white rounded-lg text-xs font-medium backdrop-blur-md border border-slate-700/60 shadow-lg flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                                        title="Save 600x900 cover art"
                                    >
                                        <Download className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Save Cover</span>
                                    </button>
                                </>
                            ) : (
                                <span className="text-slate-600 font-medium py-12">No cover art</span>
                            )}
                        </div>

                        {/* Title & Badges */}
                        <div className="flex flex-col gap-2 text-center md:text-left">
                            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{displayTitle}</h2>

                            <div className="flex flex-wrap gap-1.5 justify-center md:justify-start text-xs font-medium mt-1">
                                {game.original_platform && (
                                    <span className={clsx("px-2 py-0.5 rounded font-bold shadow-md ring-1 ring-black/40", getPlatformBadgeClasses(game.original_platform))}>
                                        {getShortPlatformName(game.original_platform)}
                                    </span>
                                )}
                                {cleanVersion && (
                                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60 text-slate-200">
                                        {cleanVersion}
                                    </span>
                                )}
                                {game.author && (
                                    <button
                                        onClick={() => {
                                            onSelectAuthor?.(game.author);
                                            onClose();
                                        }}
                                        className="bg-slate-800 hover:bg-blue-600/20 hover:text-blue-300 hover:border-blue-500/40 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer group/author"
                                        title={`Filter catalog by ${game.author}`}
                                    >
                                        <User className="w-3 h-3 text-slate-400 group-hover/author:text-blue-400" />
                                        <span>By {game.author}</span>
                                    </button>
                                )}
                                {formattedDate && (
                                    <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 text-slate-400 flex items-center gap-1" title="Last updated">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        <span>{formattedDate}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Info Notices & Controls */}
                        <div className="space-y-3.5">
                            {/* Compact Commercial Game Files Notice */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-left">
                                <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs mb-1">
                                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>Original Game Files Required</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-snug">
                                    {game.expected_asset_hint || "Original commercial game files are required to play this port. Ensure you own a legitimate copy."}
                                </p>
                            </div>

                            {isTauri && <AssetPicker game={game} onAssetReady={setAssetsReady} />}
                            {isTauri && <DeploymentSelector game={game} assetsReady={assetsReady} />}

                            {!isTauri && (
                                <div className="flex flex-col gap-3">
                                    <a
                                        href={game.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-lg font-medium transition-colors border border-slate-700 text-sm shadow-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Source / Download
                                    </a>

                                    {/* Rebranded NSW Ports Desktop Launcher Callout Card */}
                                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3 text-center">
                                        <h4 className="font-semibold text-blue-400 text-xs mb-1">Want 1-click FTP install to your Switch?</h4>
                                        <p className="text-[10px] text-slate-400 mb-3 leading-snug">
                                            Use the NSW Ports Desktop Launcher to easily download, prepare assets, and deploy directly to your console.
                                        </p>
                                        <a
                                            href="https://github.com/Niecks90/PortsDL-NX/releases"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow text-xs"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Get Desktop App
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Main Content (README) */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 flex flex-col bg-slate-900">
                    <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">
                        About & Installation
                    </h3>

                    <div className="prose prose-invert max-w-none break-words text-slate-300 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-a:text-blue-400 hover:prose-a:text-blue-300">
                        {readmeLoading ? (
                            <div className="flex items-center gap-3 text-slate-500 py-12 justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                <span>Loading README...</span>
                            </div>
                        ) : readmeContent ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                urlTransform={(url) => resolveGithubRawUrl(url, game.url)}
                                components={{
                                    img: ({ node, src, alt, ...props }) => {
                                        const resolvedSrc = resolveGithubRawUrl(src, game.url);
                                        return (
                                            <img
                                                src={resolvedSrc}
                                                alt={alt || ''}
                                                className="max-w-full h-auto rounded-lg shadow-md my-2 inline-block"
                                                loading="lazy"
                                                onError={(e) => {
                                                    // Hide image gracefully if 404
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                                {...props}
                                            />
                                        );
                                    },
                                    a: ({ node, href, children, ...props }) => {
                                        const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
                                        return (
                                            <a
                                                href={href}
                                                target={isExternal ? "_blank" : undefined}
                                                rel={isExternal ? "noopener noreferrer" : undefined}
                                                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors break-words"
                                                {...props}
                                            >
                                                {children}
                                            </a>
                                        );
                                    }
                                }}
                            >
                                {readmeContent}
                            </ReactMarkdown>
                        ) : (
                            <div className="text-slate-500 py-12 italic text-center bg-slate-850/40 rounded-xl border border-slate-800/60">
                                No README available for this port — visit the repository for more information.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
