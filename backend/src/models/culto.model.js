const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Culto = sequelize.define('culto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tipo: {
    type: DataTypes.ENUM('CULTO_DOMINGO', 'CULTO_ORACAO', 'CULTO_ENSINO', 'CULTO_JOVENS', 'CULTO_CRIANCAS', 'EVENTO_ESPECIAL', 'CAMPANHA', 'CONFERENCIA', 'OUTRO'),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false
  },
  horario_inicio: {
    type: DataTypes.STRING,
    allowNull: false
  },
  horario_fim: {
    type: DataTypes.STRING
  },
  tema: {
    type: DataTypes.STRING
  },
  descricao: {
    type: DataTypes.TEXT
  },
  participantes: {
    type: DataTypes.JSONB,
    defaultValue: {
      total: 0,
      homens: 0,
      mulheres: 0,
      jovens: 0,
      criancas: 0,
      visitantes: 0
    }
  },
  conversoes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  batismos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  financeiro: {
    type: DataTypes.JSONB,
    defaultValue: {
      dizimos: 0,
      ofertas: 0,
      doacoes: 0,
      campanhas: 0
    }
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  fotos: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  data_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'data_registro',
  updatedAt: 'data_atualizacao',
  tableName: 'cultos',
  indexes: [
    {
      fields: ['congregacao_id', 'data'],
      name: 'idx_cultos_congregacao_data'
    },
    {
      fields: ['tipo'],
      name: 'idx_cultos_tipo'
    }
  ]
});

module.exports = Culto;
