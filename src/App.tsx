import { useState, useEffect, useMemo } from "react";
import { Header } from './components/Header';
import { GameGrid } from './components/GameGrid';
import { SidebarModal } from './components/SidebarModal';
import { Footer } from './components/Footer';
import { fetchCatalog } from './services/catalog';
import { PortData } from './types';
import { parseCatalogDate, isRecentlyUpdated } from './utils/dates';
import { cleanTitle } from './utils/titles';
import { Loader2 } from 'lucide-react';

function App() {
  const [games, setGames] = useState<PortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const [recentOnly, setRecentOnly] = useState(false);
  const [sortOption, setSortOption] = useState<'alpha' | 'recent'>('alpha');
  const [sortReverse, setSortReverse] = useState(false);
  const [selectedGame, setSelectedGame] = useState<PortData | null>(null);

  const filterOptions = useMemo(() => {
    const platforms = Array.from(new Set(games.map(g => g.original_platform?.trim()).filter(Boolean)));
    const filteredPlatforms = platforms.filter(p => p.toLowerCase() !== 'emulators');
    filteredPlatforms.sort((a, b) => a.localeCompare(b));
    return ['All', ...filteredPlatforms];
  }, [games]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    for (const game of games) {
      const platform = game.original_platform?.trim();
      if (!platform || platform.toLowerCase() === 'emulators') continue;
      counts.All = (counts.All || 0) + 1;
      counts[platform] = (counts[platform] || 0) + 1;
    }
    return counts;
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

  const handleRecentOnlyToggle = (enabled: boolean) => {
    setRecentOnly(enabled);
    if (enabled && sortOption !== 'recent') {
      setSortOption('recent');
      setSortReverse(false);
    }
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setActiveFilter('All');
    setActiveAuthor(null);
    setRecentOnly(false);
  };

  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = games.filter(game => {
      const platform = game.original_platform?.trim();
      if (platform?.toLowerCase() === 'emulators') return false;

      const matchesCategory = activeFilter === 'All' || platform === activeFilter;

      const matchesAuthor = !activeAuthor ||
        (game.author && game.author.toLowerCase() === activeAuthor.toLowerCase());

      const matchesRecent = !recentOnly || isRecentlyUpdated(game.last_updated, 7);

      const title = cleanTitle(game.title);
      const matchesSearch = !query ||
        title.toLowerCase().includes(query) ||
        (game.author && game.author.toLowerCase().includes(query)) ||
        (platform && platform.toLowerCase().includes(query));

      return matchesCategory && matchesAuthor && matchesRecent && matchesSearch;
    });

    filtered.sort((a, b) => {
      const titleA = cleanTitle(a.title);
      const titleB = cleanTitle(b.title);
      if (sortOption === 'recent') {
        const timeA = parseCatalogDate(a.last_updated)?.getTime() || 0;
        const timeB = parseCatalogDate(b.last_updated)?.getTime() || 0;
        const comparison = timeB - timeA;
        if (comparison !== 0) {
          return sortReverse ? -comparison : comparison;
        }
        // Fallback to title comparison when dates are equal
        return titleA.localeCompare(titleB);
      } else {
        const comparison = titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
        return sortReverse ? -comparison : comparison;
      }
    });

    return filtered;
  }, [games, searchQuery, activeFilter, activeAuthor, recentOnly, sortOption, sortReverse]);

  const handleRandomGame = () => {
    const pool = filteredGames.length > 0 ? filteredGames : games;
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setSelectedGame(pool[randomIndex]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Header
        filters={filterOptions}
        filterCounts={filterCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterChange={(filter) => {
          setActiveFilter(filter);
        }}
        activeFilter={activeFilter}
        onRefreshCatalog={handleRefreshCatalog}
        sortOption={sortOption}
        onSortChange={setSortOption}
        sortReverse={sortReverse}
        onSortReverseToggle={() => setSortReverse(!sortReverse)}
        recentOnly={recentOnly}
        onRecentOnlyToggle={handleRecentOnlyToggle}
        onRandomGame={handleRandomGame}
      />

      <main className="flex-1 overflow-x-hidden relative">
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col h-[50vh] items-center justify-center text-center space-y-4 px-4">
            <h2 className="text-xl font-semibold text-slate-200">Failed to load catalog</h2>
            <p className="text-slate-400">We couldn't fetch the latest switch ports data.</p>
            <button
              onClick={() => loadCatalog()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <GameGrid
            games={filteredGames}
            onGameSelect={setSelectedGame}
            activeAuthor={activeAuthor}
            onClearAuthor={() => setActiveAuthor(null)}
            recentOnly={recentOnly}
            onClearRecentOnly={() => setRecentOnly(false)}
            onResetAllFilters={handleResetAllFilters}
          />
        )}
      </main>

      {selectedGame && (
        <SidebarModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onSelectAuthor={(author) => {
            setActiveAuthor(author);
          }}
        />
      )}

      <Footer />
    </div>
  );
}

export default App;
