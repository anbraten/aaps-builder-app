import { Octokit } from '@octokit/rest';

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
    console.error('Error triggering workflow:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to trigger workflow',
    });
  }
});
