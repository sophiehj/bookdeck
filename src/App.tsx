import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const BookDetailPage = lazy(() => import('./pages/BookDetailPage').then((m) => ({ default: m.BookDetailPage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const KakaoCallbackPage = lazy(() => import('./pages/KakaoCallbackPage').then((m) => ({ default: m.KakaoCallbackPage })))
const MyPage = lazy(() => import('./pages/MyPage').then((m) => ({ default: m.MyPage })))

function AppRoutes() {
  useAuth()
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF7]" />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/book/:isbn" element={<BookDetailPage />} />
        <Route path="/kakao-callback" element={<KakaoCallbackPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
