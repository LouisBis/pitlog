import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import SelectMotoPage from '@/pages/SelectMotoPage'
import BoardPage from '@/pages/BoardPage'
import HistoryPage from '@/pages/HistoryPage'
import ReferencePage from '@/pages/ReferencePage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/garage" element={<SelectMotoPage />} />
        <Route path="/board/:id" element={<BoardPage />} />
        <Route path="/board/:id/history" element={<HistoryPage />} />
        <Route path="/board/:id/reference" element={<ReferencePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
