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

    // Try to get user's top tracks for seed (limit to 2 for better results)
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=2&time_range=short_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    let seedTracks = '';
    if (topTracksResponse.ok) {
      const topTracksData = await topTracksResponse.json();
      if (topTracksData.items && topTracksData.items.length > 0) {
        seedTracks = topTracksData.items
          .slice(0, 2)
          .map((track: any) => track.id)
          .join(',');
        console.log('Got top tracks:', topTracksData.items.length);
      }
    } else {
      console.log('Failed to get top tracks:', topTracksResponse.status);
    }

    // Build recommendation URL - use ONLY tracks as seeds, max 2
    let recommendationUrl = 'https://api.spotify.com/v1/recommendations?limit=50';
    
    if (seedTracks) {
      recommendationUrl += `&seed_tracks=${seedTracks}`;
      console.log('Using track seeds:', seedTracks);
    } else {
      // If no tracks available, use genres
      console.log('No user data available, using genre seeds');
      recommendationUrl += '&seed_genres=pop,rock';
    }

    console.log('Requesting recommendations from:', recommendationUrl);
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
      console.error('Recommendations error body:', errorData);
      
      // Final fallback: Try with just 2 simple genres
      console.log('Falling back to genre-based recommendations');
      const genreResponse = await fetch(
        'https://api.spotify.com/v1/recommendations?seed_genres=pop,rock&limit=50',
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
      } else {
        const fallbackError = await genreResponse.text();
        console.error('Fallback also failed:', genreResponse.status, fallbackError);
      }
      
      throw new Error(`Spotify API error: ${recommendationsResponse.status} - ${errorData}`);
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
