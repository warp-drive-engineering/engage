/**
 * Type declarations for
 *    import config from 'my-app/config/environment'
 */
 declare const config: {
  apiNamespace: string;
  apiHost: string;
  apiCacheHardExpires: number;
  apiCacheSoftExpires: number;
  environment: string;
  modulePrefix: string;
  podModulePrefix: string;
  locationType: "history" | "hash" | "none" | "auto";
  rootURL: string;
  APP: Record<string, unknown>;
};

export default config;
