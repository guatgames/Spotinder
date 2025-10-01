import { Song } from "@/pages/Index";
// @ts-ignore
import spotifyPreviewFinder from "spotify-preview-finder";

// Spotify Preview Finder Service
export class SpotifyService {
  private static instance: SpotifyService;
  private clientId: string = "ca37377773084203a2764b7c55c52514";
  private clientSecret: string = "b3559bceab1f4ad39b9d1671664e2c63";

  constructor() {
    // Set environment variables for spotify-preview-finder
    if (typeof process !== 'undefined' && process.env) {
      process.env.SPOTIFY_CLIENT_ID = this.clientId;
      process.env.SPOTIFY_CLIENT_SECRET = this.clientSecret;
    }
  }

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  // Search for tracks using spotify-preview-finder
  async searchTracks(query: string, limit: number = 5): Promise<Song[]> {
    try {
      const result = await spotifyPreviewFinder(query, limit);
      
      if (result.success && result.results.length > 0) {
        return result.results.map((track: any) => this.formatTrack(track));
      }
      
      return [];
    } catch (error) {
      console.error('Spotify search error:', error);
      throw error;
    }
  }

  // Get random track with preview URL using spotify-preview-finder
  async getRandomTrack(): Promise<Song> {
    let attempts = 0;
    const maxAttempts = 10;
    
    // Popular search terms to get diverse results
    const searchTerms = [
      'love', 'night', 'dream', 'heart', 'summer', 'dance', 'time', 'life',
      'baby', 'girl', 'one', 'way', 'day', 'feel', 'world', 'home',
      'rock', 'pop', 'hip hop', 'electronic', 'jazz', 'blues', 'country'
    ];
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Use random search term
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        console.log(`Searching for tracks with term: "${randomTerm}" (attempt ${attempts})`);
        
        const result = await spotifyPreviewFinder(randomTerm, 20);
        
        if (result.success && result.results.length > 0) {
          // Filter tracks that have preview URLs
          const tracksWithPreview = result.results.filter((track: any) => 
            track.previewUrls && track.previewUrls.length > 0
          );
          
          if (tracksWithPreview.length > 0) {
            const randomTrack = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
            const formattedTrack = this.formatTrack(randomTrack);
            console.log(`Found track with preview:`, formattedTrack.name, 'by', formattedTrack.artist);
            console.log(`Preview URL:`, formattedTrack.preview_url);
            return formattedTrack;
          } else {
            console.log(`No tracks with preview found in attempt ${attempts}, trying again...`);
          }
        }
        
      } catch (error) {
        console.log(`Search attempt ${attempts} failed:`, error);
      }
    }
    
    // If no tracks found after all attempts, throw error
    throw new Error('No se encontraron canciones con preview disponible después de múltiples intentos.');
  }

  // Format track data from spotify-preview-finder to our Song interface
  private formatTrack(track: any): Song {
    return {
      id: track.trackId || track.id || Math.random().toString(),
      name: track.name,
      artist: Array.isArray(track.artists) 
        ? track.artists.join(', ') 
        : (track.artist || 'Unknown Artist'),
      album: track.albumName || track.album || 'Unknown Album',
      image: track.imageUrl || track.image || '',
      preview_url: track.previewUrls && track.previewUrls.length > 0 
        ? track.previewUrls[0] 
        : null,
      external_url: track.spotifyUrl || track.external_url || '',
    };
  }

  // Mock data for development/demo purposes
  static getMockSongs(): Song[] {
    return [
      {
        id: "1",
        name: "Two Moons",
        artist: "BoyWithUke",
        album: "Serotonin Dreams",
        image: "https://i.scdn.co/image/ab67616d0000b273c3af0c2355c24ed7023cd394",
        preview_url: "https://p.scdn.co/mp3-preview/demo",
        external_url: "https://open.spotify.com/track/demo1"
      },
      {
        id: "2",
        name: "Two Moons",
        artist: "BoyWithUke",
        album: "Serotonin Dreams",
        image: "https://i.scdn.co/image/ab67616d0000b273adba9b8b6a477c693c3e2bef",
        preview_url: null,
        external_url: "https://open.spotify.com/track/demo2"
      },
      {
        id: "3",
        name: "Two Moons",
        artist: "BoyWithUke",
        album: "Serotonin Dreams",
        image: "https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a",
        preview_url: "https://p.scdn.co/mp3-preview/demo2",
        external_url: "https://open.spotify.com/track/demo3"
      }
    ];
  }
}