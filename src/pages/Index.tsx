import { useState, useEffect } from "react";
import { SongCard } from "@/components/SongCard";
import { MusicPreferences } from "@/components/MusicPreferences";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { DeezerService, Artist } from "@/services/deezerService";
import { SpotifyAuthService, SpotifyTrack } from "@/services/spotifyAuthService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const [noAuthRecommendations, setNoAuthRecommendations] = useState<SpotifyTrack[]>([]);
  const [currentNoAuthIndex, setCurrentNoAuthIndex] = useState(0);
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
      loadNoAuthSpotifyRecommendations();
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

  const loadNoAuthSpotifyRecommendations = async () => {
    if (!userPreferences || userPreferences.length === 0) {
      setError("No se seleccionaron artistas");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const artistNames = userPreferences.map(artist => artist.name);
      console.log('Getting recommendations for artists:', artistNames);
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'spotify-recommendations-no-auth',
        {
          body: { artistNames }
        }
      );

      if (functionError) {
        throw functionError;
      }

      const tracks = data.tracks || [];
      console.log('Got recommendations without auth:', tracks.length);
      
      setNoAuthRecommendations(tracks);
      setCurrentNoAuthIndex(0);
      
      // Load first song from Deezer
      if (tracks.length > 0) {
        await loadSongFromSpotifyTrack(tracks[0]);
      } else {
        setError("No se encontraron recomendaciones");
      }
    } catch (err) {
      setError("Error al cargar recomendaciones");
      console.error("Error loading no-auth Spotify recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNextNoAuthRecommendation = async () => {
    const nextIndex = currentNoAuthIndex + 1;
    
    if (nextIndex >= noAuthRecommendations.length) {
      // No more recommendations, reload
      await loadNoAuthSpotifyRecommendations();
    } else {
      setCurrentNoAuthIndex(nextIndex);
      await loadSongFromSpotifyTrack(noAuthRecommendations[nextIndex]);
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
    if (useSpotify) {
      await loadNextSpotifyRecommendation();
    } else {
      await loadNextNoAuthRecommendation();
    }
  };

  const handleDislike = async (song: Song) => {
    console.log("Disliked song:", song.name);
    if (useSpotify) {
      await loadNextSpotifyRecommendation();
    } else {
      await loadNextNoAuthRecommendation();
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