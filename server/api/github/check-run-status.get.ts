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

  const { repoFullName, runId } = getQuery<{
    repoFullName: string;
    runId: string;
  }>(event);

  const [owner, repo] = repoFullName.split('/');

  try {
    const { data } = await octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id: parseInt(runId, 10),
    });

    let status = 'in_progress';
    if (data.conclusion === 'success') {
      status = 'success';
    } else if (data.conclusion === 'failure' || data.conclusion === 'cancelled') {
      status = 'failed';
    }

    return {
      status,
      run: {
        id: data.id,
        run_number: data.run_number,
        conclusion: data.conclusion,
        status: data.status,
      },
    };
  } catch (error) {
    console.error('Error fetching repos:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch repositories',
    });
  }
});
