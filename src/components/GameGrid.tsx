import { PortData } from '../types';
import { GameCard } from './GameCard';
import { PackageOpen } from 'lucide-react';

interface GameGridProps {
    games: PortData[];
    onGameSelect: (game: PortData) => void;
}

export function GameGrid({ games, onGameSelect }: GameGridProps) {
    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <PackageOpen className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-zinc-400">No games found</h3>
                <p className="text-sm mt-2">Try adjusting your search or filters.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
            {games.map(game => (
                <GameCard
                    key={game.id}
                    game={game}
                    onClick={onGameSelect}
                />
            ))}
        </div>
    );
}
