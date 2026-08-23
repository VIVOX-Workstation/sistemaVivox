import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MainDashboard } from './pages/MainDashboard';
import { ClientList } from './pages/ClientList';
import { ClientForm } from './pages/ClientForm';
import { ClientProfile } from './pages/ClientProfile';
import { AnalyticsIndex } from './pages/AnalyticsIndex';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { PlanejamentoServico } from './pages/PlanejamentoServico';
import { Configuracoes } from './pages/Configuracoes';
import { VivoxGP } from './pages/VivoxGP';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<MainDashboard />} />
              <Route path="clientes" element={<ClientList />} />
              <Route path="cliente/novo" element={<ClientForm />} />
              <Route path="cliente/:id" element={<ClientProfile />} />
              <Route path="clientes/:id" element={<ClientProfile />} />
              <Route path="cliente/:id/servicos/:servicoId/planejamento" element={<PlanejamentoServico />} />
              <Route path="cliente/:id/servicos/:servicoId/planejamento/:itemId" element={<PlanejamentoServico />} />
              
              <Route path="analytics" element={<AnalyticsIndex />} />
              <Route path="analytics/:id" element={<AnalyticsDashboard />} />
              <Route path="gp" element={<VivoxGP />} />
              <Route path="gp/tarefa/:tarefaId" element={<VivoxGP />} />
              <Route path="gp/workspace/:workspaceId" element={<VivoxGP />} />
              <Route path="gp/workspace/:workspaceId/tarefa/:tarefaId" element={<VivoxGP />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
