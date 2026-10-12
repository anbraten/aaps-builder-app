export default defineEventHandler(async (event) => {
  const octokit = useGithub(event);

  const { repoFullName } = await readBody<{
    repoFullName: string;
  }>(event);

  const [owner, repo] = repoFullName.split('/');

  try {
    const { data } = await octokit.repos.getContent({
      path: '/.github/workflows/build.yml',
      owner: 'anbraten',
      repo: 'aaps-builder',
      ref: 'main',
    });

    if (Array.isArray(data) || data.type !== 'file') {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found on original repo',
      });
    }

    const { data: dataFork } = await octokit.repos.getContent({
      path: '/.github/workflows/build.yml',
      owner,
      repo,
      ref: 'main',
    });

    if (Array.isArray(dataFork) || dataFork.type !== 'file') {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found on forked repo',
      });
    }

    return { isUpToDate: data.sha === dataFork.sha };
  } catch (error) {
    handleGithubError(event, error, 'Failed to check fork');
  }
});
