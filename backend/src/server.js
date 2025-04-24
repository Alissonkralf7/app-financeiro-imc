const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Importar configurações
const { testConnection } = require('./config/sequelize');

// Importar rotas
const authRoutes = require('./routes/auth.routes');
const financeiroRoutes = require('./routes/financeiro.routes');
const cultoRoutes = require('./routes/culto.routes');
const igrejaRoutes = require('./routes/igreja.routes');

// Inicializar app
const app = express();

// Configurar middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar logs
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, '../logs/access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// Testar conexão com o banco de dados
testConnection();

// Rota de status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date()
  });
});

// Configurar rotas
app.use('/api/auth', authRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/cultos', cultoRoutes);
app.use('/api/congregacoes', igrejaRoutes);

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
