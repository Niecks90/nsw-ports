import { PortData } from '../types';
import { GameCard } from './GameCard';
import { PackageOpen, X, Sparkles, User } from 'lucide-react';

interface GameGridProps {
    games: PortData[];
    onGameSelect: (game: PortData) => void;
    activeAuthor?: string | null;
    onClearAuthor?: () => void;
    recentOnly?: boolean;
    onClearRecentOnly?: () => void;
    onResetAllFilters?: () => void;
}

export function GameGrid({
    games,
    onGameSelect,
    activeAuthor,
    onClearAuthor,
    recentOnly,
    onClearRecentOnly,
    onResetAllFilters,
}: GameGridProps) {
    const hasActiveSubFilters = Boolean(activeAuthor || recentOnly);

    return (
        <div className="w-full">
            {/* Result Counter & Active Sub-Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-slate-400 border-b border-slate-900/60 bg-slate-950/30">
                <div className="flex items-center gap-2 flex-wrap">
                    <span>
                        Showing <strong className="text-slate-100 font-semibold">{games.length}</strong> {games.length === 1 ? 'port' : 'ports'}
                    </span>

                    {/* Active Author Filter Pill */}
                    {activeAuthor && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/15 text-blue-300 border border-blue-500/30 font-medium">
                            <User className="w-3 h-3 text-blue-400" />
                            <span>Developer: {activeAuthor}</span>
                            {onClearAuthor && (
                                <button
                                    onClick={onClearAuthor}
                                    className="hover:text-white hover:bg-blue-500/30 rounded-full p-0.5 transition-colors cursor-pointer"
                                    title="Clear author filter"
                                    aria-label="Clear author filter"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    )}

                    {/* Active Recently Updated Filter Pill */}
                    {recentOnly && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 font-medium">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Recently Updated (7d)</span>
                            {onClearRecentOnly && (
                                <button
                                    onClick={onClearRecentOnly}
                                    className="hover:text-white hover:bg-emerald-500/30 rounded-full p-0.5 transition-colors cursor-pointer"
                                    title="Clear recent filter"
                                    aria-label="Clear recent filter"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </span>
                    )}
                </div>

                {hasActiveSubFilters && onResetAllFilters && (
                    <button
                        onClick={onResetAllFilters}
                        className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                        Reset filters
                    </button>
                )}
            </div>

            {/* Empty State */}
            {games.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-500 px-4 text-center">
                    <PackageOpen className="w-16 h-16 mb-4 opacity-40 text-slate-500" />
                    <h3 className="text-xl font-semibold text-slate-300">No ports found</h3>
                    <p className="text-sm text-slate-400 mt-2 max-w-sm">
                        No ports match your current search criteria or active filters.
                    </p>
                    {onResetAllFilters && (
                        <button
                            onClick={onResetAllFilters}
                            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium border border-slate-700 transition-colors"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            ) : (
                /* Balanced Grid: 7-8 columns cap on desktop for breathing room */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4 p-4">
                    {games.map((game, index) => (
                        <GameCard
                            key={`${game.id}-${index}`}
                            game={game}
                            onClick={onGameSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
