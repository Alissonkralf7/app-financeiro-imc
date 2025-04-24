const Usuario = require('./usuario.model');
const Congregacao = require('./congregacao.model');
const Transacao = require('./transacao.model');
const Culto = require('./culto.model');
const Membro = require('./membro.model');

// Associações entre Usuário e Congregação
Usuario.belongsTo(Congregacao, {
  foreignKey: 'congregacao_id',
  as: 'congregacao'
});
Congregacao.hasMany(Usuario, {
  foreignKey: 'congregacao_id',
  as: 'usuarios'
});

// Associação entre Congregação e Pastor
Congregacao.belongsTo(Usuario, {
  foreignKey: 'pastor_id',
  as: 'pastor'
});

// Associação entre Congregações (Sede e Filiais)
Congregacao.belongsTo(Congregacao, {
  foreignKey: 'congregacao_mae_id',
  as: 'congregacao_mae'
});
Congregacao.hasMany(Congregacao, {
  foreignKey: 'congregacao_mae_id',
  as: 'congregacoes_filhas'
});

// Associações para Transações
Transacao.belongsTo(Congregacao, {
  foreignKey: 'congregacao_id',
  as: 'congregacao'
});
Congregacao.hasMany(Transacao, {
  foreignKey: 'congregacao_id',
  as: 'transacoes'
});

Transacao.belongsTo(Usuario, {
  foreignKey: 'responsavel_id',
  as: 'responsavel'
});

Transacao.belongsTo(Usuario, {
  foreignKey: 'aprovador_id',
  as: 'aprovador'
});

Transacao.belongsTo(Usuario, {
  foreignKey: 'doador_id',
  as: 'doador'
});

// Associações para Cultos
Culto.belongsTo(Congregacao, {
  foreignKey: 'congregacao_id',
  as: 'congregacao'
});
Congregacao.hasMany(Culto, {
  foreignKey: 'congregacao_id',
  as: 'cultos'
});

Culto.belongsTo(Usuario, {
  foreignKey: 'responsavel_id',
  as: 'responsavel'
});

Culto.belongsTo(Usuario, {
  foreignKey: 'pregador_id',
  as: 'pregador'
});

Culto.belongsTo(Usuario, {
  foreignKey: 'registrado_por_id',
  as: 'registrado_por'
});

// Associações para Membros
Membro.belongsTo(Congregacao, {
  foreignKey: 'congregacao_id',
  as: 'congregacao'
});
Congregacao.hasMany(Membro, {
  foreignKey: 'congregacao_id',
  as: 'membros'
});

// Exportar todos os modelos com suas associações
module.exports = {
  Usuario,
  Congregacao,
  Transacao,
  Culto,
  Membro
};
