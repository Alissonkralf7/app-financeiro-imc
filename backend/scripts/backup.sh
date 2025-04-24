#!/bin/bash

# Script para backup automático do banco de dados PostgreSQL
# Este script deve ser executado semanalmente via cron

# Carregar variáveis de ambiente
source /home/ubuntu/app_financeiro_imc_prod/backend/.env

# Configurações
BACKUP_DIR="/home/ubuntu/app_financeiro_imc_prod/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/imc_financeiro_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup_log.txt"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Registrar início do backup
echo "Iniciando backup em $(date)" >> $LOG_FILE

# Realizar backup
PGPASSWORD=$PG_PASSWORD pg_dump -h $PG_HOST -U $PG_USER -p $PG_PORT -d $PG_DATABASE -F p -f $BACKUP_FILE

# Verificar se o backup foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "Backup concluído com sucesso: $BACKUP_FILE" >> $LOG_FILE
    
    # Compactar o arquivo de backup
    gzip $BACKUP_FILE
    echo "Arquivo compactado: $BACKUP_FILE.gz" >> $LOG_FILE
    
    # Manter apenas os últimos 12 backups (3 meses de backups semanais)
    cd $BACKUP_DIR
    ls -t *.gz | tail -n +13 | xargs -r rm
    echo "Rotação de backups concluída. Mantendo os 12 backups mais recentes." >> $LOG_FILE
else
    echo "ERRO: Falha ao realizar backup!" >> $LOG_FILE
fi

echo "Processo de backup finalizado em $(date)" >> $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE
