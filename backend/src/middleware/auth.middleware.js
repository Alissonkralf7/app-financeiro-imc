import jwt from 'jsonwebtoken';
import config from '../config/auth';

// Middleware para verificar autenticação
const authMiddleware = {
  // Verificar token JWT
  verifyToken(req, res, next) {
    try {
      // Obter token do cabeçalho Authorization
      const authHeader = req.headers.authorization;
      
      // Verificar se o token existe
      if (!authHeader) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token não fornecido' 
        });
      }
      
      // Verificar formato do token (Bearer <token>)
      const parts = authHeader.split(' ');
      if (parts.length !== 2) {
        return res.status(401).json({ 
          success: false, 
          message: 'Erro no formato do token' 
        });
      }
      
      const [scheme, token] = parts;
      if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token mal formatado' 
        });
      }
      
      // Verificar validade do token
      jwt.verify(token, config.secret, (err, decoded) => {
        if (err) {
          return res.status(401).json({ 
            success: false, 
            message: 'Token inválido ou expirado' 
          });
        }
        
        // Adicionar ID do usuário e perfil ao objeto de requisição
        req.userId = decoded.id;
        req.userPerfil = decoded.perfil;
        
        return next();
      });
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },
  
  // Verificar se o usuário é administrador global
  isAdminGlobal(req, res, next) {
    try {
      // Verificar perfil do usuário
      if (req.userPerfil !== 'admin_global') {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado. Permissão de administrador global necessária.' 
        });
      }
      
      return next();
    } catch (error) {
      console.error('Erro ao verificar permissão de administrador global:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },
  
  // Verificar se o usuário é administrador global ou diretor
  isAdminOrDiretor(req, res, next) {
    try {
      // Verificar perfil do usuário
      if (req.userPerfil !== 'admin_global' && req.userPerfil !== 'diretor') {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado. Permissão de administrador global ou diretor necessária.' 
        });
      }
      
      return next();
    } catch (error) {
      console.error('Erro ao verificar permissão de administrador ou diretor:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },
  
  // Verificar se o usuário é administrador global, diretor ou pastor
  isAdminOrDiretorOrPastor(req, res, next) {
    try {
      // Verificar perfil do usuário
      if (req.userPerfil !== 'admin_global' && req.userPerfil !== 'diretor' && req.userPerfil !== 'pastor') {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado. Permissão de administrador global, diretor ou pastor necessária.' 
        });
      }
      
      return next();
    } catch (error) {
      console.error('Erro ao verificar permissão de administrador, diretor ou pastor:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },
  
  // Verificar se o usuário tem permissão para acessar uma congregação específica
  async canAccessCongregacao(req, res, next) {
    try {
      const { congregacaoId } = req.params;
      
      // Se for administrador global ou diretor, permitir acesso a qualquer congregação
      if (req.userPerfil === 'admin_global' || req.userPerfil === 'diretor') {
        return next();
      }
      
      // Buscar usuário pelo ID
      const { Usuario } = require('../models');
      const usuario = await Usuario.findByPk(req.userId, {
        include: ['congregacao']
      });
      
      // Verificar se o usuário existe
      if (!usuario) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }
      
      // Verificar se o usuário tem acesso à congregação
      if (usuario.congregacao?.id !== parseInt(congregacaoId)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Acesso negado. Você não tem permissão para acessar esta congregação.' 
        });
      }
      
      return next();
    } catch (error) {
      console.error('Erro ao verificar permissão de acesso à congregação:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
};

export default authMiddleware;
