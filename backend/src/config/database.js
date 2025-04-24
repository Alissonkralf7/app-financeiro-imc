const { Pool } = require('pg');
require('dotenv').config();

// Configuração do PostgreSQL
const pgPool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'imc_financeiro',
  password: process.env.PG_PASSWORD || 'postgres',
  port: process.env.PG_PORT || 5432,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
});

pgPool.on('connect', () => {
  console.log('PostgreSQL conectado com sucesso');
});

pgPool.on('error', (err) => {
  console.error('Erro na conexão com PostgreSQL:', err.message);
});

// Função para executar queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pgPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erro ao executar query:', error.message);
    throw error;
  }
};

// Função para executar transações
const transaction = async (callback) => {
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na transação:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pgPool,
  query,
  transaction
};
