import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se o erro for 401 (Unauthorized) e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/renovar-token') {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Se não houver refresh token, redirecionar para login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Tentar renovar o token
        const response = await axios.post(`${API_URL}/auth/renovar-token`, {
          refreshToken,
        });
        
        const { token, refreshToken: newRefreshToken } = response.data;
        
        // Armazenar novos tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Atualizar o header e reenviar a requisição original
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar o refresh, limpar tokens e redirecionar para login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },
  
  registrar: async (userData) => {
    const response = await api.post('/auth/registrar', userData);
    return response.data;
  },
  
  getPerfil: async () => {
    const response = await api.get('/auth/perfil');
    return response.data;
  },
  
  atualizarPerfil: async (userData) => {
    const response = await api.put('/auth/perfil', userData);
    return response.data;
  },
  
  alterarSenha: async (senhaData) => {
    const response = await api.put('/auth/alterar-senha', senhaData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
  }
};

// Serviços financeiros
export const financeiroService = {
  criarTransacao: async (transacaoData) => {
    const response = await api.post('/financeiro/transacoes', transacaoData);
    return response.data;
  },
  
  getTransacoes: async (params) => {
    const response = await api.get('/financeiro/transacoes', { params });
    return response.data;
  },
  
  getTransacaoPorId: async (id) => {
    const response = await api.get(`/financeiro/transacoes/${id}`);
    return response.data;
  },
  
  atualizarTransacao: async (id, transacaoData) => {
    const response = await api.put(`/financeiro/transacoes/${id}`, transacaoData);
    return response.data;
  },
  
  aprovarTransacao: async (id) => {
    const response = await api.post(`/financeiro/transacoes/${id}/aprovar`);
    return response.data;
  },
  
  excluirTransacao: async (id) => {
    const response = await api.delete(`/financeiro/transacoes/${id}`);
    return response.data;
  },
  
  getResumoFinanceiro: async (params) => {
    const response = await api.get('/financeiro/resumo', { params });
    return response.data;
  }
};

// Serviços de cultos
export const cultoService = {
  criarCulto: async (cultoData) => {
    const response = await api.post('/cultos/cultos', cultoData);
    return response.data;
  },
  
  getCultos: async (params) => {
    const response = await api.get('/cultos/cultos', { params });
    return response.data;
  },
  
  getCultoPorId: async (id) => {
    const response = await api.get(`/cultos/cultos/${id}`);
    return response.data;
  },
  
  atualizarCulto: async (id, cultoData) => {
    const response = await api.put(`/cultos/cultos/${id}`, cultoData);
    return response.data;
  },
  
  excluirCulto: async (id) => {
    const response = await api.delete(`/cultos/cultos/${id}`);
    return response.data;
  },
  
  getEstatisticasCultos: async (params) => {
    const response = await api.get('/cultos/estatisticas', { params });
    return response.data;
  }
};

// Serviços de congregações
export const congregacaoService = {
  getCongregacoes: async (params) => {
    const response = await api.get('/congregacoes', { params });
    return response.data;
  },
  
  getCongregacaoPorId: async (id) => {
    const response = await api.get(`/congregacoes/${id}`);
    return response.data;
  },
  
  criarCongregacao: async (congregacaoData) => {
    const response = await api.post('/congregacoes', congregacaoData);
    return response.data;
  },
  
  atualizarCongregacao: async (id, congregacaoData) => {
    const response = await api.put(`/congregacoes/${id}`, congregacaoData);
    return response.data;
  },
  
  excluirCongregacao: async (id) => {
    const response = await api.delete(`/congregacoes/${id}`);
    return response.data;
  },
  
  getTransacoesCongregacao: async (id, params) => {
    const response = await api.get(`/financeiro/congregacoes/${id}/transacoes`, { params });
    return response.data;
  },
  
  getResumoFinanceiroCongregacao: async (id, params) => {
    const response = await api.get(`/financeiro/congregacoes/${id}/resumo`, { params });
    return response.data;
  },
  
  getCultosCongregacao: async (id, params) => {
    const response = await api.get(`/cultos/congregacoes/${id}/cultos`, { params });
    return response.data;
  },
  
  getEstatisticasCultosCongregacao: async (id, params) => {
    const response = await api.get(`/cultos/congregacoes/${id}/estatisticas`, { params });
    return response.data;
  }
};

export default api;
