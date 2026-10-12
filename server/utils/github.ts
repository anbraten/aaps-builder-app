import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import type { H3Event } from 'h3';

const COOKIE_NAME = 'github_token';

export function useGithub(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME);

  // older versions stored the literal string "undefined" if the oauth exchange failed
  if (!token || token === 'undefined') {
    if (token) {
      deleteCookie(event, COOKIE_NAME);
    }
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' });
  }

  return new Octokit({ auth: token });
}

/** Maps GitHub API errors to proper status codes and always throws. */
export function handleGithubError(event: H3Event, error: unknown, fallbackMessage: string): never {
  // already a h3 error (e.g. thrown by us)
  if (error && typeof error === 'object' && 'statusCode' in error && 'statusMessage' in error) {
    throw error;
  }

  if (error instanceof RequestError) {
    if (error.status === 401) {
      // token is invalid or revoked => drop it so the client asks the user to log in again
      deleteCookie(event, COOKIE_NAME);
      throw createError({ statusCode: 401, statusMessage: 'GitHub session expired' });
    }

    const remaining = error.response?.headers?.['x-ratelimit-remaining'];
    if (error.status === 429 || (error.status === 403 && remaining === '0')) {
      throw createError({ statusCode: 429, statusMessage: 'GitHub rate limit exceeded' });
    }

    if (error.status === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Repo or Workflow not found' });
    }

    console.error('Error from GitHub API:', error.name, error.message, { status: error.status });
    throw createError({ statusCode: error.status ?? 500, statusMessage: error.message });
  }

  console.error(fallbackMessage, error);
  throw createError({ statusCode: 500, statusMessage: fallbackMessage });
}
