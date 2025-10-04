import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/pages/Index";

export interface SpotifyAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  obtainedAt: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  external_urls: {
    spotify: string;
  };
}

export class SpotifyAuthService {
  private static instance: SpotifyAuthService;
  private tokens: SpotifyAuthTokens | null = null;

  static getInstance(): SpotifyAuthService {
    if (!SpotifyAuthService.instance) {
      SpotifyAuthService.instance = new SpotifyAuthService();
    }
    return SpotifyAuthService.instance;
  }

  // Start Spotify OAuth flow
  async initiateLogin(): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth');

      if (error) {
        throw error;
      }

      const { authUrl, state } = data;
      
      // Store state for verification
      sessionStorage.setItem('spotify_auth_state', state);
      
      return authUrl;
    } catch (error) {
      console.error('Error initiating Spotify login:', error);
      throw error;
    }
  }

  // Store tokens after OAuth callback
  setTokens(tokens: SpotifyAuthTokens): void {
    this.tokens = tokens;
    // Store in localStorage for persistence
    localStorage.setItem('spotify_tokens', JSON.stringify(tokens));
  }

  // Get stored tokens
  getTokens(): SpotifyAuthTokens | null {
    if (this.tokens) {
      return this.tokens;
    }

    // Try to load from localStorage
    const stored = localStorage.getItem('spotify_tokens');
    if (stored) {
      this.tokens = JSON.parse(stored);
      return this.tokens;
    }

    return null;
  }

  // Check if user is logged in with Spotify
  isLoggedIn(): boolean {
    const tokens = this.getTokens();
    if (!tokens) {
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    const expiresAt = tokens.obtainedAt + (tokens.expiresIn * 1000);
    
    return now < expiresAt;
  }

  // Logout from Spotify
  logout(): void {
    this.tokens = null;
    localStorage.removeItem('spotify_tokens');
  }

  // Get recommendations from Spotify
  async getRecommendations(): Promise<SpotifyTrack[]> {
    const tokens = this.getTokens();
    if (!tokens) {
      throw new Error('Not logged in to Spotify');
    }

    try {
      const { data, error } = await supabase.functions.invoke('spotify-recommendations', {
        body: { accessToken: tokens.accessToken }
      });

      if (error) {
        throw error;
      }

      return data as SpotifyTrack[];
    } catch (error) {
      console.error('Error getting Spotify recommendations:', error);
      throw error;
    }
  }
}
