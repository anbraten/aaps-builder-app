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

    const workflows = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows', {
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

    await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
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

    return { success: true };
  } catch (error) {
    if (!(error instanceof Error)) {
      throw createError({
        statusCode: 500,
        statusMessage: 'An unexpected error occurred',
      });
    }

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

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to trigger workflow',
    });
  }
});
