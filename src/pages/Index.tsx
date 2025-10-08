import { useState, useEffect } from "react";
import { SongCard } from "@/components/SongCard";
import { MusicPreferences } from "@/components/MusicPreferences";
import { DeezerService, Artist } from "@/services/deezerService";
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
  const [userPreferences, setUserPreferences] = useState<Artist[] | null>(null);
  const [showPreferences, setShowPreferences] = useState(true);
  const [deezerRelatedSongs, setDeezerRelatedSongs] = useState<Song[]>([]);
  const [currentDeezerIndex, setCurrentDeezerIndex] = useState(0);

  useEffect(() => {
    if (!showPreferences && userPreferences) {
      loadDeezerRelatedRecommendations();
    }
  }, [showPreferences, userPreferences]);

  const loadRandomSong = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const deezerService = DeezerService.getInstance();
      const randomSong = await deezerService.getRandomTrack(userPreferences || undefined);
      
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

  const loadDeezerRelatedRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userPreferences || userPreferences.length === 0) {
        setError("No hay artistas seleccionados");
        return;
      }

      const deezerService = DeezerService.getInstance();
      const allSongs: Song[] = [];
      
      console.log('Loading recommendations from related artists...');
      
      // For each favorite artist, get related artists and their tracks
      for (const favoriteArtist of userPreferences) {
        console.log(`Getting related tracks for: ${favoriteArtist.name}`);
        const { tracks } = await deezerService.getRelatedArtistsWithTracks(favoriteArtist.id, 5);
        
        console.log(`Found ${tracks.length} tracks from related artists`);
        allSongs.push(...tracks);
      }
      
      if (allSongs.length === 0) {
        setError("No se encontraron canciones de artistas relacionados");
        return;
      }
      
      // Shuffle songs for variety
      const shuffledSongs = allSongs.sort(() => Math.random() - 0.5);
      
      console.log(`Loaded ${shuffledSongs.length} songs from related artists`);
      setDeezerRelatedSongs(shuffledSongs);
      setCurrentDeezerIndex(0);
      setCurrentSong(shuffledSongs[0]);
      
    } catch (err) {
      setError("Error al cargar recomendaciones. Intenta de nuevo.");
      console.error("Error loading Deezer related recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextDeezerRelated = async () => {
    const nextIndex = currentDeezerIndex + 1;
    
    if (nextIndex >= deezerRelatedSongs.length) {
      // No more songs, reload recommendations
      await loadDeezerRelatedRecommendations();
    } else {
      setCurrentDeezerIndex(nextIndex);
      setCurrentSong(deezerRelatedSongs[nextIndex]);
    }
  };

  const handleLike = async (song: Song) => {
    console.log("Liked song:", song.name);
    // Here you would save the liked song to user's preferences
    await loadNextDeezerRelated();
  };

  const handleDislike = async (song: Song) => {
    console.log("Disliked song:", song.name);
    // Here you would save the disliked song to user's preferences
    await loadNextDeezerRelated();
  };

  const handlePreferencesComplete = (selectedArtists: Artist[]) => {
    setUserPreferences(selectedArtists);
    setShowPreferences(false);
    console.log("User selected artists:", selectedArtists.map(a => a.name).join(", "));
  };

  // Show preferences screen first
  if (showPreferences) {
    return <MusicPreferences onComplete={handlePreferencesComplete} />;
  }

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
            onClick={loadDeezerRelatedRecommendations}
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
          Spofinder
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