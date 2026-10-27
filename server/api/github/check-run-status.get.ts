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

    // find the step that failed, so the user (and Sentry) gets a hint what went wrong
    let failedStep: string | undefined;
    if (status === 'failed') {
      const { data: jobs } = await octokit.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: data.id,
      });
      const failedJob = jobs.jobs.find((job) => job.conclusion === 'failure');
      const step = failedJob?.steps?.find((step) => step.conclusion === 'failure');
      if (failedJob) {
        failedStep = step ? `${failedJob.name} / ${step.name}` : failedJob.name;
      }
    }

    return {
      status,
      logsUrl: data.html_url,
      failedStep,
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
