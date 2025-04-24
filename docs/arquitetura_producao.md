# Arquitetura de Produção do APP Financeiro IMC Mundial

## Visão Geral

O APP Financeiro da IMC Mundial é uma plataforma digital abrangente projetada para centralizar a gestão financeira, estatística, demográfica, contábil e institucional da Igreja Missionária em Cristo (IMC Mundial). Esta arquitetura de produção foi desenvolvida para criar um sistema definitivo, robusto, seguro e escalável, acessível tanto via web quanto via dispositivos móveis.

## Stack Tecnológica

### Backend
- **Linguagem e Framework**: Node.js com Express.js
  - Escolhido pela performance, escalabilidade e vasto ecossistema de bibliotecas
- **API**: RESTful API com documentação Swagger
- **Autenticação**: JWT (JSON Web Tokens) com múltiplos níveis de acesso
  - Implementação de refresh tokens para maior segurança
  - Armazenamento seguro de tokens

### Banco de Dados
- **Banco de Dados Principal**: PostgreSQL
  - Para todos os dados do sistema (financeiros, contábeis, estruturais, usuários)
  - Integridade referencial forte para dados financeiros críticos
  - Transações ACID para garantir consistência dos dados
  - Implementação de índices otimizados para consultas frequentes

### Frontend Web
- **Framework**: React.js
  - Componentes reutilizáveis para consistência visual
  - Redux para gerenciamento de estado
  - React Router para navegação
- **UI/UX**: Material-UI personalizado com identidade visual da IMC
- **Visualização de Dados**: D3.js e Chart.js para dashboards e gráficos interativos
- **Responsividade**: Design adaptativo para desktop, tablet e mobile

### DevOps e Infraestrutura
- **Containerização**: Docker
  - Containers separados para backend, frontend e banco de dados
  - Docker Compose para orquestração local
- **CI/CD**: GitHub Actions (opcional)
- **Hospedagem**: Flexível para qualquer provedor
  - Configuração para deploy em VPS, AWS, Azure ou Google Cloud
- **Backups**: 
  - Backups automáticos semanais do banco de dados
  - Rotação de backups com retenção de 3 meses
  - Scripts automatizados para restauração

## Segurança

### Proteção de Dados
- **Criptografia**:
  - Criptografia de dados sensíveis em repouso (AES-256)
  - HTTPS/TLS para toda comunicação cliente-servidor
  - Hashing de senhas com bcrypt e salt
  - Criptografia de dados financeiros e informações pessoais

### Controle de Acesso
- **Autenticação**:
  - Sistema de login com JWT
  - Expiração de tokens configurável
  - Proteção contra ataques de força bruta
  - Opção para autenticação de dois fatores

- **Autorização**:
  - Controle de acesso baseado em papéis (RBAC)
  - Níveis de acesso: Administrador Global, Pastor de Congregação, Financeiro, etc.
  - Permissões granulares por funcionalidade
  - Segregação de dados por congregação

### Auditoria
- **Logs**:
  - Registro detalhado de todas as ações (audit trail)
  - Logs de acesso e modificações
  - Histórico de transações financeiras
  - Monitoramento de atividades suspeitas

## Arquitetura de Banco de Dados

### Modelo Relacional (PostgreSQL)

#### Tabelas Principais
1. **usuarios**
   - id (PK)
   - nome
   - email (unique)
   - senha (hash)
   - perfil (enum: admin_global, pastor, financeiro, etc.)
   - congregacao_id (FK)
   - ativo (boolean)
   - ultimo_acesso (timestamp)
   - data_criacao (timestamp)

2. **congregacoes**
   - id (PK)
   - nome
   - endereco (jsonb)
   - telefone
   - email
   - tipo (enum: SEDE_MUNDIAL, CONGREGACAO, MISSAO)
   - pastor_id (FK)
   - data_criacao (timestamp)
   - ativo (boolean)
   - congregacao_mae_id (FK)
   - membros_total (int)
   - membros_ativos (int)
   - dados_financeiros (jsonb)

3. **transacoes**
   - id (PK)
   - tipo (enum: RECEITA, DESPESA, TRANSFERENCIA)
   - categoria (enum)
   - subcategoria
   - valor (decimal)
   - data (timestamp)
   - descricao
   - congregacao_id (FK)
   - departamento_id (FK)
   - centro_custo_id (FK)
   - projeto_id (FK)
   - forma_pagamento (enum)
   - comprovante_url
   - status (enum: PENDENTE, CONFIRMADO, CANCELADO, ESTORNADO)
   - recorrente (jsonb)
   - doador_id (FK)
   - responsavel_id (FK)
   - aprovador_id (FK)
   - data_aprovacao (timestamp)
   - observacoes
   - metadados (jsonb)

4. **cultos**
   - id (PK)
   - tipo (enum)
   - titulo
   - data (timestamp)
   - horario_inicio
   - horario_fim
   - congregacao_id (FK)
   - responsavel_id (FK)
   - pregador_id (FK)
   - tema
   - descricao
   - participantes (jsonb)
   - conversoes (int)
   - batismos (int)
   - financeiro (jsonb)
   - observacoes
   - registrado_por_id (FK)
   - data_registro (timestamp)
   - atualizado_por_id (FK)
   - data_atualizacao (timestamp)
   - fotos (jsonb)

5. **membros**
   - id (PK)
   - nome
   - data_nascimento
   - genero
   - estado_civil
   - endereco (jsonb)
   - telefone
   - email
   - data_conversao
   - data_batismo
   - cargo_ministerial
   - congregacao_id (FK)
   - ativo (boolean)
   - observacoes
   - data_registro (timestamp)

### Índices e Otimizações
- Índices em chaves estrangeiras
- Índices compostos para consultas frequentes (ex: congregacao_id + data)
- Índices parciais para filtros comuns (ex: status = 'CONFIRMADO')
- Particionamento de tabelas grandes por data (ex: transacoes)

## Módulos do Sistema

### 1. Módulo de Autenticação e Controle de Acesso
- Gerenciamento de usuários e perfis
- Autenticação com JWT
- Controle de acesso baseado em papéis (RBAC)
- Auditoria de acessos e ações

### 2. Módulo de Gestão Financeira
- Lançamentos financeiros (entradas/saídas)
- Controle bancário e conciliação
- Gestão de doações e contribuições
- Orçamento e planejamento financeiro
- Contabilidade automatizada

### 3. Módulo de Censo Digital de Cultos
- Registro de cultos e eventos
- Estatísticas de participação
- Registro de conversões
- Análise de crescimento

### 4. Módulo de Dados Demográficos
- Cadastro de membros
- Geolocalização e mapeamento
- Análise demográfica
- Planejamento de expansão

### 5. Módulo de Gestão de Congregações
- Cadastro e gerenciamento de congregações
- Dashboards específicos por congregação
- Controle de acesso por congregação
- Relatórios consolidados e individuais

### 6. Módulo de Dashboard e Relatórios
- Dashboard executivo global
- Dashboards por congregação
- Relatórios financeiros
- Relatórios estatísticos
- Exportação de dados

### 7. Módulo de IA e Análise Preditiva
- Algoritmos de previsão financeira
- Análise de tendências
- Detecção de anomalias
- Recomendações estratégicas

## Estratégia de Backup e Recuperação

### Backups Automáticos
- Frequência: Semanal (conforme solicitado)
- Tipo: Backup completo do banco de dados (pg_dump)
- Armazenamento: Local e opcional em nuvem (S3, Google Cloud Storage)
- Retenção: 12 backups (3 meses)

### Scripts de Automação
- Backup automático via cron
- Compressão e criptografia dos arquivos de backup
- Rotação automática de backups antigos
- Notificação por email após conclusão do backup

### Recuperação
- Documentação detalhada do processo de restauração
- Scripts para restauração rápida
- Testes periódicos de restauração

## Estratégia de Implantação

### Ambiente de Produção
- Servidor dedicado ou VPS com recursos adequados
- Configuração de firewall e segurança
- Certificados SSL/TLS para HTTPS
- Monitoramento de recursos e disponibilidade

### Processo de Deploy
1. Build do frontend para produção
2. Migração do banco de dados
3. Deploy do backend
4. Configuração de proxy reverso (Nginx)
5. Testes pós-implantação

### Monitoramento
- Logs de aplicação
- Monitoramento de performance
- Alertas para erros críticos
- Monitoramento de segurança

## Considerações Finais

Esta arquitetura foi projetada para atender às necessidades específicas da IMC Mundial, com foco em segurança, escalabilidade e facilidade de manutenção. O sistema definitivo permitirá uma gestão financeira e administrativa eficiente, com dashboards específicos para cada congregação e controle centralizado para a administração global.
