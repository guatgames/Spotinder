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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Decode app origin from state
    let appOrigin = url.origin;
    if (state) {
      try {
        const stateData = JSON.parse(atob(state));
        appOrigin = stateData.origin || url.origin;
      } catch (e) {
        console.error('Could not decode state:', e);
      }
    }

    if (error) {
      console.error('Spotify auth error:', error);
      // Redirect back to app with error
      return Response.redirect(`${appOrigin}/?spotify_error=${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/spotify-callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    console.log('Successfully obtained Spotify access token');

    // Redirect back to app with access token
    const redirectUrl = new URL(appOrigin);
    redirectUrl.searchParams.set('spotify_token', tokenData.access_token);
    redirectUrl.searchParams.set('spotify_refresh', tokenData.refresh_token);
    redirectUrl.searchParams.set('spotify_expires', tokenData.expires_in);

    return Response.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error in spotify-callback:', error);
    // Get app origin from state if available
    let appOrigin;
    try {
      const url = new URL(req.url);
      const state = url.searchParams.get('state');
      if (state) {
        const stateData = JSON.parse(atob(state));
        appOrigin = stateData.origin;
      }
    } catch (e) {
      // Fallback to request origin
      appOrigin = new URL(req.url).origin;
    }
    return Response.redirect(`${appOrigin}/?spotify_error=callback_failed`);
  }
});
