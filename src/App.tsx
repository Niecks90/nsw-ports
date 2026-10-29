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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedGame, setSelectedGame] = useState<PortData | null>(null);

  useEffect(() => {
    fetchCatalog().then(data => {
      setGames(data);
      setLoading(false);
    });
  }, []);

  const handleRefreshCatalog = async (url?: string) => {
    setLoading(true);
    const data = await fetchCatalog(url);
    setGames(data);
    setLoading(false);
  };

  const filteredGames = useMemo(() => {
      let result = games;
      if (activeFilter === 'PC Ports') {
          result = result.filter(g => g.original_platform?.toLowerCase() === 'pc');
      } else if (activeFilter === 'Android Ports') {
          result = result.filter(g => g.original_platform?.toLowerCase() === 'android');
      } else if (activeFilter === 'Standalone .nro') {
          result = result.filter(g => g.asset_type === 'nro');
      } else if (activeFilter === 'Requires Assets') {
          result = result.filter(g => g.requires_original_assets);
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
