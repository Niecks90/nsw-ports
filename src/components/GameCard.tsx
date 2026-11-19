import { useState, useEffect } from "react";
import { PortData } from '../types';
import { fetchGameCoverUrl } from '../services/steamgriddb';
import { Image as ImageIcon } from 'lucide-react';
import { getShortPlatformName, getPlatformBadgeClasses } from '../utils/platforms';
import { isRecentlyUpdated } from '../utils/dates';
import { cleanTitle } from '../utils/titles';
import clsx from 'clsx';

interface GameCardProps {
    game: PortData;
    onClick: (game: PortData) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const displayTitle = cleanTitle(game.title);

    useEffect(() => {
        let mounted = true;
        fetchGameCoverUrl(displayTitle, game.steamgriddb_id, game.grid_image_url).then(url => {
            if (mounted && url) {
                setCoverUrl(url);
            }
        });
        return () => { mounted = false; };
    }, [displayTitle, game.steamgriddb_id, game.grid_image_url]);

    const isNew = isRecentlyUpdated(game.last_updated, 7);

    return (
        <div
            onClick={() => onClick(game)}
            className="group relative flex flex-col cursor-pointer overflow-hidden rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
        >
            {/* 2:3 Vertical Poster */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={displayTitle}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={() => setCoverUrl(null)}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600 p-3 text-center">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="font-medium text-slate-400 text-xs w-full break-words line-clamp-3">
                            {displayTitle}
                        </span>
                    </div>
                )}

                {/* Subtle vignette hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* High-contrast Console Badge with shadow & ring */}
                <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    <span className={clsx(
                        "whitespace-nowrap text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded shadow-md ring-1 ring-black/40 backdrop-blur-sm",
                        getPlatformBadgeClasses(game.original_platform)
                    )}>
                        {getShortPlatformName(game.original_platform)}
                    </span>
                </div>

                {/* Top-Right "NEW" Indicator for games updated within 7 days */}
                {isNew && (
                    <div className="absolute top-2 right-2 z-20 pointer-events-none flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-md ring-1 ring-black/40 backdrop-blur-sm">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-100"></span>
                        </span>
                        <span className="tracking-wider">NEW</span>
                    </div>
                )}
            </div>

            {/* Compact, Clean Card Footer Metadata */}
            <div className="p-2 sm:p-2.5 bg-slate-900 border-t border-slate-800/80 flex flex-col justify-center min-w-0">
                <h3
                    className="text-white font-bold text-xs sm:text-sm truncate leading-tight group-hover:text-blue-400 transition-colors"
                    title={displayTitle}
                >
                    {displayTitle}
                </h3>
                <p
                    className="text-xs text-slate-400 truncate mt-0.5"
                    title={game.author}
                >
                    {game.author || "Unknown author"}
                </p>
            </div>
        </div>
    );
}
