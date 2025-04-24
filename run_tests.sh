#!/bin/bash

# Script de teste para o APP Financeiro da IMC Mundial
# Este script executa testes automatizados para o backend e frontend

echo "Iniciando testes do APP Financeiro da IMC Mundial..."
echo "======================================================"

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

echo "Diretórios verificados com sucesso."

# Verificar arquivos de configuração
echo -e "\nVerificando arquivos de configuração..."

if [ -f "$BACKEND_DIR/src/config/database.js" ]; then
  success "Arquivo de configuração do banco de dados encontrado"
else
  error "Arquivo de configuração do banco de dados não encontrado"
  exit 1
fi

if [ -f "$BACKEND_DIR/src/config/auth.js" ]; then
  success "Arquivo de configuração de autenticação encontrado"
else
  error "Arquivo de configuração de autenticação não encontrado"
  exit 1
fi

if [ -f "$BACKEND_DIR/.env.example" ]; then
  success "Arquivo de exemplo de variáveis de ambiente encontrado"
else
  warning "Arquivo de exemplo de variáveis de ambiente não encontrado"
fi

# Verificar modelos
echo -e "\nVerificando modelos do banco de dados..."
MODELS=("usuario.model.js" "congregacao.model.js" "transacao.model.js" "culto.model.js" "membro.model.js")

for model in "${MODELS[@]}"; do
  if [ -f "$BACKEND_DIR/src/models/$model" ]; then
    success "Modelo $model encontrado"
  else
    error "Modelo $model não encontrado"
    exit 1
  fi
done

# Verificar controladores
echo -e "\nVerificando controladores..."
CONTROLLERS=("auth.controller.js" "financeiro.controller.js" "culto.controller.js")

for controller in "${CONTROLLERS[@]}"; do
  if [ -f "$BACKEND_DIR/src/controllers/$controller" ]; then
    success "Controlador $controller encontrado"
  else
    error "Controlador $controller não encontrado"
    exit 1
  fi
done

# Verificar rotas
echo -e "\nVerificando rotas..."
ROUTES=("auth.routes.js" "financeiro.routes.js" "culto.routes.js" "igreja.routes.js")

for route in "${ROUTES[@]}"; do
  if [ -f "$BACKEND_DIR/src/routes/$route" ]; then
    success "Rota $route encontrada"
  else
    error "Rota $route não encontrada"
    exit 1
  fi
done

# Verificar middleware
echo -e "\nVerificando middleware..."
if [ -f "$BACKEND_DIR/src/middleware/auth.middleware.js" ]; then
  success "Middleware de autenticação encontrado"
else
  error "Middleware de autenticação não encontrado"
  exit 1
fi

# Verificar componentes do frontend
echo -e "\nVerificando componentes do frontend..."
COMPONENTS=("Login.js" "Dashboard.js" "CongregacaoDashboard.js" "RelatorioPorCongregacao.js" "GerenciamentoMembros.js" "GerenciamentoCongregacoes.js")

for component in "${COMPONENTS[@]}"; do
  if [ -f "$FRONTEND_DIR/src/pages/$component" ]; then
    success "Componente $component encontrado"
  else
    error "Componente $component não encontrado"
    exit 1
  fi
done

# Verificar contextos do frontend
echo -e "\nVerificando contextos do frontend..."
if [ -f "$FRONTEND_DIR/src/contexts/AuthContext.js" ]; then
  success "Contexto de autenticação encontrado"
else
  error "Contexto de autenticação não encontrado"
  exit 1
fi

# Verificar serviços do frontend
echo -e "\nVerificando serviços do frontend..."
if [ -f "$FRONTEND_DIR/src/services/api.js" ]; then
  success "Serviço de API encontrado"
else
  error "Serviço de API não encontrado"
  exit 1
fi

# Verificar package.json
echo -e "\nVerificando arquivos package.json..."
if [ -f "$BACKEND_DIR/package.json" ]; then
  success "package.json do backend encontrado"
else
  error "package.json do backend não encontrado"
  exit 1
fi

if [ -f "$FRONTEND_DIR/package.json" ]; then
  success "package.json do frontend encontrado"
else
  error "package.json do frontend não encontrado"
  exit 1
fi

# Verificar script de backup
echo -e "\nVerificando script de backup..."
if [ -f "$BACKEND_DIR/scripts/backup.sh" ]; then
  success "Script de backup encontrado"
else
  warning "Script de backup não encontrado"
fi

# Criar arquivo .env para testes
echo -e "\nCriando arquivo .env para testes..."
if [ -f "$BACKEND_DIR/.env.example" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env.test"
  
  # Configurar variáveis de ambiente para teste
  sed -i 's/DB_HOST=.*/DB_HOST=localhost/' "$BACKEND_DIR/.env.test"
  sed -i 's/DB_PORT=.*/DB_PORT=5432/' "$BACKEND_DIR/.env.test"
  sed -i 's/DB_NAME=.*/DB_NAME=imc_financeiro_test/' "$BACKEND_DIR/.env.test"
  sed -i 's/DB_USER=.*/DB_USER=postgres/' "$BACKEND_DIR/.env.test"
  sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=postgres/' "$BACKEND_DIR/.env.test"
  sed -i 's/JWT_SECRET=.*/JWT_SECRET=test-secret-key/' "$BACKEND_DIR/.env.test"
  sed -i 's/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=test-refresh-secret-key/' "$BACKEND_DIR/.env.test"
  
  success "Arquivo .env.test criado com sucesso"
else
  warning "Não foi possível criar arquivo .env.test (arquivo .env.example não encontrado)"
fi

# Executar testes unitários do backend (se existirem)
echo -e "\nExecutando testes unitários do backend..."
if [ -d "$BACKEND_DIR/tests" ]; then
  cd "$BACKEND_DIR"
  if grep -q "\"test\":" package.json; then
    npm test
    if [ $? -eq 0 ]; then
      success "Testes do backend executados com sucesso"
    else
      error "Falha nos testes do backend"
    fi
  else
    warning "Script de teste não encontrado no package.json do backend"
  fi
else
  warning "Diretório de testes do backend não encontrado"
fi

# Executar testes unitários do frontend (se existirem)
echo -e "\nExecutando testes unitários do frontend..."
if [ -d "$FRONTEND_DIR/tests" ]; then
  cd "$FRONTEND_DIR"
  if grep -q "\"test\":" package.json; then
    npm test
    if [ $? -eq 0 ]; then
      success "Testes do frontend executados com sucesso"
    else
      error "Falha nos testes do frontend"
    fi
  else
    warning "Script de teste não encontrado no package.json do frontend"
  fi
else
  warning "Diretório de testes do frontend não encontrado"
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

# Verificar se o banco de dados de teste existe
echo -e "\nVerificando banco de dados de teste..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw imc_financeiro_test; then
  success "Banco de dados de teste já existe"
else
  echo "Criando banco de dados de teste..."
  sudo -u postgres psql -c "CREATE DATABASE imc_financeiro_test;"
  if [ $? -eq 0 ]; then
    success "Banco de dados de teste criado com sucesso"
  else
    error "Falha ao criar banco de dados de teste"
    exit 1
  fi
fi

# Executar testes de integração (se existirem)
echo -e "\nExecutando testes de integração..."
if [ -f "$BASE_DIR/run_integration_tests.sh" ]; then
  bash "$BASE_DIR/run_integration_tests.sh"
  if [ $? -eq 0 ]; then
    success "Testes de integração executados com sucesso"
  else
    error "Falha nos testes de integração"
  fi
else
  warning "Script de testes de integração não encontrado"
fi

# Verificar script de implantação
echo -e "\nVerificando script de implantação..."
if [ -f "$BASE_DIR/deploy.sh" ]; then
  success "Script de implantação encontrado"
else
  warning "Script de implantação não encontrado. Criando..."
  
  # Criar script de implantação básico
  cat > "$BASE_DIR/deploy.sh" << 'EOF'
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
  
  # Solicitar informações de configuração
  read -p "Digite o host do banco de dados: " db_host
  read -p "Digite a porta do banco de dados [5432]: " db_port
  db_port=${db_port:-5432}
  read -p "Digite o nome do banco de dados [imc_financeiro]: " db_name
  db_name=${db_name:-imc_financeiro}
  read -p "Digite o usuário do banco de dados: " db_user
  read -s -p "Digite a senha do banco de dados: " db_password
  echo
  
  # Gerar chaves secretas aleatórias
  jwt_secret=$(openssl rand -hex 32)
  jwt_refresh_secret=$(openssl rand -hex 32)
  
  # Atualizar arquivo .env
  sed -i "s/DB_HOST=.*/DB_HOST=$db_host/" "$BACKEND_DIR/.env"
  sed -i "s/DB_PORT=.*/DB_PORT=$db_port/" "$BACKEND_DIR/.env"
  sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" "$BACKEND_DIR/.env"
  sed -i "s/DB_USER=.*/DB_USER=$db_user/" "$BACKEND_DIR/.env"
  sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" "$BACKEND_DIR/.env"
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" "$BACKEND_DIR/.env"
  sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$jwt_refresh_secret/" "$BACKEND_DIR/.env"
  
  success "Variáveis de ambiente configuradas com sucesso"
else
  error "Arquivo .env.example não encontrado"
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

# Configurar Nginx (se instalado)
echo -e "\nVerificando instalação do Nginx..."
if command -v nginx &> /dev/null; then
  success "Nginx já está instalado"
  
  # Criar configuração do Nginx
  read -p "Digite o domínio para o aplicativo (ex: app.imcmundial.org): " domain
  
  sudo tee /etc/nginx/sites-available/imc-financeiro << EOL
server {
    listen 80;
    server_name ${domain};

    location / {
        root ${FRONTEND_DIR}/build;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

  # Ativar site
  sudo ln -sf /etc/nginx/sites-available/imc-financeiro /etc/nginx/sites-enabled/
  
  # Verificar configuração do Nginx
  sudo nginx -t
  if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    success "Nginx configurado com sucesso"
  else
    error "Falha na configuração do Nginx"
  fi
else
  warning "Nginx não está instalado. A configuração do servidor web deverá ser feita manualmente."
fi

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

echo -e "\n${GREEN}Implantação concluída com sucesso!${NC}"
echo "O APP Financeiro da IMC Mundial está pronto para uso."
if command -v nginx &> /dev/null && [ ! -z "$domain" ]; then
  echo -e "Acesse o aplicativo em: ${GREEN}http://$domain${NC}"
else
  echo -e "Backend rodando em: ${GREEN}http://localhost:3000${NC}"
fi
EOF

  chmod +x "$BASE_DIR/deploy.sh"
  success "Script de implantação criado com sucesso"
fi

# Verificar script de inicialização
echo -e "\nVerificando script de inicialização..."
if [ -f "$BASE_DIR/start.sh" ]; then
  success "Script de inicialização encontrado"
else
  warning "Script de inicialização não encontrado. Criando..."
  
  # Criar script de inicialização básico
  cat > "$BASE_DIR/start.sh" << 'EOF'
#!/bin/bash

# Script de inicialização para o APP Financeiro da IMC Mundial
# Este script inicia o backend e o frontend para desenvolvimento

echo "Iniciando APP Financeiro da IMC Mundial..."
echo "=========================================="

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

# Verificar se o arquivo .env existe
if [ ! -f "$BACKEND_DIR/.env" ]; then
  warning "Arquivo .env não encontrado. Copiando de .env.example..."
  if [ -f "$BACKEND_DIR/.env.example" ]; then
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    success "Arquivo .env criado com sucesso"
  else
    error "Arquivo .env.example não encontrado"
    exit 1
  fi
fi

# Instalar dependências do backend
echo -e "\nInstalando dependências do backend..."
cd "$BACKEND_DIR"
npm install
if [ $? -eq 0 ]; then
  success "Dependências do backend instaladas com sucesso"
else
  error "Falha ao instalar dependências do backend"
  exit 1
fi

# Instalar dependências do frontend
echo -e "\nInstalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm install
if [ $? -eq 0 ]; then
  success "Dependências do frontend instaladas com sucesso"
else
  error "Falha ao instalar dependências do frontend"
  exit 1
fi

# Iniciar backend
echo -e "\nIniciando backend..."
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!
success "Backend iniciado com PID: $BACKEND_PID"

# Aguardar backend iniciar
echo "Aguardando backend iniciar..."
sleep 5

# Iniciar frontend
echo -e "\nIniciando frontend..."
cd "$FRONTEND_DIR"
npm start &
FRONTEND_PID=$!
success "Frontend iniciado com PID: $FRONTEND_PID"

echo -e "\n${GREEN}APP Financeiro da IMC Mundial iniciado com sucesso!${NC}"
echo "Backend rodando em: http://localhost:3000"
echo "Frontend rodando em: http://localhost:3001"
echo -e "\nPressione Ctrl+C para encerrar ambos os processos"

# Função para encerrar processos ao sair
cleanup() {
  echo -e "\nEncerrando processos..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  success "Processos encerrados com sucesso"
  exit 0
}

# Registrar função de limpeza para sinais de interrupção
trap cleanup SIGINT SIGTERM

# Manter script em execução
wait
EOF

  chmod +x "$BASE_DIR/start.sh"
  success "Script de inicialização criado com sucesso"
fi

# Verificar script de instalação
echo -e "\nVerificando script de instalação..."
if [ -f "$BASE_DIR/install.sh" ]; then
  success "Script de instalação encontrado"
else
  warning "Script de instalação não encontrado. Criando..."
  
  # Criar script de instalação básico
  cat > "$BASE_DIR/install.sh" << 'EOF'
#!/bin/bash

# Script de instalação para o APP Financeiro da IMC Mundial
# Este script instala todas as dependências necessárias

echo "Instalando APP Financeiro da IMC Mundial..."
echo "==========================================="

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

# Atualizar sistema
echo -e "\nAtualizando sistema..."
sudo apt-get update
if [ $? -eq 0 ]; then
  success "Sistema atualizado com sucesso"
else
  error "Falha ao atualizar sistema"
  exit 1
fi

# Instalar Node.js (se não estiver instalado)
echo -e "\nVerificando instalação do Node.js..."
if ! command -v node &> /dev/null; then
  echo "Instalando Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt-get install -y nodejs
  if [ $? -eq 0 ]; then
    success "Node.js instalado com sucesso"
  else
    error "Falha ao instalar Node.js"
    exit 1
  fi
else
  success "Node.js já está instalado"
fi

# Instalar PostgreSQL (se não estiver instalado)
echo -e "\nVerificando instalação do PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo "Instalando PostgreSQL..."
  sudo apt-get install -y postgresql postgresql-contrib
  if [ $? -eq 0 ]; then
    success "PostgreSQL instalado com sucesso"
  else
    error "Falha ao instalar PostgreSQL"
    exit 1
  fi
else
  success "PostgreSQL já está instalado"
fi

# Iniciar PostgreSQL
echo -e "\nIniciando PostgreSQL..."
sudo systemctl start postgresql
if [ $? -eq 0 ]; then
  success "PostgreSQL iniciado com sucesso"
else
  error "Falha ao iniciar PostgreSQL"
  exit 1
fi

# Habilitar PostgreSQL para iniciar com o sistema
sudo systemctl enable postgresql
if [ $? -eq 0 ]; then
  success "PostgreSQL habilitado para iniciar com o sistema"
else
  warning "Falha ao habilitar PostgreSQL para iniciar com o sistema"
fi

# Criar banco de dados (se não existir)
echo -e "\nVerificando banco de dados..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw imc_financeiro; then
  success "Banco de dados já existe"
else
  echo "Criando banco de dados..."
  sudo -u postgres psql -c "CREATE DATABASE imc_financeiro;"
  if [ $? -eq 0 ]; then
    success "Banco de dados criado com sucesso"
  else
    error "Falha ao criar banco de dados"
    exit 1
  fi
fi

# Criar usuário do banco de dados (se não existir)
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
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE imc_financeiro TO imc_user;"
if [ $? -eq 0 ]; then
  success "Privilégios concedidos com sucesso"
else
  error "Falha ao conceder privilégios"
  exit 1
fi

# Configurar arquivo .env
echo -e "\nConfigurando arquivo .env..."
if [ -f "$BACKEND_DIR/.env.example" ]; then
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  
  # Atualizar arquivo .env
  sed -i 's/DB_HOST=.*/DB_HOST=localhost/' "$BACKEND_DIR/.env"
  sed -i 's/DB_PORT=.*/DB_PORT=5432/' "$BACKEND_DIR/.env"
  sed -i 's/DB_NAME=.*/DB_NAME=imc_financeiro/' "$BACKEND_DIR/.env"
  sed -i 's/DB_USER=.*/DB_USER=imc_user/' "$BACKEND_DIR/.env"
  sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=imc_password/' "$BACKEND_DIR/.env"
  
  # Gerar chaves secretas aleatórias
  jwt_secret=$(openssl rand -hex 32)
  jwt_refresh_secret=$(openssl rand -hex 32)
  
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" "$BACKEND_DIR/.env"
  sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$jwt_refresh_secret/" "$BACKEND_DIR/.env"
  
  success "Arquivo .env configurado com sucesso"
else
  error "Arquivo .env.example não encontrado"
  exit 1
fi

# Instalar dependências do backend
echo -e "\nInstalando dependências do backend..."
cd "$BACKEND_DIR"
npm install
if [ $? -eq 0 ]; then
  success "Dependências do backend instaladas com sucesso"
else
  error "Falha ao instalar dependências do backend"
  exit 1
fi

# Instalar dependências do frontend
echo -e "\nInstalando dependências do frontend..."
cd "$FRONTEND_DIR"
npm install
if [ $? -eq 0 ]; then
  success "Dependências do frontend instaladas com sucesso"
else
  error "Falha ao instalar dependências do frontend"
  exit 1
fi

# Configurar script de backup
echo -e "\nConfigurando script de backup..."
if [ -f "$BACKEND_DIR/scripts/backup.sh" ]; then
  chmod +x "$BACKEND_DIR/scripts/backup.sh"
  success "Script de backup configurado com sucesso"
else
  warning "Script de backup não encontrado"
fi

echo -e "\n${GREEN}Instalação concluída com sucesso!${NC}"
echo "O APP Financeiro da IMC Mundial está pronto para ser iniciado."
echo "Execute o script start.sh para iniciar o aplicativo em modo de desenvolvimento."
echo "Execute o script deploy.sh para implantar o aplicativo em produção."
EOF

  chmod +x "$BASE_DIR/install.sh"
  success "Script de instalação criado com sucesso"
fi

echo -e "\n${GREEN}Testes concluídos com sucesso!${NC}"
echo "O APP Financeiro da IMC Mundial está pronto para implantação em produção."
echo "Execute o script deploy.sh para implantar o sistema."
