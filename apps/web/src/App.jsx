import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { InputDataPage } from './pages/InputDataPage.jsx';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/adicionar-cliente" element={<InputDataPage />} />
        <Route path="/input-data" element={<Navigate to="/adicionar-cliente" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}