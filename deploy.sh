#!/bin/bash

# Script de implantação para o APP Financeiro da IMC Mundial
# Este script prepara o sistema para implantação em produção

echo "Preparando implantação do APP Financeiro da IMC Mundial..."
echo "=========================================================="

# Definir diretório base
BASE_DIR="/home/ubuntu/app_financeiro_imc_prod"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Função para exibir mensagens de sucesso
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Função para exibir mensagens de erro
error() {
  echo -e "${RED}✗ $1${NC}"
}

# Função para exibir mensagens de aviso
warning() {
  echo -e "${YELLOW}! $1${NC}"
}

# Verificar se os diretórios existem
if [ ! -d "$BACKEND_DIR" ]; then
  error "Diretório do backend não encontrado: $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  error "Diretório do frontend não encontrado: $FRONTEND_DIR"
  exit 1
fi

# Executar testes antes da implantação
echo -e "\nExecutando testes antes da implantação..."
if [ -f "$BASE_DIR/run_tests.sh" ]; then
  bash "$BASE_DIR/run_tests.sh"
  if [ $? -ne 0 ]; then
    error "Falha nos testes. Corrigir erros antes de prosseguir com a implantação."
    exit 1
  fi
  success "Testes executados com sucesso"
else
  warning "Script de testes não encontrado. Pulando etapa de testes."
fi

# Instalar dependências do backend
echo -e "\nInstalando dependências do backend..."
cd "$BACKEND_DIR"
npm install --production
if [ $? -eq 0 ]; then
  success "Dependências do backend instaladas com sucesso"
else
  error "Falha ao instalar dependências do backend"
  exit 1
fi

# Instalar dependências do frontend
echo -e "\nInstalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm install --production
if [ $? -eq 0 ]; then
  success "Dependências do frontend instaladas com sucesso"
else
  error "Falha ao instalar dependências do frontend"
  exit 1
fi

# Construir o frontend
echo -e "\nConstruindo o frontend..."
cd "$FRONTEND_DIR"
npm run build
if [ $? -eq 0 ]; then
  success "Frontend construído com sucesso"
else
  error "Falha ao construir o frontend"
  exit 1
fi

# Configurar variáveis de ambiente de produção
echo -e "\nConfigurando variáveis de ambiente de produção..."
if [ -f "$BACKEND_DIR/.env.example" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  
  # Configurar variáveis de ambiente para produção
  sed -i 's/DB_HOST=.*/DB_HOST=localhost/' "$BACKEND_DIR/.env"
  sed -i 's/DB_PORT=.*/DB_PORT=5432/' "$BACKEND_DIR/.env"
  sed -i 's/DB_NAME=.*/DB_NAME=imc_financeiro_prod/' "$BACKEND_DIR/.env"
  sed -i 's/DB_USER=.*/DB_USER=imc_user/' "$BACKEND_DIR/.env"
  sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=imc_password/' "$BACKEND_DIR/.env"
  
  # Gerar chaves secretas aleatórias
  jwt_secret=$(openssl rand -hex 32)
  jwt_refresh_secret=$(openssl rand -hex 32)
  
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" "$BACKEND_DIR/.env"
  sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$jwt_refresh_secret/" "$BACKEND_DIR/.env"
  
  success "Variáveis de ambiente configuradas com sucesso"
else
  error "Arquivo .env.example não encontrado"
  exit 1
fi

# Verificar se o PostgreSQL está instalado
echo -e "\nVerificando instalação do PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
  success "PostgreSQL está instalado"
else
  warning "PostgreSQL não está instalado. Instalando..."
  sudo apt-get update
  sudo apt-get install -y postgresql postgresql-contrib
  if [ $? -eq 0 ]; then
    success "PostgreSQL instalado com sucesso"
  else
    error "Falha ao instalar PostgreSQL"
    exit 1
  fi
fi

# Verificar se o banco de dados de produção existe
echo -e "\nVerificando banco de dados de produção..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw imc_financeiro_prod; then
  success "Banco de dados de produção já existe"
else
  echo "Criando banco de dados de produção..."
  sudo -u postgres psql -c "CREATE DATABASE imc_financeiro_prod;"
  if [ $? -eq 0 ]; then
    success "Banco de dados de produção criado com sucesso"
  else
    error "Falha ao criar banco de dados de produção"
    exit 1
  fi
fi

# Verificar se o usuário do banco de dados existe
echo -e "\nVerificando usuário do banco de dados..."
if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='imc_user'" | grep -q 1; then
  success "Usuário do banco de dados já existe"
else
  echo "Criando usuário do banco de dados..."
  sudo -u postgres psql -c "CREATE USER imc_user WITH PASSWORD 'imc_password';"
  if [ $? -eq 0 ]; then
    success "Usuário do banco de dados criado com sucesso"
  else
    error "Falha ao criar usuário do banco de dados"
    exit 1
  fi
fi

# Conceder privilégios ao usuário
echo -e "\nConcedendo privilégios ao usuário..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE imc_financeiro_prod TO imc_user;"
if [ $? -eq 0 ]; then
  success "Privilégios concedidos com sucesso"
else
  error "Falha ao conceder privilégios"
  exit 1
fi

# Configurar script de backup
echo -e "\nConfigurando script de backup..."
if [ -f "$BACKEND_DIR/scripts/backup.sh" ]; then
  chmod +x "$BACKEND_DIR/scripts/backup.sh"
  
  # Adicionar ao crontab para execução semanal (domingo às 2h da manhã)
  (crontab -l 2>/dev/null; echo "0 2 * * 0 $BACKEND_DIR/scripts/backup.sh") | crontab -
  
  success "Script de backup configurado para execução semanal"
else
  warning "Script de backup não encontrado"
fi

# Configurar PM2 para gerenciamento de processos
echo -e "\nConfigurando PM2 para gerenciamento de processos..."
if ! command -v pm2 &> /dev/null; then
  echo "Instalando PM2..."
  npm install -g pm2
  if [ $? -eq 0 ]; then
    success "PM2 instalado com sucesso"
  else
    error "Falha ao instalar PM2"
    exit 1
  fi
else
  success "PM2 já está instalado"
fi

# Criar arquivo de configuração do PM2
cat > "$BASE_DIR/ecosystem.config.js" << 'EOL'
module.exports = {
  apps: [
    {
      name: 'imc-financeiro-backend',
      script: './backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
EOL

success "Arquivo de configuração do PM2 criado com sucesso"

# Iniciar aplicação com PM2
echo -e "\nIniciando aplicação com PM2..."
cd "$BASE_DIR"
pm2 start ecosystem.config.js
if [ $? -eq 0 ]; then
  pm2 save
  success "Aplicação iniciada com sucesso"
else
  error "Falha ao iniciar aplicação"
  exit 1
fi

# Criar usuário administrador padrão
echo -e "\nCriando usuário administrador padrão..."
cd "$BACKEND_DIR"
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createAdminUser() {
  try {
    // Verificar se o usuário já existe
    const checkResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', ['admin@imcmundial.org']);
    
    if (checkResult.rows.length > 0) {
      console.log('Usuário administrador já existe');
      return;
    }
    
    // Criptografar senha
    const salt = await bcrypt.genSalt(10);
    const senha = await bcrypt.hash('admin123', salt);
    
    // Inserir usuário administrador
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo, data_criacao) VALUES ($1, $2, $3, $4, $5, $6)',
      ['Administrador Global', 'admin@imcmundial.org', senha, 'admin_global', true, new Date()]
    );
    
    console.log('Usuário administrador criado com sucesso');
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
  } finally {
    pool.end();
  }
}

createAdminUser();
"

if [ $? -eq 0 ]; then
  success "Usuário administrador criado com sucesso"
else
  warning "Falha ao criar usuário administrador. Você precisará criar manualmente."
fi

echo -e "\n${GREEN}Implantação concluída com sucesso!${NC}"
echo "O APP Financeiro da IMC Mundial está pronto para uso."
echo -e "Backend rodando em: ${GREEN}http://localhost:3000${NC}"
echo -e "Frontend disponível em: ${GREEN}$(pwd)/frontend/build/index.html${NC}"
echo -e "\nCredenciais de acesso:"
echo -e "Email: ${GREEN}admin@imcmundial.org${NC}"
echo -e "Senha: ${GREEN}admin123${NC}"
echo -e "\n${YELLOW}IMPORTANTE: Altere a senha do administrador após o primeiro acesso!${NC}"
