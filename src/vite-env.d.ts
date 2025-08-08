/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GENESYS_ENVIRONMENT: string
  readonly VITE_GENESYS_CLIENT_ID: string
  readonly VITE_REDIRECT_URI: string
  readonly VITE_RULES_TABLE_ID: string
  readonly VITE_LOGS_TABLE_ID: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}