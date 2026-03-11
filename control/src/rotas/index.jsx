import { Routes, Route, Navigate } from 'react-router-dom'
import { PaginaInicio } from '../paginas/Inicio/index.jsx'

export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<PaginaInicio />} />
      <Route path="/inicio" element={<PaginaInicio />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
