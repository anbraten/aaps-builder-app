export default defineEventHandler(async (event) => {
  const { code } = getQuery(event);
  const config = useRuntimeConfig();

  try {
    console.log({
      redirect_uri: `${config.public.baseUrl}/api/google/callback`,
    });

    const tokenResponse = await $fetch<
      | {
          error: string;
          error_description: string;
        }
      | {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        }
    >('https://oauth2.googleapis.com/token', {
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

    console.log('tt', tokenResponse);

    setCookie(event, 'google_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    sendRedirect(event, '/');
  } catch (error) {
    console.error('Google auth error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to authenticate with Google',
    });
  }
});
