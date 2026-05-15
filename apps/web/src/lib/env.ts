interface EnvVars {
  BELONG_BACKEND_URL: string;
  BELONG_GOOGLE_CLIENT_ID?: string;
  BELONG_GITHUB_CLIENT_ID?: string;
}

declare global {
  interface Window {
    __ENV__?: Partial<EnvVars>;
  }
}

export const env: EnvVars = {
  BELONG_BACKEND_URL: window.__ENV__?.BELONG_BACKEND_URL ?? 'http://localhost:5090',
  BELONG_GOOGLE_CLIENT_ID: window.__ENV__?.BELONG_GOOGLE_CLIENT_ID ?? '',
  BELONG_GITHUB_CLIENT_ID: window.__ENV__?.BELONG_GITHUB_CLIENT_ID ?? '',
};
