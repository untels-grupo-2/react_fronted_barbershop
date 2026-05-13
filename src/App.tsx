import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ServiciosPage from './pages/ServiciosPage';
import BarberosPage from './pages/BarberosPage';
import ValoracionesPage from './pages/ValoracionesPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="servicios" element={<ServiciosPage />} />
          <Route path="barberos" element={<BarberosPage />} />
          <Route path="valoraciones" element={<ValoracionesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

