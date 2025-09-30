import { Song } from "@/pages/Index";

// Apple Music API Service
// Note: Requires a valid Apple Music Developer Token
export class AppleMusicService {
  private static instance: AppleMusicService;
  private developerToken: string = "YOUR_APPLE_MUSIC_DEVELOPER_TOKEN"; // Add your Apple Music Developer Token here
  private readonly baseUrl = "https://api.music.apple.com/v1";
  private readonly storefront = "us"; // Default storefront

  static getInstance(): AppleMusicService {
    if (!AppleMusicService.instance) {
      AppleMusicService.instance = new AppleMusicService();
    }
    return AppleMusicService.instance;
  }

  // Search for tracks
  async searchTracks(query: string, limit: number = 20): Promise<Song[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/catalog/${this.storefront}/search?term=${encodeURIComponent(query)}&types=songs&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.developerToken}`,
            'Music-User-Token': '', // Optional: for user-specific requests
          },
        }
      );

      if (!response.ok) {
        throw new Error('Apple Music search failed');
      }

      const data = await response.json();
      return this.formatTracks(data.results?.songs?.data || []);
    } catch (error) {
      console.error('Apple Music search error:', error);
      throw error;
    }
  }

  // Get random track with preview URL - ONLY tracks with real preview_url
  async getRandomTrack(): Promise<Song> {
    let attempts = 0;
    const maxAttempts = 10;
    
    // Popular search terms to get diverse results
    const searchTerms = [
      'love', 'night', 'day', 'heart', 'dream', 'time', 'life', 'dance', 
      'rock', 'pop', 'soul', 'blues', 'summer', 'winter', 'fire', 'water'
    ];
    
    // Popular genres for search
    const genres = ['pop', 'rock', 'hip-hop', 'electronic', 'indie', 'r&b', 'country'];
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Randomly choose between term search and genre search
        const searchType = Math.random() > 0.5 ? 'term' : 'genre';
        let searchQuery;
        
        if (searchType === 'term') {
          searchQuery = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        } else {
          searchQuery = genres[Math.floor(Math.random() * genres.length)];
        }
        
        // Random offset for variety (Apple Music API uses offset parameter)
        const randomOffset = Math.floor(Math.random() * 50);
        
        const searchResponse = await fetch(
          `${this.baseUrl}/catalog/${this.storefront}/search?term=${encodeURIComponent(searchQuery)}&types=songs&limit=50&offset=${randomOffset}`,
          {
            headers: {
              'Authorization': `Bearer ${this.developerToken}`,
            },
          }
        );

        if (!searchResponse.ok) {
          console.log(`Search attempt ${attempts} failed with status:`, searchResponse.status);
          continue;
        }

        const searchData = await searchResponse.json();
        
        if (searchData.results?.songs?.data && searchData.results.songs.data.length > 0) {
          // ONLY get tracks with real preview_url from Apple Music
          const tracksWithPreview = searchData.results.songs.data.filter((track: any) => 
            track && 
            track.attributes?.previews && 
            track.attributes.previews.length > 0 &&
            track.attributes.previews[0].url
          );
          
          if (tracksWithPreview.length > 0) {
            const randomTrack = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
            const formattedTrack = this.formatTrack(randomTrack);
            console.log(`Found Apple Music track with real preview:`, formattedTrack.name, 'Preview:', formattedTrack.preview_url);
            return formattedTrack;
          } else {
            console.log(`No tracks with preview found in attempt ${attempts}, trying again...`);
            continue;
          }
        }
        
      } catch (error) {
        console.log(`Apple Music attempt ${attempts} failed:`, error);
      }
    }
    
    // If no Apple Music tracks with preview found after all attempts, throw error
    throw new Error('No se encontraron canciones con preview disponible en Apple Music después de múltiples intentos.');
  }

  // Format track data to our Song interface
  private formatTracks(tracks: any[]): Song[] {
    return tracks
      .filter(track => track.attributes?.previews && track.attributes.previews.length > 0)
      .map(this.formatTrack);
  }

  private formatTrack(track: any): Song {
    const attributes = track.attributes;
    
    return {
      id: track.id,
      name: attributes.name,
      artist: attributes.artistName,
      album: attributes.albumName,
      image: attributes.artwork?.url?.replace('{w}', '500').replace('{h}', '500') || '',
      preview_url: attributes.previews?.[0]?.url || null,
      external_url: attributes.url || `https://music.apple.com/us/song/${track.id}`,
    };
  }

  // Mock data for development/demo purposes
  static getMockSongs(): Song[] {
    return [
      {
        id: "1",
        name: "Example Song 1",
        artist: "Example Artist",
        album: "Example Album",
        image: "https://via.placeholder.com/500",
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview/example.m4a",
        external_url: "https://music.apple.com/us/song/example1"
      },
      {
        id: "2",
        name: "Example Song 2",
        artist: "Example Artist 2",
        album: "Example Album 2",
        image: "https://via.placeholder.com/500",
        preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview/example2.m4a",
        external_url: "https://music.apple.com/us/song/example2"
      },
    ];
  }
}
