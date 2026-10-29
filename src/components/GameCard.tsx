import { PortData } from '../types';
import { Image as ImageIcon } from 'lucide-react';

interface GameCardProps {
    game: PortData;
    onClick: (game: PortData) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
    const isNative = game.original_platform?.toLowerCase() !== 'emulators';
    const isNro = game.asset_type === 'nro';

    return (
        <div
            onClick={() => onClick(game)}
            className="group relative flex flex-col cursor-pointer overflow-hidden rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all duration-300"
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                {game.grid_image_url ? (
                    <img
                        src={game.grid_image_url}
                        alt={game.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-4 text-slate-600 p-4 text-center">
                        <ImageIcon className="w-12 h-12 opacity-50" />
                        <span className="font-medium text-slate-400 truncate w-full">{game.title}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
                    <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/90 text-white rounded shadow-sm backdrop-blur-sm">
                        {game.original_platform}
                    </span>
                    {game.requires_original_assets && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/90 text-white rounded shadow-sm backdrop-blur-sm">
                            Requires Assets
                        </span>
                    )}
                    {isNro && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/90 text-white rounded shadow-sm backdrop-blur-sm">
                            .nro
                        </span>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                    <h3 className="text-white font-bold text-lg leading-tight truncate drop-shadow-md">
                        {game.title}
                    </h3>
                    <p className="text-slate-300 text-xs mt-1 truncate drop-shadow-md">
                        {isNative ? 'Native' : 'Emulated'} • By {game.author} • v{game.version}
                    </p>
                </div>
            </div>
        </div>
    );
}
