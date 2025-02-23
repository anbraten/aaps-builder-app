import type { OAuthTokenResponse } from '~/server/types';

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event);
  const config = useRuntimeConfig();

  try {
    const tokenResponse = await $fetch<OAuthTokenResponse>('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: config.public.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      }),
    });

    // Set cookie with the token
    setCookie(event, 'github_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: tokenResponse.expires_in,
    });

    sendRedirect(event, '/build');
  } catch (error) {
    console.error('GitHub auth error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to authenticate with GitHub',
    });
  }
});
