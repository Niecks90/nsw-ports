import { useState, useEffect } from "react";
import { PortData } from '../types';
import { fetchGameCoverUrl } from '../services/steamgriddb';
import { Image as ImageIcon } from 'lucide-react';

interface GameCardProps {
    game: PortData;
    onClick: (game: PortData) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        fetchGameCoverUrl(game.title, game.steamgriddb_id, game.grid_image_url).then(url => {
            if (mounted && url) {
                setCoverUrl(url);
            }
        });
        return () => { mounted = false; };
    }, [game.title, game.steamgriddb_id, game.grid_image_url]);

    return (
        <div
            onClick={() => onClick(game)}
            className="group relative flex flex-col cursor-pointer overflow-hidden rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all duration-300"
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={game.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={() => setCoverUrl(null)}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600 p-2 text-center">
                        <ImageIcon className="w-8 h-8 opacity-50" />
                        <span className="font-medium text-slate-400 text-sm w-full break-words line-clamp-3">{game.title}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-20">
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/90 text-white rounded shadow-sm backdrop-blur-sm truncate max-w-[100px]">
                        {game.original_platform}
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                    <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md">
                        {game.title}
                    </h3>
                    <p className="text-slate-300 text-[10px] mt-0.5 truncate drop-shadow-md">
                        {game.author}
                    </p>
                </div>
            </div>
        </div>
    );
}
