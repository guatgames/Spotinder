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

    // Get user's top tracks for seed
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=medium_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!topTracksResponse.ok) {
      const errorData = await topTracksResponse.text();
      console.error('Top tracks error:', errorData);
      throw new Error('Failed to get top tracks from Spotify');
    }

    const topTracksData = await topTracksResponse.json();
    console.log('Got top tracks:', topTracksData.items?.length || 0);

    // Extract seed track IDs (up to 5)
    const seedTracks = topTracksData.items
      ?.slice(0, 5)
      .map((track: any) => track.id)
      .join(',');

    if (!seedTracks) {
      // If no top tracks, get recommendations based on popular genres
      const recommendationsResponse = await fetch(
        'https://api.spotify.com/v1/recommendations?seed_genres=pop,rock,hip-hop&limit=50',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!recommendationsResponse.ok) {
        throw new Error('Failed to get genre-based recommendations');
      }

      const recommendationsData = await recommendationsResponse.json();
      console.log('Got genre-based recommendations:', recommendationsData.tracks?.length || 0);
      
      return new Response(
        JSON.stringify(recommendationsData.tracks || []),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get recommendations based on top tracks
    console.log('Requesting recommendations with seed tracks:', seedTracks);
    const recommendationsResponse = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTracks}&limit=50`,
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
      
      // Fallback: Try with genres instead
      console.log('Falling back to genre-based recommendations');
      const genreResponse = await fetch(
        'https://api.spotify.com/v1/recommendations?seed_genres=pop,rock,electronic&limit=50',
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
