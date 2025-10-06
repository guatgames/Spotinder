import { useState, useEffect } from "react";
import { SongCard } from "@/components/SongCard";
import { MusicPreferences } from "@/components/MusicPreferences";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { DeezerService, Artist } from "@/services/deezerService";
import { SpotifyAuthService, SpotifyTrack } from "@/services/spotifyAuthService";
import { useToast } from "@/hooks/use-toast";
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [useSpotify, setUseSpotify] = useState(false);
  const [deezerRelatedSongs, setDeezerRelatedSongs] = useState<Song[]>([]);
  const [currentDeezerIndex, setCurrentDeezerIndex] = useState(0);
  const { toast } = useToast();

  // Check for Spotify callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyToken = urlParams.get('spotify_token');
    const spotifyRefresh = urlParams.get('spotify_refresh');
    const spotifyExpires = urlParams.get('spotify_expires');
    const spotifyError = urlParams.get('spotify_error');

    if (spotifyError) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo conectar con Spotify. Intenta de nuevo.",
        variant: "destructive"
      });
      setShowWelcome(true);
      // Clean URL
      window.history.replaceState({}, '', '/');
      return;
    }

    if (spotifyToken && spotifyRefresh && spotifyExpires) {
      const spotifyService = SpotifyAuthService.getInstance();
      spotifyService.setTokens({
        accessToken: spotifyToken,
        refreshToken: spotifyRefresh,
        expiresIn: parseInt(spotifyExpires),
        obtainedAt: Date.now()
      });

      setUseSpotify(true);
      setShowWelcome(false);
      setShowPreferences(true); // Show preferences to get favorite artists
      
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (!showWelcome && !showPreferences && userPreferences) {
      loadDeezerRelatedRecommendations();
    }
  }, [showWelcome, showPreferences, userPreferences]);

  const loadDeezerRelatedRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!userPreferences || userPreferences.length === 0) {
        setError("No hay artistas seleccionados");
        return;
      }

      const deezerService = DeezerService.getInstance();
      const allRelatedSongs: Song[] = [];
      
      // Get related artists for each favorite artist
      for (const favoriteArtist of userPreferences) {
        console.log('Getting related artists for:', favoriteArtist.name);
        const relatedArtists = await deezerService.getRelatedArtists(favoriteArtist.id);
        
        // Get songs from each related artist
        for (const relatedArtist of relatedArtists.slice(0, 3)) { // Limit to 3 related artists per favorite
          const tracks = await deezerService.getArtistTracks(relatedArtist.id, 10);
          allRelatedSongs.push(...tracks);
        }
      }
      
      if (allRelatedSongs.length === 0) {
        setError("No se encontraron canciones relacionadas");
        return;
      }

      // Shuffle songs for variety
      const shuffled = allRelatedSongs.sort(() => Math.random() - 0.5);
      console.log('Loaded', shuffled.length, 'related songs from Deezer');
      
      setDeezerRelatedSongs(shuffled);
      setCurrentDeezerIndex(0);
      setCurrentSong(shuffled[0]);
      
    } catch (err) {
      setError("Error al cargar recomendaciones");
      console.error("Error loading Deezer related recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextDeezerRelated = async () => {
    const nextIndex = currentDeezerIndex + 1;
    
    if (nextIndex >= deezerRelatedSongs.length) {
      // No more songs, reload
      await loadDeezerRelatedRecommendations();
    } else {
      setCurrentDeezerIndex(nextIndex);
      setCurrentSong(deezerRelatedSongs[nextIndex]);
    }
  };

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

  const handleLike = async (song: Song) => {
    console.log("Liked song:", song.name);
    await loadNextDeezerRelated();
  };

  const handleDislike = async (song: Song) => {
    console.log("Disliked song:", song.name);
    await loadNextDeezerRelated();
  };

  const handleSpotifyLogin = async () => {
    try {
      const spotifyService = SpotifyAuthService.getInstance();
      const authUrl = await spotifyService.initiateLogin();
      // Redirect to Spotify login
      window.location.href = authUrl;
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión con Spotify",
        variant: "destructive"
      });
      console.error('Spotify login error:', err);
    }
  };

  const handleContinueWithoutSpotify = () => {
    setShowWelcome(false);
    setShowPreferences(true);
    setUseSpotify(false);
  };

  const handlePreferencesComplete = (selectedArtists: Artist[]) => {
    setUserPreferences(selectedArtists);
    setShowPreferences(false);
    console.log("User selected artists:", selectedArtists.map(a => a.name).join(", "));
  };

  // Show welcome screen first
  if (showWelcome) {
    return (
      <WelcomeScreen
        onSpotifyLogin={handleSpotifyLogin}
        onContinueWithoutSpotify={handleContinueWithoutSpotify}
      />
    );
  }

  // Show preferences screen if not using Spotify
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
          {useSpotify ? 'Powered by Spotify + Deezer API' : 'Powered by Deezer API'}
        </p>
      </footer>
    </div>
  );
};

export default Index;