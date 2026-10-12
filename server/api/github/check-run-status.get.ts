export default defineEventHandler(async (event) => {
  const octokit = useGithub(event);

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
    handleGithubError(event, error, 'Failed to fetch run status');
  }
});
