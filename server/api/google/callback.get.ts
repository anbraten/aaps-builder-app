import type { OAuthTokenResponse } from '~/server/types';

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event);
  const config = useRuntimeConfig();

  try {
    const tokenResponse = await $fetch<OAuthTokenResponse>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: JSON.stringify({
        client_id: config.public.googleClientId,
        client_secret: config.googleClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${config.public.appUrl}/api/google/callback`,
      }),
      ignoreResponseError: true,
    });

    if (tokenResponse.error) {
      console.log('Google auth error:', tokenResponse);
      throw new Error(tokenResponse.error);
    }

    setCookie(event, 'google_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: tokenResponse.expires_in,
    });

    sendRedirect(event, '/build');
  } catch (error) {
    console.error('Google auth error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to authenticate with Google',
    });
  }
});
