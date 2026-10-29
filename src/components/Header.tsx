import { Search, Download } from 'lucide-react';
import clsx from 'clsx';

const FILTERS = ['All', 'PC Ports', 'Android Ports', 'Standalone .nro', 'Requires Assets'];

interface HeaderProps {
    onSearchChange: (query: string) => void;
    onFilterChange: (filter: string) => void;
    activeFilter: string;
}

export function Header({ onSearchChange, onFilterChange, activeFilter }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                         PortsDL-NX Showcase
                    </h1>
                </div>

                <div className="flex-1 max-w-xl flex items-center gap-2 relative">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search games..."
                            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-700 focus:border-slate-600 transition duration-150 ease-in-out sm:text-sm"
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <a
                        href="https://github.com/Niecks90/PortsDL-NX/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Download Windows App
                    </a>
                </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FILTERS.map(filter => (
                    <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                            activeFilter === filter
                                ? "bg-slate-100 text-slate-900 border-slate-100"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200"
                        )}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </header>
    );
}
