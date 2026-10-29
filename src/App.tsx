import { useState, useEffect, useMemo } from "react";
import { Header } from './components/Header';
import { GameGrid } from './components/GameGrid';
import { SidebarModal } from './components/SidebarModal';
import { fetchCatalog } from './services/catalog';
import { PortData } from './types';
import { Loader2 } from 'lucide-react';
import Fuse from 'fuse.js';

function App() {
  const [games, setGames] = useState<PortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedGame, setSelectedGame] = useState<PortData | null>(null);

  const filterOptions = useMemo(() => {
    const platforms = Array.from(new Set(games.map(g => g.original_platform).filter(Boolean)));
    platforms.sort();
    return ['All', ...platforms];
  }, [games]);

  const loadCatalog = async (url?: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchCatalog(url);
      setGames(data);
      if (!data || data.length === 0) {
        setError(true);
      }
    } catch (e) {
      console.error(e);
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleRefreshCatalog = async (url?: string) => {
    await loadCatalog(url);
  };

  const filteredGames = useMemo(() => {
      let result = games;
      if (activeFilter !== 'All') {
          result = result.filter(g => g.original_platform === activeFilter);
      }
      if (searchQuery) {
          const fuse = new Fuse(result, { keys: ['title', 'author', 'original_platform'], threshold: 0.3 });
          result = fuse.search(searchQuery).map(res => res.item);
      }
      return result;
  }, [games, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Header
        filters={filterOptions}
        onSearchChange={setSearchQuery}
        onFilterChange={setActiveFilter}
        activeFilter={activeFilter}
        onRefreshCatalog={handleRefreshCatalog}
      />

      <main className="flex-1 overflow-x-hidden relative">
        {loading ? (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            </div>
        ) : error ? (
            <div className="flex flex-col h-[50vh] items-center justify-center text-center space-y-4">
                <h2 className="text-xl font-semibold text-slate-200">Failed to load catalog</h2>
                <p className="text-slate-400">We couldn't fetch the latest switch ports data.</p>
                <button
                  onClick={() => loadCatalog()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium transition-colors"
                >
                    Try Again
                </button>
            </div>
        ) : (
            <GameGrid
                games={filteredGames}
                onGameSelect={setSelectedGame}
            />
        )}
      </main>

      {selectedGame && (
          <SidebarModal
              game={selectedGame}
              onClose={() => setSelectedGame(null)}
          />
      )}
    </div>
  );
}

export default App;
