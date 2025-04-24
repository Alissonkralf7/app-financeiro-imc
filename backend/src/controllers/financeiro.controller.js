const { Transacao, Congregacao, Usuario } = require('../models');
const { Op } = require('sequelize');
const { transaction } = require('../config/database');

// Controlador para criar uma nova transação financeira
const criarTransacao = async (req, res) => {
  try {
    const {
      tipo,
      categoria,
      subcategoria,
      valor,
      data,
      descricao,
      congregacao_id,
      forma_pagamento,
      recorrente,
      doador_id,
      observacoes
    } = req.body;

    // Verificar se a congregação existe
    const congregacao = await Congregacao.findByPk(congregacao_id);
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }

    // Usar transação para garantir consistência dos dados
    await transaction(async (client) => {
      // Criar nova transação
      const novaTransacao = await Transacao.create({
        tipo,
        categoria,
        subcategoria,
        valor,
        data: data || new Date(),
        descricao,
        congregacao_id,
        forma_pagamento,
        recorrente,
        doador_id,
        responsavel_id: req.usuario.id,
        observacoes,
        metadados: {
          ip_registro: req.ip,
          dispositivo: req.headers['user-agent'],
          localizacao: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        }
      }, { transaction: client });

      // Atualizar saldo da congregação se a transação for confirmada
      if (novaTransacao.status === 'CONFIRMADO') {
        const valorAjuste = tipo === 'RECEITA' ? parseFloat(valor) : -parseFloat(valor);
        
        // Atualizar o saldo da congregação
        await Congregacao.update(
          { 
            dados_financeiros: congregacao.dados_financeiros.saldo_atual 
              ? { 
                  ...congregacao.dados_financeiros,
                  saldo_atual: parseFloat(congregacao.dados_financeiros.saldo_atual) + valorAjuste 
                }
              : { 
                  ...congregacao.dados_financeiros,
                  saldo_atual: valorAjuste 
                }
          },
          { 
            where: { id: congregacao_id },
            transaction: client
          }
        );
      }

      return novaTransacao;
    });

    // Buscar a transação criada com dados relacionados
    const transacao = await Transacao.findOne({
      where: { descricao, responsavel_id: req.usuario.id },
      order: [['data_criacao', 'DESC']],
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
        }
      ]
    });

    res.status(201).json({
      message: 'Transação registrada com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({ message: 'Erro ao criar transação', error: error.message });
  }
};

// Controlador para obter todas as transações (com filtros)
const getTransacoes = async (req, res) => {
  try {
    const {
      congregacao_id,
      tipo,
      categoria,
      data_inicio,
      data_fim,
      status,
      responsavel_id,
      doador_id,
      page = 1,
      limit = 10
    } = req.query;

    // Construir filtro
    const where = {};
    
    if (congregacao_id) where.congregacao_id = congregacao_id;
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (status) where.status = status;
    if (responsavel_id) where.responsavel_id = responsavel_id;
    if (doador_id) where.doador_id = doador_id;
    
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
    
    // Buscar transações
    const { count, rows: transacoes } = await Transacao.findAndCountAll({
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
          as: 'doador',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'aprovador',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    res.status(200).json({
      transacoes,
      paginacao: {
        total: count,
        pagina: parseInt(page),
        limite: parseInt(limit),
        paginas: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ message: 'Erro ao buscar transações', error: error.message });
  }
};

// Controlador para obter uma transação específica
const getTransacaoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transacao = await Transacao.findByPk(id, {
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
          as: 'doador',
          attributes: ['id', 'nome']
        },
        {
          model: Usuario,
          as: 'aprovador',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    if (!transacao) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    // Verificar permissão de acesso
    if (req.usuario.perfil !== 'admin_global' && 
        req.usuario.perfil !== 'diretor' && 
        transacao.congregacao_id !== req.usuario.congregacao_id) {
      return res.status(403).json({ message: 'Sem permissão para acessar esta transação' });
    }
    
    res.status(200).json({ transacao });
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    res.status(500).json({ message: 'Erro ao buscar transação', error: error.message });
  }
};

// Controlador para atualizar uma transação
const atualizarTransacao = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tipo,
      categoria,
      subcategoria,
      valor,
      data,
      descricao,
      forma_pagamento,
      status,
      observacoes
    } = req.body;
    
    // Buscar transação atual
    const transacaoAtual = await Transacao.findByPk(id);
    if (!transacaoAtual) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    // Verificar permissões (apenas o responsável ou administradores podem editar)
    if (transacaoAtual.responsavel_id !== req.usuario.id && 
        !['admin_global', 'diretor', 'financeiro'].includes(req.usuario.perfil)) {
      return res.status(403).json({ message: 'Sem permissão para editar esta transação' });
    }
    
    // Buscar congregação
    const congregacao = await Congregacao.findByPk(transacaoAtual.congregacao_id);
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }
    
    // Usar transação para garantir consistência dos dados
    await transaction(async (client) => {
      // Atualizar saldo da congregação se o status mudou para confirmado ou de confirmado para outro
      if (transacaoAtual.status !== 'CONFIRMADO' && status === 'CONFIRMADO') {
        // Transação confirmada - ajustar saldo
        const valorAjuste = tipo === 'RECEITA' ? parseFloat(valor) : -parseFloat(valor);
        
        await Congregacao.update(
          { 
            dados_financeiros: {
              ...congregacao.dados_financeiros,
              saldo_atual: parseFloat(congregacao.dados_financeiros.saldo_atual || 0) + valorAjuste
            }
          },
          { 
            where: { id: transacaoAtual.congregacao_id },
            transaction: client
          }
        );
      } else if (transacaoAtual.status === 'CONFIRMADO' && status !== 'CONFIRMADO') {
        // Transação desconfirmada - reverter saldo
        const valorAjuste = transacaoAtual.tipo === 'RECEITA' ? -parseFloat(transacaoAtual.valor) : parseFloat(transacaoAtual.valor);
        
        await Congregacao.update(
          { 
            dados_financeiros: {
              ...congregacao.dados_financeiros,
              saldo_atual: parseFloat(congregacao.dados_financeiros.saldo_atual || 0) + valorAjuste
            }
          },
          { 
            where: { id: transacaoAtual.congregacao_id },
            transaction: client
          }
        );
      }
      
      // Atualizar transação
      await Transacao.update(
        {
          tipo,
          categoria,
          subcategoria,
          valor,
          data,
          descricao,
          forma_pagamento,
          status,
          observacoes,
          data_atualizacao: new Date()
        },
        { 
          where: { id },
          transaction: client
        }
      );
    });
    
    // Buscar a transação atualizada
    const transacao = await Transacao.findByPk(id, {
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
        }
      ]
    });
    
    res.status(200).json({
      message: 'Transação atualizada com sucesso',
      transacao
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ message: 'Erro ao atualizar transação', error: error.message });
  }
};

// Controlador para aprovar uma transação
const aprovarTransacao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário tem permissão para aprovar
    if (!['admin_global', 'diretor', 'financeiro'].includes(req.usuario.perfil)) {
      return res.status(403).json({ message: 'Sem permissão para aprovar transações' });
    }
    
    // Buscar transação
    const transacao = await Transacao.findByPk(id);
    if (!transacao) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    // Verificar se já está aprovada
    if (transacao.status === 'CONFIRMADO') {
      return res.status(400).json({ message: 'Transação já está aprovada' });
    }
    
    // Buscar congregação
    const congregacao = await Congregacao.findByPk(transacao.congregacao_id);
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }
    
    // Usar transação para garantir consistência dos dados
    await transaction(async (client) => {
      // Atualizar status e aprovador
      await Transacao.update(
        {
          status: 'CONFIRMADO',
          aprovador_id: req.usuario.id,
          data_aprovacao: new Date(),
          data_atualizacao: new Date()
        },
        { 
          where: { id },
          transaction: client
        }
      );
      
      // Atualizar saldo da congregação
      const valorAjuste = transacao.tipo === 'RECEITA' ? parseFloat(transacao.valor) : -parseFloat(transacao.valor);
      
      await Congregacao.update(
        { 
          dados_financeiros: {
            ...congregacao.dados_financeiros,
            saldo_atual: parseFloat(congregacao.dados_financeiros.saldo_atual || 0) + valorAjuste
          }
        },
        { 
          where: { id: transacao.congregacao_id },
          transaction: client
        }
      );
    });
    
    // Buscar a transação atualizada
    const transacaoAtualizada = await Transacao.findByPk(id, {
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
          as: 'aprovador',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    res.status(200).json({
      message: 'Transação aprovada com sucesso',
      transacao: transacaoAtualizada
    });
  } catch (error) {
    console.error('Erro ao aprovar transação:', error);
    res.status(500).json({ message: 'Erro ao aprovar transação', error: error.message });
  }
};

// Controlador para excluir uma transação
const excluirTransacao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar transação
    const transacao = await Transacao.findByPk(id);
    if (!transacao) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    // Verificar permissões (apenas administradores podem excluir)
    if (!['admin_global', 'diretor'].includes(req.usuario.perfil)) {
      return res.status(403).json({ message: 'Sem permissão para excluir transações' });
    }
    
    // Buscar congregação
    const congregacao = await Congregacao.findByPk(transacao.congregacao_id);
    if (!congregacao) {
      return res.status(404).json({ message: 'Congregação não encontrada' });
    }
    
    // Usar transação para garantir consistência dos dados
    await transaction(async (client) => {
      // Se a transação estava confirmada, ajustar o saldo da congregação
      if (transacao.status === 'CONFIRMADO') {
        const valorAjuste = transacao.tipo === 'RECEITA' ? -parseFloat(transacao.valor) : parseFloat(transacao.valor);
        
        await Congregacao.update(
          { 
            dados_financeiros: {
              ...congregacao.dados_financeiros,
              saldo_atual: parseFloat(congregacao.dados_financeiros.saldo_atual || 0) + valorAjuste
            }
          },
          { 
            where: { id: transacao.congregacao_id },
            transaction: client
          }
        );
      }
      
      // Excluir transação
      await Transacao.destroy({
        where: { id },
        transaction: client
      });
    });
    
    res.status(200).json({ message: 'Transação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    res.status(500).json({ message: 'Erro ao excluir transação', error: error.message });
  }
};

// Controlador para obter resumo financeiro
const getResumoFinanceiro = async (req, res) => {
  try {
    const { congregacao_id, data_inicio, data_fim } = req.query;
    
    // Construir filtro
    const where = {
      status: 'CONFIRMADO'
    };
    
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
    
    // Calcular receitas por categoria
    const receitas = await Transacao.findAll({
      attributes: [
        'categoria',
        [sequelize.fn('SUM', sequelize.col('valor')), 'total']
      ],
      where: {
        ...where,
        tipo: 'RECEITA'
      },
      group: ['categoria'],
      order: [[sequelize.literal('total'), 'DESC']]
    });
    
    // Calcular despesas por categoria
    const despesas = await Transacao.findAll({
      attributes: [
        'categoria',
        [sequelize.fn('SUM', sequelize.col('valor')), 'total']
      ],
      where: {
        ...where,
        tipo: 'DESPESA'
      },
      group: ['categoria'],
      order: [[sequelize.literal('total'), 'DESC']]
    });
    
    // Calcular totais gerais
    const totalReceitas = receitas.reduce((acc, item) => acc + parseFloat(item.dataValues.total), 0);
    const totalDespesas = despesas.reduce((acc, item) => acc + parseFloat(item.dataValues.total), 0);
    const saldo = totalReceitas - totalDespesas;
    
    res.status(200).json({
      resumo: {
        totalReceitas,
        totalDespesas,
        saldo
      },
      receitasPorCategoria: receitas,
      despesasPorCategoria: despesas
    });
  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    res.status(500).json({ message: 'Erro ao gerar resumo financeiro', error: error.message });
  }
};

module.exports = {
  criarTransacao,
  getTransacoes,
  getTransacaoPorId,
  atualizarTransacao,
  aprovarTransacao,
  excluirTransacao,
  getResumoFinanceiro
};
