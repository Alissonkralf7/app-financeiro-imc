const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');
const bcrypt = require('bcrypt');
const authConfig = require('../config/auth');

const Usuario = sequelize.define('usuario', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  perfil: {
    type: DataTypes.ENUM('admin_global', 'diretor', 'financeiro', 'pastor', 'obreiro', 'membro'),
    defaultValue: 'membro',
    allowNull: false
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acesso: {
    type: DataTypes.DATE
  },
  telefone: {
    type: DataTypes.STRING
  },
  foto_url: {
    type: DataTypes.STRING
  },
  data_criacao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao',
  tableName: 'usuarios',
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha) {
        usuario.senha = await bcrypt.hash(usuario.senha, authConfig.saltRounds);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('senha')) {
        usuario.senha = await bcrypt.hash(usuario.senha, authConfig.saltRounds);
      }
    }
  }
});

// Método para comparar senhas
Usuario.prototype.compararSenha = async function(senhaFornecida) {
  return await bcrypt.compare(senhaFornecida, this.senha);
};

// Método para retornar usuário sem a senha
Usuario.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.senha;
  return values;
};

module.exports = Usuario;
