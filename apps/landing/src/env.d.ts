interface ImportMetaEnv {
  readonly PUBLIC_WEB_URL?: string
  readonly PUBLIC_APP_STORE_URL?: string
  readonly PUBLIC_PLAY_STORE_URL?: string
  readonly PUBLIC_APP_STORE_ID?: string
  readonly PUBLIC_CONVEX_URL?: string
  readonly PUBLIC_GA_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
