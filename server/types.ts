export type OAuthTokenResponse =
  | {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }
  | {
      error: string;
      error_description: string;
    };
