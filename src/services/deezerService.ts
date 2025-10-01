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

  // Get random track with preview URL - Deezer always provides previews
  async getRandomTrack(): Promise<Song> {
    let attempts = 0;
    const maxAttempts = 10;
    
    // Popular search terms to get diverse results
    const searchTerms = [
      'love', 'night', 'day', 'heart', 'dream', 'time', 'life', 'dance', 
      'rock', 'pop', 'soul', 'blues', 'summer', 'winter', 'fire', 'water',
      'happy', 'sad', 'stars', 'moon', 'sun', 'rain', 'freedom', 'hope'
    ];
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const searchQuery = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        console.log(`Searching for tracks with term: "${searchQuery}" (attempt ${attempts})`);
        
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
}
