import React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import theme from './styles/theme';

// Páginas e componentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CongregacaoDashboard from './pages/CongregacaoDashboard';
import RelatorioFinanceiro from './pages/RelatorioFinanceiro';
import RelatorioCultos from './pages/RelatorioCultos';
import GerenciamentoMembros from './pages/GerenciamentoMembros';
import GerenciamentoCongregacoes from './pages/GerenciamentoCongregacoes';
import RelatorioPorCongregacao from './pages/RelatorioPorCongregacao';
import AnalisePredicao from './pages/AnalisePredicao';
import Perfil from './pages/Perfil';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AcessoNegado from './pages/AcessoNegado';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Routes>
              {/* Rota pública */}
              <Route path="/login" element={<Login />} />
              <Route path="/acesso-negado" element={<AcessoNegado />} />
              
              {/* Rotas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  {/* Dashboard principal (admin global) */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  {/* Relatórios gerais */}
                  <Route path="/relatorios/financeiro" element={<RelatorioFinanceiro />} />
                  <Route path="/relatorios/cultos" element={<RelatorioCultos />} />
                  
                  {/* Gerenciamento */}
                  <Route path="/gerenciamento/membros" element={<GerenciamentoMembros />} />
                  <Route path="/gerenciamento/congregacoes" element={<GerenciamentoCongregacoes />} />
                  
                  {/* Dashboard e relatórios por congregação */}
                  <Route path="/congregacoes/:congregacaoId/dashboard" element={<CongregacaoDashboard />} />
                  <Route path="/congregacoes/:congregacaoId/relatorios" element={<RelatorioPorCongregacao />} />
                  
                  {/* Análise preditiva */}
                  <Route path="/analise-predicao" element={<AnalisePredicao />} />
                  
                  {/* Perfil do usuário */}
                  <Route path="/perfil" element={<Perfil />} />
                </Route>
              </Route>
              
              {/* Redirecionar para dashboard se acessar a raiz */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Rota para qualquer outro caminho não definido */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
