export default defineEventHandler(async (event) => {
  const octokit = useGithub(event);

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
    handleGithubError(event, error, 'Failed to fetch repositories');
  }
});
