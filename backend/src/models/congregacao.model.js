const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Congregacao = sequelize.define('congregacao', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endereco: {
    type: DataTypes.JSONB,
    defaultValue: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      pais: 'Brasil',
      coordenadas: {
        latitude: null,
        longitude: null
      }
    }
  },
  telefone: {
    type: DataTypes.STRING
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true
    }
  },
  tipo: {
    type: DataTypes.ENUM('SEDE_MUNDIAL', 'CONGREGACAO', 'MISSAO'),
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  membros_total: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  membros_ativos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dados_financeiros: {
    type: DataTypes.JSONB,
    defaultValue: {
      conta_bancaria: {
        banco: '',
        agencia: '',
        conta: '',
        tipo: ''
      },
      saldo_atual: 0
    }
  },
  data_criacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao',
  tableName: 'congregacoes'
});

module.exports = Congregacao;
