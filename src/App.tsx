import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { HomePage } from './pages/HomePage'
import { BookDetailPage } from './pages/BookDetailPage'
import { SearchPage } from './pages/SearchPage'
import { KakaoCallbackPage } from './pages/KakaoCallbackPage'
import { MyPage } from './pages/MyPage'

function AppRoutes() {
  useAuth()
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/book/:isbn" element={<BookDetailPage />} />
      <Route path="/kakao-callback" element={<KakaoCallbackPage />} />
      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
