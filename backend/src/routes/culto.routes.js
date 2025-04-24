const express = require('express');
const router = express.Router();
const cultoController = require('../controllers/culto.controller');
const { verificarToken, verificarPermissao, verificarAcessoCongregacao } = require('../middleware/auth.middleware');

// Todas as rotas de cultos requerem autenticação
router.use(verificarToken);

// Rotas para cultos
router.post('/cultos', cultoController.criarCulto);
router.get('/cultos', cultoController.getCultos);
router.get('/cultos/:id', cultoController.getCultoPorId);
router.put('/cultos/:id', cultoController.atualizarCulto);
router.delete('/cultos/:id', verificarPermissao('admin_global', 'diretor'), cultoController.excluirCulto);

// Rota para estatísticas de cultos
router.get('/estatisticas', cultoController.getEstatisticasCultos);

// Rotas específicas por congregação
router.get('/congregacoes/:congregacao_id/cultos', verificarAcessoCongregacao, cultoController.getCultos);
router.get('/congregacoes/:congregacao_id/estatisticas', verificarAcessoCongregacao, cultoController.getEstatisticasCultos);

module.exports = router;
