import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trackId, trackName, limit = 10 } = await req.json();

    let finalTrackId = trackId;

    // Si no hay trackId, buscar por trackName
    if (!finalTrackId) {
      if (!trackName) {
        return new Response(
          JSON.stringify({ error: 'trackId or trackName parameter is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log(`🔍 Searching track ID for name: "${trackName}"`);
      const searchRes = await fetch(`https://api.deezer.com/search/track?q=${encodeURIComponent(trackName)}&limit=1`);
      const searchData = await searchRes.json();
      if (!searchData.data || searchData.data.length === 0) {
        return new Response(
          JSON.stringify({ error: `No track found with name "${trackName}"` }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      finalTrackId = searchData.data[0].id;
      console.log(`✅ Found track ID: ${finalTrackId}`);
    }

    console.log(`🎵 Getting recommendations for track ID: ${finalTrackId}`);
    const radioRes = await fetch(`https://api.deezer.com/track/${finalTrackId}/radio`);
    if (!radioRes.ok) {
      throw new Error(`Deezer API error getting related tracks: ${radioRes.status}`);
    }

    const radioData = await radioRes.json();
    const recommendedTracks = (radioData.data || []).slice(0, limit);

    return new Response(
      JSON.stringify({
        baseTrackId: finalTrackId,
        total: recommendedTracks.length,
        recommendations: recommendedTracks.map((t: any) => ({
          id: t.id,
          title: t.title,
          artist: t.artist?.name,
          album: t.album?.title,
          cover: t.album?.cover_medium,
          preview: t.preview,
          link: t.link,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in deezer-track-recommendations function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});