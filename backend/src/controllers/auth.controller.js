import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Usuario } from '../models';
import config from '../config/auth';

// Controlador para autenticação
const authController = {
  // Login de usuário
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // Validar dados de entrada
      if (!email || !senha) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email e senha são obrigatórios' 
        });
      }

      // Buscar usuário pelo email
      const usuario = await Usuario.findOne({ 
        where: { email },
        include: ['congregacao']
      });

      // Verificar se o usuário existe
      if (!usuario) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }

      // Verificar se o usuário está ativo
      if (!usuario.ativo) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário inativo. Entre em contato com o administrador.' 
        });
      }

      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({ 
          success: false, 
          message: 'Credenciais inválidas' 
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { id: usuario.id, perfil: usuario.perfil },
        config.secret,
        { expiresIn: config.expiresIn }
      );

      // Gerar refresh token
      const refreshToken = jwt.sign(
        { id: usuario.id },
        config.refreshSecret,
        { expiresIn: config.refreshExpiresIn }
      );

      // Salvar refresh token no banco de dados
      await usuario.update({ refresh_token: refreshToken });

      // Remover senha e refresh token do objeto de resposta
      const usuarioSemSenha = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        congregacao: usuario.congregacao,
        ultimo_acesso: usuario.ultimo_acesso
      };

      // Atualizar último acesso
      await usuario.update({ ultimo_acesso: new Date() });

      // Retornar dados do usuário e token
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        refresh_token: refreshToken,
        usuario: usuarioSemSenha
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },

  // Renovar token JWT
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      // Validar dados de entrada
      if (!refresh_token) {
        return res.status(400).json({ 
          success: false, 
          message: 'Refresh token é obrigatório' 
        });
      }

      // Verificar refresh token
      let decoded;
      try {
        decoded = jwt.verify(refresh_token, config.refreshSecret);
      } catch (error) {
        return res.status(401).json({ 
          success: false, 
          message: 'Refresh token inválido ou expirado' 
        });
      }

      // Buscar usuário pelo ID
      const usuario = await Usuario.findByPk(decoded.id, {
        include: ['congregacao']
      });

      // Verificar se o usuário existe
      if (!usuario) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }

      // Verificar se o refresh token é válido
      if (usuario.refresh_token !== refresh_token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Refresh token inválido' 
        });
      }

      // Verificar se o usuário está ativo
      if (!usuario.ativo) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuário inativo. Entre em contato com o administrador.' 
        });
      }

      // Gerar novo token JWT
      const token = jwt.sign(
        { id: usuario.id, perfil: usuario.perfil },
        config.secret,
        { expiresIn: config.expiresIn }
      );

      // Gerar novo refresh token
      const newRefreshToken = jwt.sign(
        { id: usuario.id },
        config.refreshSecret,
        { expiresIn: config.refreshExpiresIn }
      );

      // Salvar novo refresh token no banco de dados
      await usuario.update({ refresh_token: newRefreshToken });

      // Retornar novo token
      return res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        token,
        refresh_token: newRefreshToken
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },

  // Obter informações do usuário autenticado
  async getMe(req, res) {
    try {
      // Buscar usuário pelo ID (já verificado pelo middleware de autenticação)
      const usuario = await Usuario.findByPk(req.userId, {
        include: ['congregacao'],
        attributes: { exclude: ['senha', 'refresh_token'] }
      });

      // Verificar se o usuário existe
      if (!usuario) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }

      // Retornar dados do usuário
      return res.status(200).json({
        success: true,
        usuario
      });
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },

  // Logout de usuário
  async logout(req, res) {
    try {
      // Buscar usuário pelo ID (já verificado pelo middleware de autenticação)
      const usuario = await Usuario.findByPk(req.userId);

      // Verificar se o usuário existe
      if (!usuario) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }

      // Limpar refresh token
      await usuario.update({ refresh_token: null });

      // Retornar sucesso
      return res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  },

  // Alterar senha
  async alterarSenha(req, res) {
    try {
      const { senha_atual, nova_senha } = req.body;

      // Validar dados de entrada
      if (!senha_atual || !nova_senha) {
        return res.status(400).json({ 
          success: false, 
          message: 'Senha atual e nova senha são obrigatórias' 
        });
      }

      // Buscar usuário pelo ID (já verificado pelo middleware de autenticação)
      const usuario = await Usuario.findByPk(req.userId);

      // Verificar se o usuário existe
      if (!usuario) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuário não encontrado' 
        });
      }

      // Verificar senha atual
      const senhaCorreta = await bcrypt.compare(senha_atual, usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({ 
          success: false, 
          message: 'Senha atual incorreta' 
        });
      }

      // Criptografar nova senha
      const salt = await bcrypt.genSalt(10);
      const senhaCriptografada = await bcrypt.hash(nova_senha, salt);

      // Atualizar senha
      await usuario.update({ senha: senhaCriptografada });

      // Retornar sucesso
      return res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  }
};

export default authController;
