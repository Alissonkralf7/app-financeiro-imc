const express = require('express');
const router = express.Router();
const { Congregacao, Usuario } = require('../models');
const { verificarToken, verificarPermissao, verificarAcessoCongregacao } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// Todas as rotas de congregações requerem autenticação
router.use(verificarToken);

// Obter todas as congregações
router.get('/', async (req, res) => {
  try {
    // Filtros
    const { nome, tipo, ativo, page = 1, limit = 10 } = req.query;
    
    // Construir filtro
    const where = {};
    
    if (nome) where.nome = { [Op.iLike]: `%${nome}%` };
    if (tipo) where.tipo = tipo;
    if (ativo !== undefined) where.ativo = ativo === 'true';
    
    // Restrição por perfil de usuário
    if (req.usuario.perfil !== 'admin_global' && req.usuario.perfil !== 'diretor') {
      where.id = req.usuario.congregacao_id;
    }
    
    // Calcular paginação
    const offset = (page - 1) * limit;
    
    // Buscar congregações
    const { count, rows: congregacoes } = await Congregacao.findAndCountAll({
      where,
      order: [['nome', 'ASC']],
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: Usuario,
          as: 'pastor',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Congregacao,
          as: 'congregacao_mae',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    res.status(200).json({
      congregacoes,
      paginacao: {
        total: count,
        pagina: parseInt(page),
        limite: parseInt(limit),
        paginas: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar congregações:', error);
    res.status(500).json({ message: 'Erro ao buscar congregações', error: error.message });
  }
});

// Obter uma congregação específica
router.get('/:id', verificarAcessoCongregacao, async (req, res) => {
  try {
    const { id } = req.params;
    
    const congregacao = await Congregacao.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'pastor',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Congregacao,
          as: 'congregacao_mae',
          attributes: ['id', 'nome']
        },
        {
          model: Congregacao,
          as: 'congregacoes_filhas',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }
    
    res.status(200).json({ congregacao });
  } catch (error) {
    console.error('Erro ao buscar congregação:', error);
    res.status(500).json({ message: 'Erro ao buscar congregação', error: error.message });
  }
});

// Criar uma nova congregação
router.post('/', verificarPermissao('admin_global', 'diretor'), async (req, res) => {
  try {
    const {
      nome,
      endereco,
      telefone,
      email,
      tipo,
      pastor_id,
      congregacao_mae_id,
      dados_financeiros
    } = req.body;
    
    // Verificar se o pastor existe (se fornecido)
    if (pastor_id) {
      const pastor = await Usuario.findByPk(pastor_id);
      if (!pastor) {
        return res.status(404).json({ message: 'Pastor não encontrado' });
      }
    }
    
    // Verificar se a congregação mãe existe (se fornecida)
    if (congregacao_mae_id) {
      const congregacaoMae = await Congregacao.findByPk(congregacao_mae_id);
      if (!congregacaoMae) {
        return res.status(404).json({ message: 'Congregação mãe não encontrada' });
      }
    }
    
    // Criar nova congregação
    const congregacao = await Congregacao.create({
      nome,
      endereco,
      telefone,
      email,
      tipo,
      pastor_id,
      congregacao_mae_id,
      dados_financeiros
    });
    
    // Buscar a congregação criada com dados relacionados
    const congregacaoCriada = await Congregacao.findByPk(congregacao.id, {
      include: [
        {
          model: Usuario,
          as: 'pastor',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Congregacao,
          as: 'congregacao_mae',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    res.status(201).json({
      message: 'Congregação criada com sucesso',
      congregacao: congregacaoCriada
    });
  } catch (error) {
    console.error('Erro ao criar congregação:', error);
    res.status(500).json({ message: 'Erro ao criar congregação', error: error.message });
  }
});

// Atualizar uma congregação
router.put('/:id', verificarPermissao('admin_global', 'diretor'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      endereco,
      telefone,
      email,
      tipo,
      pastor_id,
      congregacao_mae_id,
      ativo,
      dados_financeiros
    } = req.body;
    
    // Verificar se a congregação existe
    const congregacao = await Congregacao.findByPk(id);
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }
    
    // Verificar se o pastor existe (se fornecido)
    if (pastor_id) {
      const pastor = await Usuario.findByPk(pastor_id);
      if (!pastor) {
        return res.status(404).json({ message: 'Pastor não encontrado' });
      }
    }
    
    // Verificar se a congregação mãe existe (se fornecida)
    if (congregacao_mae_id) {
      const congregacaoMae = await Congregacao.findByPk(congregacao_mae_id);
      if (!congregacaoMae) {
        return res.status(404).json({ message: 'Congregação mãe não encontrada' });
      }
      
      // Evitar ciclos: uma congregação não pode ser mãe de si mesma
      if (congregacao_mae_id === id) {
        return res.status(400).json({ message: 'Uma congregação não pode ser mãe de si mesma' });
      }
    }
    
    // Atualizar congregação
    await Congregacao.update(
      {
        nome,
        endereco,
        telefone,
        email,
        tipo,
        pastor_id,
        congregacao_mae_id,
        ativo,
        dados_financeiros,
        data_atualizacao: new Date()
      },
      { where: { id } }
    );
    
    // Buscar a congregação atualizada
    const congregacaoAtualizada = await Congregacao.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'pastor',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: Congregacao,
          as: 'congregacao_mae',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    res.status(200).json({
      message: 'Congregação atualizada com sucesso',
      congregacao: congregacaoAtualizada
    });
  } catch (error) {
    console.error('Erro ao atualizar congregação:', error);
    res.status(500).json({ message: 'Erro ao atualizar congregação', error: error.message });
  }
});

// Excluir uma congregação
router.delete('/:id', verificarPermissao('admin_global'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a congregação existe
    const congregacao = await Congregacao.findByPk(id);
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }
    
    // Verificar se existem congregações filhas
    const congregacoesFilhas = await Congregacao.count({ where: { congregacao_mae_id: id } });
    if (congregacoesFilhas > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir esta congregação pois existem congregações filhas vinculadas a ela' 
      });
    }
    
    // Verificar se existem membros vinculados
    const membrosVinculados = await Usuario.count({ where: { congregacao_id: id } });
    if (membrosVinculados > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir esta congregação pois existem membros vinculados a ela' 
      });
    }
    
    // Excluir congregação
    await Congregacao.destroy({ where: { id } });
    
    res.status(200).json({ message: 'Congregação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir congregação:', error);
    res.status(500).json({ message: 'Erro ao excluir congregação', error: error.message });
  }
});

module.exports = router;
