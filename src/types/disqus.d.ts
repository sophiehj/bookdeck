declare global {
  interface DisqusConfig {
    page: {
      url: string
      identifier: string
    }
  }

  interface Window {
    disqus_config: (this: DisqusConfig) => void
    DISQUS?: {
      reset: (opts: { reload: boolean; config: (this: DisqusConfig) => void }) => void
    }
  }
}

export {}
