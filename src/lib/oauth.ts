/**
 * Google OAuth 2.0 Authorization Code flow.
 *
 * Required env vars (create at https://console.cloud.google.com):
 *   GOOGLE_CLIENT_ID     — OAuth 2.0 Client ID (Web application type)
 *   GOOGLE_CLIENT_SECRET — the paired client secret
 *   GOOGLE_REDIRECT_URI  — e.g. http://localhost:3001/api/auth/google/callback
 *                           (authorize this exact URI in the Google console)
 *
 * When not configured, the routes return 501 Not Implemented so the UI
 * can hide or fall back to password auth. Demo SSO remains available.
 */
import { randomBytes } from 'node:crypto';

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export interface OAuthExchangeResult {
  accessToken: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface OAuthUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getGoogleConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || 'http://localhost:3001/api/auth/google/callback';
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

/** Build the Google consent-screen URL. */
export function buildConsentUrl(state: string): string {
  const config = getGoogleConfig();
  if (!config) throw new Error('Google OAuth is not configured');
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchange the authorization code for an access token. */
export async function exchangeCodeForToken(code: string): Promise<OAuthExchangeResult> {
  const config = getGoogleConfig();
  if (!config) throw new Error('Google OAuth is not configured');

  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token?: string; id_token?: string; expires_in?: number; token_type?: string };
  if (!data.access_token) throw new Error('Google token response missing access_token');

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    expiresIn: data.expires_in ?? 3600,
    tokenType: data.token_type ?? 'Bearer',
  };
}

/** Fetch the verified user profile from Google. */
export async function fetchGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Google userinfo request failed (${res.status})`);
  }

  const data = (await res.json()) as { sub?: string; email?: string; name?: string; picture?: string; email_verified?: boolean };
  if (!data.sub || !data.email) {
    throw new Error('Google userinfo response missing required fields');
  }

  return {
    sub: data.sub,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    picture: data.picture,
    emailVerified: data.email_verified ?? false,
  };
}

/** Generate a secure random state token for CSRF protection. */
export function generateOAuthState(): string {
  return randomBytes(24).toString('hex');
}
