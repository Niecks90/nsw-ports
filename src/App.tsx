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

  const filteredGames = useMemo(() => { let result = games; if (activeFilter === 'Native') { result = result.filter(g => g.original_platform?.toLowerCase() !== 'emulators'); } else if (activeFilter === 'Emulators') { result = result.filter(g => g.original_platform?.toLowerCase() === 'emulators'); } else if (activeFilter === 'Requires Files') { result = result.filter(g => g.requires_original_assets); } if (searchQuery) { const fuse = new Fuse(result, { keys: ['title', 'author'], threshold: 0.3 }); result = fuse.search(searchQuery).map(res => res.item); } return result; }, [games, searchQuery, activeFilter]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
      <Header
        onSearchChange={setSearchQuery}
        onFilterChange={setActiveFilter}
        activeFilter={activeFilter}
      />

      <main className="flex-1 overflow-x-hidden relative">
        {loading ? (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
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
