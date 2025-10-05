import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistNames } = await req.json();
    
    if (!artistNames || !Array.isArray(artistNames) || artistNames.length === 0) {
      throw new Error('Artist names are required');
    }

    console.log('Getting recommendations for artists:', artistNames);

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    // Get access token using Client Credentials Flow
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Got Spotify access token');

    // Search for artist IDs
    const artistIds: string[] = [];
    
    for (const artistName of artistNames.slice(0, 5)) { // Use up to 5 artists as seeds
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.artists?.items?.[0]?.id) {
          artistIds.push(searchData.artists.items[0].id);
          console.log(`Found artist ID for ${artistName}:`, searchData.artists.items[0].id);
        }
      }
    }

    if (artistIds.length === 0) {
      throw new Error('No artist IDs found');
    }

    console.log('Using artist IDs as seeds:', artistIds);

    // Get recommendations based on artist seeds
    const recommendationsUrl = `https://api.spotify.com/v1/recommendations?seed_artists=${artistIds.join(',')}&limit=50`;
    
    const recommendationsResponse = await fetch(recommendationsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!recommendationsResponse.ok) {
      throw new Error('Failed to get recommendations from Spotify');
    }

    const recommendationsData = await recommendationsResponse.json();
    console.log(`Got ${recommendationsData.tracks?.length || 0} recommendations from Spotify`);

    return new Response(
      JSON.stringify({ tracks: recommendationsData.tracks || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in spotify-recommendations-no-auth:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
