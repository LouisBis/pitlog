import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SelectMotoPage from '@/pages/SelectMotoPage'
import BoardPage from '@/pages/BoardPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectMotoPage />} />
        <Route path="/board/:id" element={<BoardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
