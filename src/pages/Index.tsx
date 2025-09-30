import { useState, useEffect } from "react";
import { SongCard } from "@/components/SongCard";
import { DeezerService } from "@/services/deezerService";
import demoAlbumCover from "@/assets/demo-album-cover.jpg";

export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  preview_url: string | null;
  external_url: string;
}

const Index = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRandomSong();
  }, []);

  const loadRandomSong = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const deezerService = DeezerService.getInstance();
      const randomSong = await deezerService.getRandomTrack();
      
      console.log(`Loaded song:`, randomSong.name, 'by', randomSong.artist);
      console.log(`Has preview:`, randomSong.preview_url ? 'Yes' : 'No');
      
      setCurrentSong(randomSong);
      
    } catch (err) {
      setError("Error loading song. Please try again.");
      console.error("Error loading song:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (song: Song) => {
    console.log("Liked song:", song.name);
    // Here you would save the liked song to user's preferences
    await loadRandomSong();
  };

  const handleDislike = async (song: Song) => {
    console.log("Disliked song:", song.name);
    // Here you would save the disliked song to user's preferences
    await loadRandomSong();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-glow w-16 h-16 bg-gradient-primary rounded-full mx-auto mb-4"></div>
          <p className="text-music-text-secondary">Loading your next song...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button 
            onClick={loadRandomSong}
            className="px-6 py-2 bg-gradient-primary text-music-text-primary rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="p-6 text-center">
        <h1 className="text-3xl font-bold text-music-text-primary mb-2">
          Music Discovery
        </h1>
        <p className="text-music-text-secondary">
          Swipe right if you like it, left if you don't
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        {currentSong && (
          <SongCard
            song={currentSong}
            onLike={handleLike}
            onDislike={handleDislike}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-music-text-muted text-sm">
          Powered by Deezer API
        </p>
      </footer>
    </div>
  );
};

export default Index;