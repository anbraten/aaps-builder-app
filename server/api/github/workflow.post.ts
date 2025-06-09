import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event);
  const githubToken = cookies.github_token;
  const { repoFullName, keyStore, cloudStorage, flavor } = await readBody<{
    repoFullName: string;
    keyStore: {
      content: string;
      password: string;
      keyAlias: string;
      keyPassword: string;
    };
    cloudStorage: 'google-drive' | 'dropbox' | 'github-artifact';
    flavor: 'app' | 'wear';
  }>(event);

  if (!githubToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated',
    });
  }

  try {
    const octokit = new Octokit({ auth: githubToken });
    const [owner, repo] = repoFullName.split('/');

    const workflows = await octokit.actions.listRepoWorkflows({
      owner,
      repo,
    });

    const workflowExists = workflows.data.workflows.some((workflow) => workflow.path === '.github/workflows/build.yml');
    if (!workflowExists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Workflow not found or actions disabled',
      });
    }

    // Try to enable the workflow if it's not already enabled
    const enableWorkflow = await octokit.actions.enableWorkflow({
      owner,
      repo,
      workflow_id: 'build.yml',
    });
    if (enableWorkflow.status !== 204) {
      throw createError({
        statusCode: enableWorkflow.status,
        statusMessage: 'Failed to enable workflow',
      });
    }

    const response = await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: 'build.yml',
      ref: 'main',
      inputs: {
        repo: 'nightscout/AndroidAPS',
        ref: 'master',
        keyStoreContent: keyStore.content,
        keyStorePassword: keyStore.password,
        keyAlias: keyStore.keyAlias,
        keyPassword: keyStore.keyPassword,
        googleDriveAccessToken: cloudStorage === 'google-drive' ? cookies.google_token || '' : '',
        dropboxAccessToken: cloudStorage === 'dropbox' ? cookies.dropbox_token || '' : '',
        uploadAsArtifact: cloudStorage === 'github-artifact',
        flavor,
      },
    });
    if (response.status !== 204) {
      throw createError({
        statusCode: response.status,
        statusMessage: 'Failed to trigger workflow',
      });
    }

    // wait a bit to ensure the workflow is registered
    await new Promise((resolve) => setTimeout(resolve, 1000 * 5));

    const created = new Date(Date.now() - 1000 * 60 * 5).toISOString().slice(0, 19) + 'Z'; // last 5 minutes

    // Check if we have a running workflow
    const runs = await octokit.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: 'build.yml',
      created: `>${created}`,
    });
    const inProgressRuns = runs.data.workflow_runs.filter(
      (run) =>
        run.status === 'in_progress' ||
        run.status === 'queued' ||
        run.status === 'pending' ||
        run.status === 'waiting' ||
        run.status === 'requested',
    );
    if (inProgressRuns.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No queued or running workflow found',
      });
    }

    return { success: true, workflowRunId: inProgressRuns[0].id };
  } catch (error) {
    if (error instanceof RequestError) {
      console.error('Error from GitHub API:', error.name, error.message, {
        status: error.status,
        cause: error.cause,
        response: JSON.stringify(error.response?.data),
      });

      throw createError({
        statusCode: error.status,
        statusMessage: error.message,
      });
    }

    const isNuxtError = (error: any) => {
      return error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error;
    };

    if (isNuxtError(error)) {
      throw error;
    }

    console.error('Unexpected error:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to trigger workflow',
    });
  }
});
