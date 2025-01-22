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
    const { data } = await octokit.repos.listForAuthenticatedUser({
      visibility: 'all',
      sort: 'updated',
      per_page: 10,
    });

    const repos = await Promise.all(
      data.map(async (repo) => {
        const { data: contents } = await octokit.repos
          .getContent({
            owner: repo.owner.login,
            repo: repo.name,
            path: '.github/workflows',
          })
          .catch(() => ({ data: null }));

        return {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          has_workflow: Boolean(contents),
          // has_workflow: true,
        };
      }),
    );

    return repos.filter((repo) => repo.has_workflow);
  } catch (error) {
    console.error('Error fetching repos:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch repositories',
    });
  }
});
