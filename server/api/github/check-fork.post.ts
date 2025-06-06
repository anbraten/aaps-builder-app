import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event);
  const token = cookies.github_token;

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    });
  }

  const { repoFullName } = await readBody<{
    repoFullName: string;
  }>(event);

  const octokit = new Octokit({ auth: token });
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
    if (error instanceof RequestError) {
      if (error?.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Repo or Workflow not found',
        });
      }
    }

    console.error('Error fetching repos:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch repositories',
    });
  }
});
