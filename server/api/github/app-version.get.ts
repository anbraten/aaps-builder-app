import { Octokit } from '@octokit/rest';

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event);
  const token = cookies.github_token;

  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.repos.getContent({
      path: 'buildSrc/src/main/kotlin/Versions.kt',
      owner: 'nightscout',
      repo: 'AndroidAPS',
      ref: 'master',
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw createError({
        statusCode: 404,
        message: 'File not found',
      });
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const version = content
      .split('\n')
      .filter((line) => line.includes('appVersion'))
      .map((line) => line.split('=')?.[1])
      .join('')
      .replace(/['"]+/g, '')
      .trim();

    return { version };
  } catch (error) {
    console.error('Error fetching repos:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch repositories',
    });
  }
});
