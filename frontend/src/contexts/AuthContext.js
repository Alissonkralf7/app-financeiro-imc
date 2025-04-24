import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Criar o contexto de autenticação
const AuthContext = createContext();

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provedor do contexto de autenticação
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimer, setRefreshTimer] = useState(null);

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const verificarAutenticacao = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Configurar o token no cabeçalho das requisições
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Obter informações do usuário
          const response = await api.get('/auth/me');
          setUsuario(response.data.usuario);
          
          // Configurar timer para renovar o token
          configurarRefreshToken();
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          // Se o token for inválido ou expirado, fazer logout
          logout();
        }
      }
      
      setLoading(false);
    };
    
    verificarAutenticacao();
    
    // Limpar timer ao desmontar o componente
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, []);

  // Função para configurar o timer de renovação do token
  const configurarRefreshToken = () => {
    // Limpar timer existente
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    
    // Configurar novo timer para renovar o token a cada 15 minutos
    const timer = setTimeout(async () => {
      try {
        const response = await api.post('/auth/refresh-token');
        const { token } = response.data;
        
        // Atualizar token no localStorage
        localStorage.setItem('token', token);
        
        // Atualizar token no cabeçalho das requisições
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Configurar próximo timer
        configurarRefreshToken();
      } catch (error) {
        console.error('Erro ao renovar token:', error);
        // Se houver erro ao renovar o token, fazer logout
        logout();
      }
    }, 15 * 60 * 1000); // 15 minutos
    
    setRefreshTimer(timer);
  };

  // Função para fazer login
  const login = async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, usuario } = response.data;
      
      // Salvar token no localStorage
      localStorage.setItem('token', token);
      
      // Configurar o token no cabeçalho das requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Atualizar estado do usuário
      setUsuario(usuario);
      
      // Configurar timer para renovar o token
      configurarRefreshToken();
      
      return usuario;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  // Função para fazer logout
  const logout = () => {
    // Remover token do localStorage
    localStorage.removeItem('token');
    
    // Remover token do cabeçalho das requisições
    delete api.defaults.headers.common['Authorization'];
    
    // Limpar timer de renovação do token
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
    
    // Limpar estado do usuário
    setUsuario(null);
  };

  // Função para verificar se o usuário tem determinada permissão
  const temPermissao = (permissao) => {
    if (!usuario) return false;
    
    // Verificar se o usuário é admin global (tem todas as permissões)
    if (usuario.perfil === 'admin_global') return true;
    
    // Verificar permissões específicas
    switch (permissao) {
      case 'gerenciar_congregacoes':
        return usuario.perfil === 'admin_global' || usuario.perfil === 'diretor';
      
      case 'gerenciar_membros':
        return usuario.perfil === 'admin_global' || usuario.perfil === 'diretor' || usuario.perfil === 'pastor';
      
      case 'gerenciar_financas':
        return usuario.perfil === 'admin_global' || usuario.perfil === 'diretor' || usuario.perfil === 'pastor' || usuario.perfil === 'tesoureiro';
      
      case 'gerenciar_cultos':
        return usuario.perfil === 'admin_global' || usuario.perfil === 'diretor' || usuario.perfil === 'pastor' || usuario.perfil === 'secretario';
      
      case 'ver_relatorios':
        return usuario.perfil === 'admin_global' || usuario.perfil === 'diretor' || usuario.perfil === 'pastor' || usuario.perfil === 'tesoureiro';
      
      case 'ver_analise_preditiva':
        return usuario.perfil === 'admin_global' || usuario.perfil === 'diretor';
      
      default:
        return false;
    }
  };

  // Valores a serem fornecidos pelo contexto
  const value = {
    usuario,
    loading,
    login,
    logout,
    temPermissao
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
