import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MainDashboard } from './pages/MainDashboard';
import { ClientList } from './pages/ClientList';
import { ClientForm } from './pages/ClientForm';
import { ClientProfile } from './pages/ClientProfile';
import { AnalyticsIndex } from './pages/AnalyticsIndex';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { PlanejamentoServico } from './pages/PlanejamentoServico';
import { DevBoard } from './pages/DevBoard';
import { Configuracoes } from './pages/Configuracoes';
import { HostingRadar } from './pages/HostingRadar';
import { VivoxGP } from './pages/VivoxGP';
import { EducacionalHome } from './pages/EducacionalHome';
import { EducacionalCurso } from './pages/EducacionalCurso';
import { EducacionalAdmin } from './pages/EducacionalAdmin';
import { EducacionalCursoEditor } from './pages/EducacionalCursoEditor';
import Login from './pages/Login';
import { PortalCliente } from './pages/PortalCliente';
import { PortalLogin } from './pages/PortalLogin';
import { AuthProvider, useAuth } from './context/AuthContext';

function InternalRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'CLIENTE') return <Navigate to="/portal" replace />;
  return <Outlet />;
}

function PortalRoute() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/portal/entrar" replace />;
  if (user?.role !== 'CLIENTE') return <Navigate to="/" replace />;
  return <PortalCliente />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/educacional" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Portal do Cliente: fora do Layout interno, protegido somente para CLIENTE */}
          <Route path="/portal" element={<PortalRoute />} />
          <Route path="/portal/entrar" element={<PortalLogin />} />
          
          {/* Rotas internas: protegidas para usuários internos */}
          <Route element={<InternalRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<MainDashboard />} />
              <Route path="clientes" element={<ClientList />} />
              <Route path="cliente/novo" element={<ClientForm />} />
              <Route path="cliente/:id" element={<ClientProfile />} />
              <Route path="clientes/:id" element={<ClientProfile />} />
              <Route path="cliente/:id/servicos/:servicoId/planejamento" element={<PlanejamentoServico />} />
              <Route path="cliente/:id/servicos/:servicoId/planejamento/:itemId" element={<PlanejamentoServico />} />
              <Route path="cliente/:id/servicos/:servicoId/devboard" element={<DevBoard />} />
              
              <Route path="hospedagens" element={<HostingRadar />} />
              <Route path="renovacoes" element={<HostingRadar />} />

              <Route path="analytics" element={<AnalyticsIndex />} />
              <Route path="analytics/:id" element={<AnalyticsDashboard />} />
              <Route path="gp" element={<VivoxGP />} />
              <Route path="gp/tarefa/:tarefaId" element={<VivoxGP />} />
              <Route path="gp/minhas-tarefas" element={<VivoxGP />} />
              <Route path="gp/minhas-tarefas/tarefa/:tarefaId" element={<VivoxGP />} />
              <Route path="gp/workspace/:workspaceId" element={<VivoxGP />} />
              <Route path="gp/workspace/:workspaceId/tarefa/:tarefaId" element={<VivoxGP />} />
              
              <Route path="educacional" element={<EducacionalHome />} />
              <Route path="educacional/curso/:id" element={<EducacionalCurso />} />
              <Route path="educacional/admin" element={<AdminRoute><EducacionalAdmin /></AdminRoute>} />
              <Route path="educacional/admin/:cursoId" element={<AdminRoute><EducacionalCursoEditor /></AdminRoute>} />
              
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
