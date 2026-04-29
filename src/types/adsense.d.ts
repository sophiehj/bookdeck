declare global {
  interface Window {
    adsbygoogle: { push: (params: object) => void } & object[]
  }
}

export {}
