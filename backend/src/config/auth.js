module.exports = {
  secret: process.env.JWT_SECRET || 'imc-mundial-secret-key-production',
  expiresIn: '1h', // Token expira em 1 hora
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'imc-mundial-refresh-secret-key-production',
  refreshExpiresIn: '7d' // Refresh token expira em 7 dias
};
