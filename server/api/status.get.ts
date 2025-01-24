export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event);

  // we only return if the token is present (NOT the actual value!)
  return {
    githubToken: !!cookies.github_token,
    googleToken: !!cookies.google_token,
  };
});
