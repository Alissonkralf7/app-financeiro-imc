const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Membro = sequelize.define('membro', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data_nascimento: {
    type: DataTypes.DATEONLY
  },
  genero: {
    type: DataTypes.ENUM('MASCULINO', 'FEMININO', 'OUTRO')
  },
  estado_civil: {
    type: DataTypes.ENUM('SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'OUTRO')
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
      pais: 'Brasil'
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
  data_conversao: {
    type: DataTypes.DATEONLY
  },
  data_batismo: {
    type: DataTypes.DATEONLY
  },
  cargo_ministerial: {
    type: DataTypes.ENUM('MEMBRO', 'OBREIRO', 'DIACONO', 'EVANGELISTA', 'PASTOR', 'OUTRO')
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  observacoes: {
    type: DataTypes.TEXT
  },
  foto_url: {
    type: DataTypes.STRING
  },
  dizimista: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'data_registro',
  updatedAt: 'data_atualizacao',
  tableName: 'membros',
  indexes: [
    {
      fields: ['congregacao_id'],
      name: 'idx_membros_congregacao'
    },
    {
      fields: ['cargo_ministerial'],
      name: 'idx_membros_cargo'
    },
    {
      fields: ['ativo'],
      name: 'idx_membros_ativo'
    }
  ]
});

module.exports = Membro;
