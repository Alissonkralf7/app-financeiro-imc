const { Culto, Congregacao, Usuario } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

// Controlador para criar um novo culto
const criarCulto = async (req, res) => {
  try {
    const {
      tipo,
      titulo,
      data,
      horario_inicio,
      horario_fim,
      congregacao_id,
      pregador_id,
      tema,
      descricao,
      participantes,
      conversoes,
      batismos,
      financeiro,
      observacoes
    } = req.body;

    // Verificar se a congregação existe
    const congregacao = await Congregacao.findByPk(congregacao_id);
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }

    // Verificar se o pregador existe (se fornecido)
    if (pregador_id) {
      const pregador = await Usuario.findByPk(pregador_id);
      if (!pregador) {
        return res.status(404).json({ message: 'Pregador não encontrado' });
      }
    }

    // Criar novo culto
    const culto = await Culto.create({
      tipo,
      titulo,
      data,
      horario_inicio,
      horario_fim,
      congregacao_id,
      responsavel_id: req.usuario.id,
      pregador_id,
      tema,
      descricao,
      participantes,
      conversoes,
      batismos,
      financeiro,
      observacoes,
      registrado_por_id: req.usuario.id
    });

    // Buscar o culto criado com dados relacionados
    const cultoCriado = await Culto.findByPk(culto.id, {
      include: [
        {
          model: Congregacao,
          as: 'congregacao',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'responsavel',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'pregador',
          attributes: ['id', 'nome']
        }
      ]
    });

    res.status(201).json({
      message: 'Culto registrado com sucesso',
      culto: cultoCriado
    });
  } catch (error) {
    console.error('Erro ao criar culto:', error);
    res.status(500).json({ message: 'Erro ao criar culto', error: error.message });
  }
};

// Controlador para obter todos os cultos (com filtros)
const getCultos = async (req, res) => {
  try {
    const {
      congregacao_id,
      tipo,
      data_inicio,
      data_fim,
      responsavel_id,
      pregador_id,
      page = 1,
      limit = 10
    } = req.query;

    // Construir filtro
    const where = {};
    
    if (congregacao_id) where.congregacao_id = congregacao_id;
    if (tipo) where.tipo = tipo;
    if (responsavel_id) where.responsavel_id = responsavel_id;
    if (pregador_id) where.pregador_id = pregador_id;
    
    // Filtro de data
    if (data_inicio || data_fim) {
      where.data = {};
      if (data_inicio) where.data[Op.gte] = new Date(data_inicio);
      if (data_fim) where.data[Op.lte] = new Date(data_fim);
    }

    // Restrição por perfil de usuário
    if (req.usuario.perfil !== 'admin_global' && req.usuario.perfil !== 'diretor') {
      where.congregacao_id = req.usuario.congregacao_id;
    }

    // Calcular paginação
    const offset = (page - 1) * limit;
    
    // Buscar cultos
    const { count, rows: cultos } = await Culto.findAndCountAll({
      where,
      order: [['data', 'DESC']],
      offset,
      limit: parseInt(limit),
      include: [
        {
          model: Congregacao,
          as: 'congregacao',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'responsavel',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'pregador',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    res.status(200).json({
      cultos,
      paginacao: {
        total: count,
        pagina: parseInt(page),
        limite: parseInt(limit),
        paginas: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar cultos:', error);
    res.status(500).json({ message: 'Erro ao buscar cultos', error: error.message });
  }
};

// Controlador para obter um culto específico
const getCultoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const culto = await Culto.findByPk(id, {
      include: [
        {
          model: Congregacao,
          as: 'congregacao',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'responsavel',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'pregador',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'registrado_por',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    if (!culto) {
      return res.status(404).json({ message: 'Culto não encontrado' });
    }
    
    // Verificar permissão de acesso
    if (req.usuario.perfil !== 'admin_global' && 
        req.usuario.perfil !== 'diretor' && 
        culto.congregacao_id !== req.usuario.congregacao_id) {
      return res.status(403).json({ message: 'Sem permissão para acessar este culto' });
    }
    
    res.status(200).json({ culto });
  } catch (error) {
    console.error('Erro ao buscar culto:', error);
    res.status(500).json({ message: 'Erro ao buscar culto', error: error.message });
  }
};

// Controlador para atualizar um culto
const atualizarCulto = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      titulo,
      data,
      horario_inicio,
      horario_fim,
      pregador_id,
      tema,
      descricao,
      participantes,
      conversoes,
      batismos,
      financeiro,
      observacoes
    } = req.body;
    
    // Buscar culto atual
    const cultoAtual = await Culto.findByPk(id);
    if (!cultoAtual) {
      return res.status(404).json({ message: 'Culto não encontrado' });
    }
    
    // Verificar permissões (apenas o responsável ou administradores podem editar)
    if (cultoAtual.responsavel_id !== req.usuario.id && 
        cultoAtual.registrado_por_id !== req.usuario.id && 
        !['admin_global', 'diretor', 'pastor'].includes(req.usuario.perfil)) {
      return res.status(403).json({ message: 'Sem permissão para editar este culto' });
    }
    
    // Verificar se o pregador existe (se fornecido)
    if (pregador_id) {
      const pregador = await Usuario.findByPk(pregador_id);
      if (!pregador) {
        return res.status(404).json({ message: 'Pregador não encontrado' });
      }
    }
    
    // Atualizar culto
    await Culto.update(
      {
        tipo,
        titulo,
        data,
        horario_inicio,
        horario_fim,
        pregador_id,
        tema,
        descricao,
        participantes,
        conversoes,
        batismos,
        financeiro,
        observacoes,
        atualizado_por_id: req.usuario.id,
        data_atualizacao: new Date()
      },
      { where: { id } }
    );
    
    // Buscar o culto atualizado
    const culto = await Culto.findByPk(id, {
      include: [
        {
          model: Congregacao,
          as: 'congregacao',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'responsavel',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'pregador',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    res.status(200).json({
      message: 'Culto atualizado com sucesso',
      culto
    });
  } catch (error) {
    console.error('Erro ao atualizar culto:', error);
    res.status(500).json({ message: 'Erro ao atualizar culto', error: error.message });
  }
};

// Controlador para excluir um culto
const excluirCulto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar culto
    const culto = await Culto.findByPk(id);
    if (!culto) {
      return res.status(404).json({ message: 'Culto não encontrado' });
    }
    
    // Verificar permissões (apenas administradores podem excluir)
    if (!['admin_global', 'diretor'].includes(req.usuario.perfil)) {
      return res.status(403).json({ message: 'Sem permissão para excluir cultos' });
    }
    
    // Excluir culto
    await Culto.destroy({ where: { id } });
    
    res.status(200).json({ message: 'Culto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir culto:', error);
    res.status(500).json({ message: 'Erro ao excluir culto', error: error.message });
  }
};

// Controlador para obter estatísticas de cultos
const getEstatisticasCultos = async (req, res) => {
  try {
    const { congregacao_id, data_inicio, data_fim } = req.query;
    
    // Construir filtro
    const where = {};
    
    // Restrição por congregação
    if (congregacao_id) {
      where.congregacao_id = congregacao_id;
    } else if (req.usuario.perfil !== 'admin_global' && req.usuario.perfil !== 'diretor') {
      where.congregacao_id = req.usuario.congregacao_id;
    }
    
    // Filtro de data
    if (data_inicio || data_fim) {
      where.data = {};
      if (data_inicio) where.data[Op.gte] = new Date(data_inicio);
      if (data_fim) where.data[Op.lte] = new Date(data_fim);
    }
    
    // Estatísticas por tipo de culto
    const estatisticasPorTipo = await Culto.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_cultos'],
        [sequelize.fn('SUM', sequelize.col('participantes.total')), 'total_participantes'],
        [sequelize.fn('SUM', sequelize.col('conversoes')), 'total_conversoes'],
        [sequelize.fn('SUM', sequelize.col('batismos')), 'total_batismos'],
        [sequelize.fn('SUM', sequelize.col('financeiro.dizimos')), 'total_dizimos'],
        [sequelize.fn('SUM', sequelize.col('financeiro.ofertas')), 'total_ofertas']
      ],
      where,
      group: ['tipo'],
      order: [[sequelize.literal('total_participantes'), 'DESC']]
    });
    
    // Totais gerais
    const totais = await Culto.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_cultos'],
        [sequelize.fn('SUM', sequelize.col('participantes.total')), 'total_participantes'],
        [sequelize.fn('SUM', sequelize.col('conversoes')), 'total_conversoes'],
        [sequelize.fn('SUM', sequelize.col('batismos')), 'total_batismos'],
        [sequelize.fn('SUM', sequelize.col('financeiro.dizimos')), 'total_dizimos'],
        [sequelize.fn('SUM', sequelize.col('financeiro.ofertas')), 'total_ofertas']
      ],
      where
    });
    
    res.status(200).json({
      estatisticasPorTipo,
      totais: totais[0]
    });
  } catch (error) {
    console.error('Erro ao gerar estatísticas de cultos:', error);
    res.status(500).json({ message: 'Erro ao gerar estatísticas de cultos', error: error.message });
  }
};

module.exports = {
  criarCulto,
  getCultos,
  getCultoPorId,
  atualizarCulto,
  excluirCulto,
  getEstatisticasCultos
};
