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
    const { artistId, limit = 5 } = await req.json();
    
    if (!artistId) {
      return new Response(
        JSON.stringify({ error: 'artistId parameter is required' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Getting related artists and tracks for artist ID: ${artistId}`);

    // Get related artists
    const relatedUrl = `https://api.deezer.com/artist/${artistId}/related`;
    const relatedResponse = await fetch(relatedUrl);

    if (!relatedResponse.ok) {
      throw new Error(`Deezer API error getting related artists: ${relatedResponse.status}`);
    }

    const relatedData = await relatedResponse.json();
    const relatedArtists = relatedData.data || [];
    
    console.log(`Found ${relatedArtists.length} related artists`);

    // Get top tracks for each related artist (limit to first 3 artists)
    const limitedArtists = relatedArtists.slice(0, 3);
    const allTracks = [];

    for (const artist of limitedArtists) {
      console.log(`Getting top tracks for artist: ${artist.name}`);
      const tracksUrl = `https://api.deezer.com/artist/${artist.id}/top?limit=${limit}`;
      const tracksResponse = await fetch(tracksUrl);

      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        const tracks = tracksData.data || [];
        console.log(`Found ${tracks.length} tracks for ${artist.name}`);
        allTracks.push(...tracks);
      }
    }

    console.log(`Total tracks found: ${allTracks.length}`);

    return new Response(
      JSON.stringify({ 
        relatedArtists: relatedData.data || [],
        tracks: allTracks 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in deezer-related-tracks function:', error);
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
