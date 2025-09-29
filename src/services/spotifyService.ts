import { Song } from "@/pages/Index";

// Spotify Web API Service
// Note: This requires proper authentication setup with Spotify
export class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private clientId: string = "ca37377773084203a2764b7c55c52514"; // Add your Spotify Client ID here
  private clientSecret: string = "b3559bceab1f4ad39b9d1671664e2c63"; // Add your Spotify Client Secret here

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  // Get access token using Client Credentials flow
  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
    } catch (error) {
      console.error('Spotify authentication error:', error);
      throw error;
    }
  }

  // Search for tracks
  async searchTracks(query: string, limit: number = 20): Promise<Song[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return this.formatTracks(data.tracks.items);
    } catch (error) {
      console.error('Spotify search error:', error);
      throw error;
    }
  }

  // Get recommendations based on seed tracks
  async getRecommendations(seedTracks: string[] = [], limit: number = 20): Promise<Song[]> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const seedQuery = seedTracks.length > 0 
        ? `seed_tracks=${seedTracks.join(',')}` 
        : 'seed_genres=pop,rock,hip-hop';
      
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${seedQuery}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Recommendations failed');
      }

      const data = await response.json();
      return this.formatTracks(data.tracks);
    } catch (error) {
      console.error('Spotify recommendations error:', error);
      throw error;
    }
  }

  // Get random track with preview URL using search
  async getRandomTrack(): Promise<Song> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    let attempts = 0;
    const maxAttempts = 10;
    
    // Popular search terms to get diverse results
    const searchTerms = [
      'year:2023', 'year:2022', 'year:2021', 'year:2020',
      'genre:pop', 'genre:rock', 'genre:hip-hop', 'genre:electronic',
      'a', 'the', 'love', 'music', 'song', 'dance', 'life', 'night'
    ];
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        // Use search with random terms to get diverse results
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        const randomOffset = Math.floor(Math.random() * 500); // Spotify allows up to 1000
        
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(randomTerm)}&type=track&limit=50&offset=${randomOffset}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        );

        if (!searchResponse.ok) {
          console.log(`Search attempt ${attempts} failed with status:`, searchResponse.status);
          continue;
        }

        const searchData = await searchResponse.json();
        
        if (searchData.tracks && searchData.tracks.items.length > 0) {
          // Filter tracks that have preview_url available
          const tracksWithPreview = searchData.tracks.items.filter((track: any) => 
            track && track.preview_url !== null
          );
          
          if (tracksWithPreview.length > 0) {
            const randomTrack = tracksWithPreview[Math.floor(Math.random() * tracksWithPreview.length)];
            const formattedTrack = this.formatTrack(randomTrack);
            console.log(`Found track with preview on attempt ${attempts}:`, formattedTrack.name);
            return formattedTrack;
          } else {
            console.log(`Attempt ${attempts}: No tracks with preview found for "${randomTerm}", trying another...`);
          }
        } else {
          console.log(`Attempt ${attempts}: No tracks found for "${randomTerm}", trying another...`);
        }
        
      } catch (error) {
        console.log(`Attempt ${attempts} failed:`, error);
      }
    }
    
    throw new Error('No tracks with preview found after multiple attempts');
  }

  // Format track data to our Song interface
  private formatTracks(tracks: any[]): Song[] {
    return tracks.map(this.formatTrack);
  }

  private formatTrack(track: any): Song {
    return {
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist: any) => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images[0]?.url || '',
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify,
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