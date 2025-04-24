const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Transacao = sequelize.define('transacao', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.ENUM('RECEITA', 'DESPESA', 'TRANSFERENCIA'),
    allowNull: false
  },
  categoria: {
    type: DataTypes.ENUM(
      // Receitas
      'DIZIMO', 'OFERTA', 'DOACAO', 'CAMPANHA', 'EVENTO', 'OUTRAS_RECEITAS',
      // Despesas
      'ALUGUEL', 'AGUA', 'LUZ', 'INTERNET', 'TELEFONE', 'MATERIAL', 'MANUTENCAO', 
      'SALARIO', 'MISSOES', 'EVENTOS', 'IMPOSTOS', 'OUTRAS_DESPESAS'
    ),
    allowNull: false
  },
  subcategoria: {
    type: DataTypes.STRING
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  forma_pagamento: {
    type: DataTypes.ENUM('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'BOLETO', 'CHEQUE', 'OUTRO'),
    allowNull: false
  },
  comprovante_url: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'ESTORNADO'),
    defaultValue: 'PENDENTE'
  },
  recorrente: {
    type: DataTypes.JSONB,
    defaultValue: {
      is_recorrente: false,
      frequencia: null,
      data_inicio: null,
      data_fim: null
    }
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  metadados: {
    type: DataTypes.JSONB,
    defaultValue: {
      ip_registro: null,
      dispositivo: null,
      localizacao: null
    }
  },
  data_aprovacao: {
    type: DataTypes.DATE
  },
  data_criacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao',
  tableName: 'transacoes',
  indexes: [
    {
      fields: ['congregacao_id', 'data'],
      name: 'idx_transacoes_congregacao_data'
    },
    {
      fields: ['tipo', 'categoria'],
      name: 'idx_transacoes_tipo_categoria'
    },
    {
      fields: ['status'],
      name: 'idx_transacoes_status'
    }
  ]
});

module.exports = Transacao;
