import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    // Try to get user's top artists first for better seeds
    const topArtistsResponse = await fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=2&time_range=medium_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let seedArtists = '';
    if (topArtistsResponse.ok) {
      const topArtistsData = await topArtistsResponse.json();
      seedArtists = topArtistsData.items
        ?.slice(0, 2)
        .map((artist: any) => artist.id)
        .join(',');
      console.log('Got top artists:', topArtistsData.items?.length || 0);
    }

    // Get user's top tracks for seed
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=3&time_range=medium_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let seedTracks = '';
    if (topTracksResponse.ok) {
      const topTracksData = await topTracksResponse.json();
      seedTracks = topTracksData.items
        ?.slice(0, 3)
        .map((track: any) => track.id)
        .join(',');
      console.log('Got top tracks:', topTracksData.items?.length || 0);
    }

    // Build recommendation URL with available seeds
    let recommendationUrl = 'https://api.spotify.com/v1/recommendations?limit=50';
    
    if (seedArtists) {
      recommendationUrl += `&seed_artists=${seedArtists}`;
    }
    if (seedTracks) {
      recommendationUrl += `&seed_tracks=${seedTracks}`;
    }
    
    // If no seeds available, use genres
    if (!seedArtists && !seedTracks) {
      console.log('No user data available, using genre seeds');
      recommendationUrl += '&seed_genres=pop,rock,electronic';
    }

    console.log('Requesting recommendations with URL:', recommendationUrl);
    const recommendationsResponse = await fetch(
      recommendationUrl,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!recommendationsResponse.ok) {
      const errorData = await recommendationsResponse.text();
      console.error('Recommendations error status:', recommendationsResponse.status);
      console.error('Recommendations error:', errorData);
      
      // Final fallback: Try with just genres
      console.log('Falling back to pure genre-based recommendations');
      const genreResponse = await fetch(
        'https://api.spotify.com/v1/recommendations?seed_genres=pop,rock,indie,electronic,hip-hop&limit=50',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (genreResponse.ok) {
        const genreData = await genreResponse.json();
        console.log('Got fallback recommendations:', genreData.tracks?.length || 0);
        return new Response(
          JSON.stringify(genreData.tracks || []),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error('Failed to get recommendations from Spotify');
    }

    const recommendationsData = await recommendationsResponse.json();
    console.log('Got personalized recommendations:', recommendationsData.tracks?.length || 0);

    return new Response(
      JSON.stringify(recommendationsData.tracks || []),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in spotify-recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
