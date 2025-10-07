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
  const [spotifyRecommendations, setSpotifyRecommendations] = useState<SpotifyTrack[]>([]);
  const [currentSpotifyIndex, setCurrentSpotifyIndex] = useState(0);
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
      
      // Clean URL
      window.history.replaceState({}, '', '/');
      
      // Load Spotify recommendations
      loadSpotifyRecommendations();
    }
  }, []);

  useEffect(() => {
    if (!showWelcome && !showPreferences && !useSpotify && userPreferences) {
      loadDeezerRelatedRecommendations();
    }
  }, [showWelcome, showPreferences, userPreferences, useSpotify]);

  const loadSpotifyRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const spotifyService = SpotifyAuthService.getInstance();
      const recommendations = await spotifyService.getRecommendations();
      
      console.log('Got Spotify recommendations:', recommendations.length);
      setSpotifyRecommendations(recommendations);
      setCurrentSpotifyIndex(0);
      
      // Load first song from Deezer
      if (recommendations.length > 0) {
        await loadSongFromSpotifyTrack(recommendations[0]);
      } else {
        setError("No se encontraron recomendaciones de Spotify");
      }
    } catch (err) {
      setError("Error al cargar recomendaciones de Spotify");
      console.error("Error loading Spotify recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSongFromSpotifyTrack = async (spotifyTrack: SpotifyTrack) => {
    try {
      setLoading(true);
      const deezerService = DeezerService.getInstance();
      
      // Search for this track in Deezer
      const artistName = spotifyTrack.artists[0]?.name || '';
      const deezerSong = await deezerService.searchSpecificTrack(
        spotifyTrack.name,
        artistName
      );
      
      if (deezerSong) {
        console.log('Found song in Deezer:', deezerSong.name);
        setCurrentSong(deezerSong);
      } else {
        // If not found in Deezer, skip to next
        console.log('Song not found in Deezer, trying next...');
        await loadNextSpotifyRecommendation();
      }
    } catch (err) {
      console.error('Error loading song from Spotify track:', err);
      await loadNextSpotifyRecommendation();
    } finally {
      setLoading(false);
    }
  };

  const loadNextSpotifyRecommendation = async () => {
    const nextIndex = currentSpotifyIndex + 1;
    
    if (nextIndex >= spotifyRecommendations.length) {
      // No more recommendations, reload
      await loadSpotifyRecommendations();
    } else {
      setCurrentSpotifyIndex(nextIndex);
      await loadSongFromSpotifyTrack(spotifyRecommendations[nextIndex]);
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
    if (useSpotify) {
      await loadNextSpotifyRecommendation();
    } else {
      await loadNextDeezerRelated();
    }
  };

  const handleDislike = async (song: Song) => {
    console.log("Disliked song:", song.name);
    if (useSpotify) {
      await loadNextSpotifyRecommendation();
    } else {
      await loadNextDeezerRelated();
    }
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
            onClick={useSpotify ? loadSpotifyRecommendations : loadDeezerRelatedRecommendations}
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