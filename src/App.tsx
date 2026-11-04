import { useState, useEffect, useMemo } from "react";
import { Header } from './components/Header';
import { GameGrid } from './components/GameGrid';
import { SidebarModal } from './components/SidebarModal';
import { Footer } from './components/Footer';
import { fetchCatalog } from './services/catalog';
import { PortData } from './types';
import { Loader2 } from 'lucide-react';

function App() {
  const [games, setGames] = useState<PortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortOption, setSortOption] = useState<'alpha' | 'recent'>('alpha');
  const [sortReverse, setSortReverse] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PortData | null>(null);

  const filterOptions = useMemo(() => {
    const platforms = Array.from(new Set(games.map(g => g.original_platform?.trim()).filter(Boolean)));
    const filteredPlatforms = platforms.filter(p => p.toLowerCase() !== 'emulators');
    filteredPlatforms.sort();
    return ['All', ...filteredPlatforms];
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
      const query = searchQuery.trim().toLowerCase();

      const filtered = games.filter(game => {
          const platform = game.original_platform?.trim();
          if (platform?.toLowerCase() === 'emulators') return false;

          const matchesCategory = activeFilter === 'All' || platform === activeFilter;
          const matchesSearch = !query ||
              game.title.toLowerCase().includes(query) ||
              (game.author && game.author.toLowerCase().includes(query)) ||
              (platform && platform.toLowerCase().includes(query));

          return matchesCategory && matchesSearch;
      });

      filtered.sort((a, b) => {
          if (sortOption === 'recent') {
              const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
              const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
              const comparison = dateB - dateA;
              return sortReverse ? -comparison : comparison;
          } else {
              const titleA = a.title.toLowerCase();
              const titleB = b.title.toLowerCase();
              const comparison = titleA < titleB ? -1 : titleA > titleB ? 1 : 0;
              return sortReverse ? -comparison : comparison;
          }
      });

      return filtered;
  }, [games, searchQuery, activeFilter, sortOption, sortReverse]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Header
        filters={filterOptions}
        onSearchChange={setSearchQuery}
        onFilterChange={setActiveFilter}
        activeFilter={activeFilter}
        onRefreshCatalog={handleRefreshCatalog}
        sortOption={sortOption}
        onSortChange={setSortOption}
        sortReverse={sortReverse}
        onSortReverseToggle={() => setSortReverse(!sortReverse)}
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

      <Footer />
    </div>
  );
}

export default App;
