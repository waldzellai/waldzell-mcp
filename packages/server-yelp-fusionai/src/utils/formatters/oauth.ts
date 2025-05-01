/**
 * OAuth-related formatters
 */

/**
 * Format the OAuth token response
 */
export function formatOAuthTokenResponse(response: any, version: string): string {
  if (!response) {
    return 'Failed to get OAuth token.';
  }

  const { access_token, token_type, expires_in, refresh_token, scope } = response;
  
  let result = `### OAuth ${version} Access Token
**Access Token:** ${access_token}
**Token Type:** ${token_type || 'bearer'}
**Expires In:** ${expires_in || 'Not specified'} seconds`;

  if (refresh_token) {
    result += `\n**Refresh Token:** ${refresh_token}`;
  }
  
  if (scope) {
    result += `\n**Scope:** ${scope}`;
  }

  return result;
}
