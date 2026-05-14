interface EnvVars {
  BELONG_BACKEND_URL: string;
}

declare global {
  interface Window {
    __ENV__?: Partial<EnvVars>;
  }
}

export const env: EnvVars = {
  BELONG_BACKEND_URL: window.__ENV__?.BELONG_BACKEND_URL ?? 'http://localhost:5090',
};
