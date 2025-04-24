const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiro.controller');
const { verificarToken, verificarPermissao, verificarAcessoCongregacao } = require('../middleware/auth.middleware');

// Todas as rotas financeiras requerem autenticação
router.use(verificarToken);

// Rotas para transações
router.post('/transacoes', financeiroController.criarTransacao);
router.get('/transacoes', financeiroController.getTransacoes);
router.get('/transacoes/:id', financeiroController.getTransacaoPorId);
router.put('/transacoes/:id', financeiroController.atualizarTransacao);
router.delete('/transacoes/:id', verificarPermissao('admin_global', 'diretor'), financeiroController.excluirTransacao);
router.post('/transacoes/:id/aprovar', verificarPermissao('admin_global', 'diretor', 'financeiro'), financeiroController.aprovarTransacao);

// Rota para resumo financeiro
router.get('/resumo', financeiroController.getResumoFinanceiro);

// Rotas específicas por congregação
router.get('/congregacoes/:congregacao_id/transacoes', verificarAcessoCongregacao, financeiroController.getTransacoes);
router.get('/congregacoes/:congregacao_id/resumo', verificarAcessoCongregacao, financeiroController.getResumoFinanceiro);

module.exports = router;
