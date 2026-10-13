export default defineEventHandler(async (event) => {
  const octokit = useGithub(event);

  const ref = String(getQuery(event).ref || '').trim() || 'master';
  if (!/^[\w./-]{1,100}$/.test(ref)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid AndroidAPS version' });
  }

  try {
    const { data } = await octokit.repos.getContent({
      path: 'buildSrc/src/main/kotlin/Versions.kt',
      owner: 'nightscout',
      repo: 'AndroidAPS',
      ref,
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found',
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
    handleGithubError(event, error, 'Failed to fetch app version');
  }
});
