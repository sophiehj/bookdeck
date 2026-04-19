import { useEffect } from 'react'
import { Layout } from '../components/Layout'
import { CardDeck } from '../components/CardDeck'
import { TasteSearchBar } from '../components/TasteSearchBar'
import { useCardStore } from '../store/cardStore'
import { useAuthStore } from '../store/authStore'

export function HomePage() {
  const { init } = useCardStore()
  const { user } = useAuthStore()

  useEffect(() => {
    init(user?.uid)
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100svh-3.5rem-3rem)] min-h-[500px]">
        <TasteSearchBar />
        <div className="flex-1 min-h-0">
          <CardDeck />
        </div>
      </div>
    </Layout>
  )
}
