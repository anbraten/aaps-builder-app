import { Octokit } from '@octokit/rest';

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event);
  const githubToken = cookies.github_token;
  const { repoFullName } = await readBody(event);

  if (!githubToken) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated',
    });
  }

  try {
    const octokit = new Octokit({ auth: githubToken });
    const [owner, repo] = repoFullName.split('/');

    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: 'build.yml',
      ref: 'main',
      inputs: {
        // TODO: pass credentials
        // google_credentials: cookies.google_token || '',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error triggering workflow:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to trigger workflow',
    });
  }
});
