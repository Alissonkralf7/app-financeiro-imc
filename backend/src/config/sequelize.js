const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuração do Sequelize para PostgreSQL
const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'imc_financeiro',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || 'postgres',
  {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.PG_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false,
      charset: 'utf8',
      dialectOptions: {
        collate: 'utf8_general_ci'
      }
    }
  }
);

// Testar conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o PostgreSQL estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao PostgreSQL:', error);
  }
};

// Sincronizar modelos com o banco de dados
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`Modelos sincronizados ${force ? '(tabelas recriadas)' : ''}`);
  } catch (error) {
    console.error('Erro ao sincronizar modelos:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};
