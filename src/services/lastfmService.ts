import { Song } from "@/pages/Index";

// Last.fm API Service
// Note: Last.fm API is free but requires an API key
// Get your API key at: https://www.last.fm/api/account/create
export class LastfmService {
  private static instance: LastfmService;
  private readonly baseUrl = "https://ws.audioscrobbler.com/2.0";
  // This is a demo API key - users should get their own from Last.fm
  private readonly apiKey = "d88cc33a66c464cc2ac1108685eaac34";

  static getInstance(): LastfmService {
    if (!LastfmService.instance) {
      LastfmService.instance = new LastfmService();
    }
    return LastfmService.instance;
  }

  // Search for tracks
  async searchTracks(query: string, limit: number = 20): Promise<Song[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}?method=track.search&track=${encodeURIComponent(query)}&api_key=${this.apiKey}&format=json&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Last.fm search failed');
      }

      const data = await response.json();
      const tracks = data.results?.trackmatches?.track || [];
      return this.formatTracks(Array.isArray(tracks) ? tracks : [tracks]);
    } catch (error) {
      console.error('Last.fm search error:', error);
      throw error;
    }
  }

  // Get random track - Last.fm doesn't have preview URLs directly, so we'll get popular tracks
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
        const page = Math.floor(Math.random() * 5) + 1;
        
        const searchResponse = await fetch(
          `${this.baseUrl}?method=track.search&track=${encodeURIComponent(searchQuery)}&api_key=${this.apiKey}&format=json&limit=50&page=${page}`
        );

        if (!searchResponse.ok) {
          console.log(`Search attempt ${attempts} failed with status:`, searchResponse.status);
          continue;
        }

        const searchData = await searchResponse.json();
        const tracks = searchData.results?.trackmatches?.track || [];
        const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
        
        if (tracksArray.length > 0) {
          // Get track info for additional details
          const randomTrack = tracksArray[Math.floor(Math.random() * tracksArray.length)];
          
          try {
            const trackInfoResponse = await fetch(
              `${this.baseUrl}?method=track.getInfo&api_key=${this.apiKey}&artist=${encodeURIComponent(randomTrack.artist)}&track=${encodeURIComponent(randomTrack.name)}&format=json`
            );
            
            if (trackInfoResponse.ok) {
              const trackInfo = await trackInfoResponse.json();
              const formattedTrack = this.formatTrackWithInfo(trackInfo.track);
              console.log(`Found Last.fm track:`, formattedTrack.name);
              return formattedTrack;
            }
          } catch (error) {
            console.log(`Failed to get track info, using basic data`);
          }
          
          // Fallback to basic track data
          const formattedTrack = this.formatTrack(randomTrack);
          console.log(`Found Last.fm track (basic):`, formattedTrack.name);
          return formattedTrack;
        }
        
      } catch (error) {
        console.log(`Last.fm attempt ${attempts} failed:`, error);
      }
    }
    
    // If no tracks found after all attempts, throw error
    throw new Error('No se encontraron canciones en Last.fm después de múltiples intentos.');
  }

  // Format track data to our Song interface
  private formatTracks(tracks: any[]): Song[] {
    return tracks.map(this.formatTrack);
  }

  private formatTrack(track: any): Song {
    return {
      id: `${track.artist}-${track.name}`.replace(/\s+/g, '-'),
      name: track.name,
      artist: track.artist || 'Unknown Artist',
      album: 'Unknown Album',
      image: track.image?.[3]?.['#text'] || track.image?.[2]?.['#text'] || '/placeholder.svg',
      preview_url: null, // Last.fm doesn't provide preview URLs
      external_url: track.url || `https://www.last.fm/music/${encodeURIComponent(track.artist)}/_/${encodeURIComponent(track.name)}`,
    };
  }

  private formatTrackWithInfo(track: any): Song {
    return {
      id: track.mbid || `${track.artist?.name}-${track.name}`.replace(/\s+/g, '-'),
      name: track.name,
      artist: track.artist?.name || 'Unknown Artist',
      album: track.album?.title || 'Unknown Album',
      image: track.album?.image?.[3]?.['#text'] || track.album?.image?.[2]?.['#text'] || '/placeholder.svg',
      preview_url: null, // Last.fm doesn't provide preview URLs
      external_url: track.url || `https://www.last.fm/music/${encodeURIComponent(track.artist?.name)}/_/${encodeURIComponent(track.name)}`,
    };
  }

  // Get chart tracks (popular songs)
  async getChartTracks(limit: number = 20): Promise<Song[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}?method=chart.gettoptracks&api_key=${this.apiKey}&format=json&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Last.fm charts');
      }

      const data = await response.json();
      const tracks = data.tracks?.track || [];
      return this.formatTracks(tracks);
    } catch (error) {
      console.error('Last.fm chart error:', error);
      throw error;
    }
  }
}
