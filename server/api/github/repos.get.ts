import { Octokit } from '@octokit/rest';

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event);
  const token = cookies.github_token;

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    });
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
      type: 'owner',
    });

    const repos = await Promise.all(
      data.map(async (repo) => {
        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          fork: repo.fork,
          // has_workflow: true,
        };
      }),
    );

    return repos;
  } catch (error) {
    console.error('Error fetching repos:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch repositories',
    });
  }
});
