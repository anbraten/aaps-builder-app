import { Octokit } from '@octokit/rest';

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event);
  const githubToken = cookies.github_token;
  const { repoFullName, keyStore } = await readBody<{
    repoFullName: string;
    keyStore: {
      content: string;
      password: string;
      keyAlias: string;
      keyPassword: string;
    };
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

        // TODO: pass google cloud credentials
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
