import { useEffect } from 'react'

interface Props {
  isbn: string
}

export function DisqusComments({ isbn }: Props) {
  useEffect(() => {
    const pageUrl = window.location.href
    const pageIdentifier = `book-${isbn}`

    window.disqus_config = function (this: DisqusConfig) {
      this.page.url = pageUrl
      this.page.identifier = pageIdentifier
    }

    if (window.DISQUS) {
      window.DISQUS.reset({ reload: true, config: window.disqus_config })
    } else {
      const s = document.createElement('script')
      s.src = 'https://booklip.disqus.com/embed.js'
      s.setAttribute('data-timestamp', String(+new Date()))
      ;(document.head || document.body).appendChild(s)
    }
  }, [isbn])

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-[#2D2D2D]">댓글</h2>
      <div className="rounded-2xl bg-white border border-[#E5E7EB] p-4">
        <div id="disqus_thread" />
        <noscript>
          댓글을 보려면 JavaScript를 활성화해 주세요.{' '}
          <a href="https://disqus.com/?ref_noscript">Disqus로 제공되는 댓글</a>
        </noscript>
      </div>
    </div>
  )
}
