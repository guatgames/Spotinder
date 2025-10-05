import { Song } from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";

// Deezer API Service using Edge Function to avoid CORS
export class DeezerService {
  private static instance: DeezerService;

  static getInstance(): DeezerService {
    if (!DeezerService.instance) {
      DeezerService.instance = new DeezerService();
    }
    return DeezerService.instance;
  }

  // Search for tracks using Edge Function
  async searchTracks(query: string, limit: number = 20): Promise<Song[]> {
    try {
      const { data, error } = await supabase.functions.invoke('deezer-search', {
        body: { query, limit }
      });

      if (error) {
        throw error;
      }

      return this.formatTracks(data.data || []);
    } catch (error) {
      console.error('Deezer search error:', error);
      throw error;
    }
  }

  // Search for a specific track by name and artist in Deezer
  async searchSpecificTrack(trackName: string, artistName: string): Promise<Song | null> {
    try {
      const query = `${trackName} ${artistName}`;
      console.log('Searching Deezer for:', query);
      
      const { data, error } = await supabase.functions.invoke('deezer-search', {
        body: { query, limit: 5 }
      });

      if (error) {
        throw error;
      }

      const tracks = this.formatTracks(data.data || []);
      
      // Return first result with preview
      const trackWithPreview = tracks.find(track => track.preview_url);
      
      if (trackWithPreview) {
        console.log('Found Deezer track:', trackWithPreview.name, 'by', trackWithPreview.artist);
        return trackWithPreview;
      }

      console.log('No Deezer track found with preview for:', query);
      return null;
    } catch (error) {
      console.error('Deezer specific search error:', error);
      return null;
    }
  }

  // Get random track with preview URL based on user's favorite artists
  async getRandomTrack(favoriteArtists?: Artist[]): Promise<Song> {
    let attempts = 0;
    const maxAttempts = 10;
    
    // If user has favorite artists, build genre-based search terms
    let searchTerms: string[];
    
    if (favoriteArtists && favoriteArtists.length > 0) {
      // Create search terms using artist names combined with genre keywords
      // This helps find similar artists and tracks in the same genre
      const genreKeywords = ['similar', 'like', 'style', 'type', 'music', 'sound'];
      searchTerms = [];
      
      favoriteArtists.forEach(artist => {
        // Add direct artist name searches
        searchTerms.push(artist.name);
        // Add genre-style searches
        const randomKeyword = genreKeywords[Math.floor(Math.random() * genreKeywords.length)];
        searchTerms.push(`${artist.name} ${randomKeyword}`);
      });
      
      console.log('Using genre-based search terms from favorite artists:', searchTerms.join(', '));
    } else {
      // Fallback to popular genre-based search terms
      searchTerms = [
        'pop music', 'rock music', 'indie music', 'electronic music', 'hip hop',
        'latin music', 'reggaeton', 'rap', 'r&b', 'soul', 'jazz', 'blues',
        'alternative', 'dance music', 'edm', 'house music', 'folk',
        'country', 'metal', 'punk', 'acoustic', 'chill music'
      ];
    }
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const searchQuery = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        console.log(`Searching for tracks with genre-based term: "${searchQuery}" (attempt ${attempts})`);
        
        const { data, error } = await supabase.functions.invoke('deezer-search', {
          body: { query: searchQuery, limit: 50 }
        });

        if (error) {
          console.log(`Search attempt ${attempts} failed:`, error);
          continue;
        }

        if (data.data && data.data.length > 0) {
          // Filter tracks with preview (Deezer usually always has previews)
          const tracksWithPreview = data.data.filter((track: any) => 
            track && track.preview
          );
          
          if (tracksWithPreview.length > 0) {
            const randomTrack = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
            const formattedTrack = this.formatTrack(randomTrack);
            console.log(`Found Deezer track with preview:`, formattedTrack.name, 'Preview:', formattedTrack.preview_url);
            return formattedTrack;
          } else {
            console.log(`No tracks with preview found in attempt ${attempts}, trying again...`);
            continue;
          }
        }
        
      } catch (error) {
        console.log(`Deezer attempt ${attempts} failed:`, error);
      }
    }
    
    // If no tracks with preview found after all attempts, throw error
    throw new Error('No se encontraron canciones con preview disponible en Deezer después de múltiples intentos.');
  }

  // Format track data to our Song interface
  private formatTracks(tracks: any[]): Song[] {
    return tracks
      .filter(track => track.preview)
      .map(this.formatTrack);
  }

  private formatTrack(track: any): Song {
    return {
      id: track.id.toString(),
      name: track.title,
      artist: track.artist?.name || 'Unknown Artist',
      album: track.album?.title || 'Unknown Album',
      image: track.album?.cover_xl || track.album?.cover_big || track.album?.cover_medium || '',
      preview_url: track.preview || null,
      external_url: track.link || `https://www.deezer.com/track/${track.id}`,
    };
  }

  // Get chart tracks (popular songs) using Edge Function
  async getChartTracks(limit: number = 20): Promise<Song[]> {
    try {
      const { data, error } = await supabase.functions.invoke('deezer-search', {
        body: { query: 'chart', limit }
      });
      
      if (error) {
        throw error;
      }

      return this.formatTracks(data.data || []);
    } catch (error) {
      console.error('Deezer chart error:', error);
      throw error;
    }
  }

  // Search for artists using Edge Function
  async searchArtists(query: string, limit: number = 10): Promise<Artist[]> {
    try {
      const { data, error } = await supabase.functions.invoke('deezer-artist-search', {
        body: { query, limit }
      });

      if (error) {
        throw error;
      }

      return this.formatArtists(data.data || []);
    } catch (error) {
      console.error('Deezer artist search error:', error);
      throw error;
    }
  }

  // Format artist data
  private formatArtists(artists: any[]): Artist[] {
    return artists.map(artist => ({
      id: artist.id.toString(),
      name: artist.name,
      picture: artist.picture_xl || artist.picture_big || artist.picture_medium || artist.picture,
      picture_medium: artist.picture_medium || artist.picture,
    }));
  }
}

export interface Artist {
  id: string;
  name: string;
  picture: string;
  picture_medium: string;
}
