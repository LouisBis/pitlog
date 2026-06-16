import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SelectMotoPage from '@/pages/SelectMotoPage'
import BoardPage from '@/pages/BoardPage'
import HistoryPage from '@/pages/HistoryPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<SelectMotoPage />} />
        <Route path="/board/:id" element={<BoardPage />} />
        <Route path="/board/:id/history" element={<HistoryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
