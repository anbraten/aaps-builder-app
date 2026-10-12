import type { OAuthTokenResponse } from '~/server/types';

export default defineEventHandler(async (event) => {
  const { code } = getQuery(event);

  if (!code) {
    return sendRedirect(event, '/build?auth_error=github');
  }
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

    // GitHub answers with 200 and an error payload if the code is invalid, expired or already used
    if (!('access_token' in tokenResponse) || !tokenResponse.access_token) {
      // expected user flow issue (reload / back button), so no need to report it as error
      return sendRedirect(event, '/build?auth_error=github');
    }

    // Set cookie with the token
    setCookie(event, 'github_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      ...(tokenResponse.expires_in ? { maxAge: tokenResponse.expires_in } : {}),
    });

    return sendRedirect(event, '/build');
  } catch (error) {
    console.error('GitHub auth error:', error);
    return sendRedirect(event, '/build?auth_error=github');
  }
});
