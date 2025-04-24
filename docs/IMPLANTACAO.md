# Documentação de Implantação do APP Financeiro da IMC Mundial

## Visão Geral

Este documento fornece instruções detalhadas para a implantação do APP Financeiro da IMC Mundial em um servidor de produção. O sistema foi desenvolvido com as seguintes tecnologias:

- **Backend**: Node.js com Express.js
- **Frontend**: React.js com Material-UI
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT com diferentes níveis de acesso

## Requisitos do Sistema

- Node.js 16.x ou superior
- PostgreSQL 14.x ou superior
- NPM 8.x ou superior
- Servidor Linux (Ubuntu 20.04 ou superior recomendado)
- Mínimo de 2GB de RAM
- Mínimo de 20GB de espaço em disco

## Estrutura de Diretórios

```
app_financeiro_imc_prod/
├── backend/               # Código do servidor
│   ├── src/               # Código fonte
│   │   ├── config/        # Configurações
│   │   ├── controllers/   # Controladores
│   │   ├── middleware/    # Middleware
│   │   ├── models/        # Modelos de dados
│   │   ├── routes/        # Rotas da API
│   │   ├── utils/         # Utilitários
│   │   └── server.js      # Ponto de entrada
│   ├── scripts/           # Scripts de utilidade
│   └── package.json       # Dependências
├── frontend/              # Código do cliente
│   ├── src/               # Código fonte
│   │   ├── assets/        # Recursos estáticos
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contextos React
│   │   ├── pages/         # Páginas
│   │   ├── services/      # Serviços de API
│   │   ├── styles/        # Estilos
│   │   └── utils/         # Utilitários
│   └── package.json       # Dependências
├── docs/                  # Documentação
├── deploy.sh              # Script de implantação
├── install.sh             # Script de instalação
├── start.sh               # Script de inicialização
└── run_tests.sh           # Script de testes
```

## Passos para Implantação

### 1. Preparação do Servidor

1. Atualize o sistema:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Instale o Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Instale o PostgreSQL:
   ```bash
   sudo apt-get install -y postgresql postgresql-contrib
   ```

4. Inicie o PostgreSQL:
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

### 2. Configuração do Banco de Dados

1. Acesse o PostgreSQL:
   ```bash
   sudo -u postgres psql
   ```

2. Crie um banco de dados e um usuário:
   ```sql
   CREATE DATABASE imc_financeiro_prod;
   CREATE USER imc_user WITH PASSWORD 'sua_senha_segura';
   GRANT ALL PRIVILEGES ON DATABASE imc_financeiro_prod TO imc_user;
   \q
   ```

### 3. Instalação do Sistema

1. Extraia o arquivo compactado:
   ```bash
   unzip app_financeiro_imc_prod.zip -d /opt/
   cd /opt/app_financeiro_imc_prod
   ```

2. Torne os scripts executáveis:
   ```bash
   chmod +x install.sh deploy.sh start.sh run_tests.sh
   ```

3. Execute o script de instalação:
   ```bash
   ./install.sh
   ```

   Este script irá:
   - Instalar todas as dependências necessárias
   - Configurar o arquivo .env com as informações do banco de dados
   - Preparar o ambiente para execução

### 4. Configuração do Ambiente

1. Edite o arquivo de configuração do backend:
   ```bash
   nano backend/.env
   ```

2. Atualize as seguintes variáveis:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=imc_financeiro_prod
   DB_USER=imc_user
   DB_PASSWORD=sua_senha_segura
   JWT_SECRET=sua_chave_secreta_jwt
   JWT_REFRESH_SECRET=sua_chave_secreta_refresh
   ```

### 5. Implantação

1. Execute o script de implantação:
   ```bash
   ./deploy.sh
   ```

   Este script irá:
   - Construir o frontend para produção
   - Configurar o PM2 para gerenciamento de processos
   - Iniciar a aplicação
   - Criar um usuário administrador padrão

### 6. Configuração do Servidor Web (Nginx)

1. Instale o Nginx:
   ```bash
   sudo apt-get install -y nginx
   ```

2. Crie um arquivo de configuração para o site:
   ```bash
   sudo nano /etc/nginx/sites-available/imc-financeiro
   ```

3. Adicione a seguinte configuração:
   ```nginx
   server {
       listen 80;
       server_name seu_dominio.com;

       location / {
           root /opt/app_financeiro_imc_prod/frontend/build;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Ative o site e reinicie o Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/imc-financeiro /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 7. Configuração de SSL (Opcional, mas Recomendado)

1. Instale o Certbot:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   ```

2. Obtenha um certificado SSL:
   ```bash
   sudo certbot --nginx -d seu_dominio.com
   ```

3. Siga as instruções na tela para completar a configuração.

## Acesso ao Sistema

Após a implantação, você pode acessar o sistema usando as seguintes credenciais:

- **URL**: http://seu_dominio.com (ou https:// se SSL estiver configurado)
- **Email**: admin@imcmundial.org
- **Senha**: admin123

**IMPORTANTE**: Altere a senha do administrador após o primeiro acesso!

## Backup do Sistema

O sistema está configurado para realizar backups automáticos semanais. Os backups são armazenados no diretório `/opt/app_financeiro_imc_prod/backend/backups/`.

Para realizar um backup manual, execute:
```bash
/opt/app_financeiro_imc_prod/backend/scripts/backup.sh
```

## Manutenção

### Reiniciar o Sistema

```bash
cd /opt/app_financeiro_imc_prod
pm2 restart imc-financeiro-backend
```

### Verificar Logs

```bash
pm2 logs imc-financeiro-backend
```

### Atualizar o Sistema

1. Faça backup do banco de dados:
   ```bash
   /opt/app_financeiro_imc_prod/backend/scripts/backup.sh
   ```

2. Extraia a nova versão:
   ```bash
   unzip nova_versao.zip -d /tmp/
   ```

3. Copie os arquivos atualizados:
   ```bash
   cp -r /tmp/app_financeiro_imc_prod/* /opt/app_financeiro_imc_prod/
   ```

4. Reinstale as dependências e reinicie:
   ```bash
   cd /opt/app_financeiro_imc_prod
   ./install.sh
   pm2 restart imc-financeiro-backend
   ```

## Solução de Problemas

### Banco de Dados

Se encontrar problemas com o banco de dados:

1. Verifique se o PostgreSQL está em execução:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verifique as credenciais no arquivo .env:
   ```bash
   cat /opt/app_financeiro_imc_prod/backend/.env
   ```

3. Teste a conexão com o banco de dados:
   ```bash
   psql -h localhost -U imc_user -d imc_financeiro_prod
   ```

### Servidor Node.js

Se o servidor não estiver respondendo:

1. Verifique o status do PM2:
   ```bash
   pm2 status
   ```

2. Verifique os logs:
   ```bash
   pm2 logs imc-financeiro-backend
   ```

3. Reinicie o servidor:
   ```bash
   pm2 restart imc-financeiro-backend
   ```

### Frontend

Se o frontend não estiver carregando:

1. Verifique se os arquivos estáticos estão presentes:
   ```bash
   ls -la /opt/app_financeiro_imc_prod/frontend/build
   ```

2. Verifique a configuração do Nginx:
   ```bash
   sudo nginx -t
   ```

3. Reconstrua o frontend:
   ```bash
   cd /opt/app_financeiro_imc_prod/frontend
   npm run build
   ```

## Suporte

Para suporte adicional, entre em contato com a equipe de desenvolvimento através do email: suporte@imcmundial.org
