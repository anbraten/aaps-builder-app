export default defineEventHandler(async (event) => {
  const { code } = getQuery(event);
  const config = useRuntimeConfig();

  try {
    const params = new URLSearchParams({
      code: code as string,
      grant_type: 'authorization_code',
      client_id: config.public.dropboxClientId,
      client_secret: config.dropboxClientSecret,
      redirect_uri: `${config.public.appUrl}/api/dropbox/callback`,
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
    >('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      body: params,
      ignoreResponseError: true,
    });

    if (tokenResponse.error) {
      console.log('Dropbox auth error:', tokenResponse.error);
      throw new Error('Failed to authenticate with Dropbox');
    }

    setCookie(event, 'dropbox_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1, // 1 hour
    });

    sendRedirect(event, '/build');
  } catch (error) {
    console.error('Dropbox auth error:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to authenticate with Dropbox',
    });
  }
});
