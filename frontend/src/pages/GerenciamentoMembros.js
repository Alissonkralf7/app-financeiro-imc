import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { membroService, congregacaoService } from '../services/api';

const GerenciamentoMembros = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [membros, setMembros] = useState([]);
  const [congregacoes, setCongregacoes] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    nome: '',
    congregacao_id: '',
    status: '',
    cargo: ''
  });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] = useState(false);
  const [membroParaExcluir, setMembroParaExcluir] = useState(null);

  // Verificar se o usuário é administrador
  const isAdmin = usuario?.perfil === 'admin_global' || usuario?.perfil === 'diretor';
  // Verificar se o usuário é pastor
  const isPastor = usuario?.perfil === 'pastor';

  // Esquema de validação com Yup
  const validationSchema = Yup.object({
    nome: Yup.string()
      .required('Nome é obrigatório')
      .min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: Yup.string()
      .email('Email inválido'),
    telefone: Yup.string(),
    data_nascimento: Yup.date()
      .nullable()
      .typeError('Data inválida'),
    data_batismo: Yup.date()
      .nullable()
      .typeError('Data inválida'),
    data_membro: Yup.date()
      .nullable()
      .typeError('Data inválida'),
    congregacao_id: Yup.string()
      .required('Congregação é obrigatória'),
    cargo: Yup.string()
      .required('Cargo é obrigatório'),
    status: Yup.string()
      .required('Status é obrigatório')
  });

  // Configuração do Formik
  const formik = useFormik({
    initialValues: {
      nome: '',
      email: '',
      telefone: '',
      data_nascimento: null,
      data_batismo: null,
      data_membro: null,
      endereco: {
        rua: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        pais: 'Brasil'
      },
      congregacao_id: '',
      cargo: '',
      status: 'ATIVO',
      observacoes: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        if (membroSelecionado) {
          // Atualizar membro existente
          await membroService.atualizarMembro(membroSelecionado.id, values);
        } else {
          // Criar novo membro
          await membroService.criarMembro(values);
        }
        
        // Fechar dialog e recarregar dados
        setDialogAberto(false);
        setMembroSelecionado(null);
        carregarDados();
      } catch (error) {
        console.error('Erro ao salvar membro:', error);
        setError('Erro ao salvar membro. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
  });

  // Carregar dados
  const carregarDados = async () => {
    setLoading(true);
    setError('');
    try {
      // Preparar parâmetros para a requisição
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filtros
      };

      // Se não for admin, filtrar por congregação do usuário
      if (!isAdmin && usuario?.congregacao?.id) {
        params.congregacao_id = usuario.congregacao.id;
      }

      // Carregar membros
      const membrosResponse = await membroService.getMembros(params);
      setMembros(membrosResponse.membros);
      setTotalRows(membrosResponse.paginacao.total);

      // Carregar congregações
      const congregacoesResponse = await congregacaoService.getCongregacoes();
      setCongregacoes(congregacoesResponse.congregacoes);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setError('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [page, rowsPerPage, filtros, isAdmin, usuario]);

  // Função para lidar com mudança de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Função para lidar com mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Função para lidar com mudanças nos filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Função para aplicar filtros
  const aplicarFiltros = () => {
    setPage(0);
    setFiltroAberto(false);
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltros({
      nome: '',
      congregacao_id: '',
      status: '',
      cargo: ''
    });
    setPage(0);
    setFiltroAberto(false);
  };

  // Função para abrir dialog de criação/edição
  const abrirDialog = (membro = null) => {
    if (membro) {
      // Editar membro existente
      setMembroSelecionado(membro);
      formik.setValues({
        nome: membro.nome || '',
        email: membro.email || '',
        telefone: membro.telefone || '',
        data_nascimento: membro.data_nascimento || null,
        data_batismo: membro.data_batismo || null,
        data_membro: membro.data_membro || null,
        endereco: membro.endereco || {
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
          pais: 'Brasil'
        },
        congregacao_id: membro.congregacao_id || '',
        cargo: membro.cargo || '',
        status: membro.status || 'ATIVO',
        observacoes: membro.observacoes || ''
      });
    } else {
      // Criar novo membro
      setMembroSelecionado(null);
      formik.resetForm();
      
      // Se for pastor, pré-selecionar a congregação
      if (!isAdmin && usuario?.congregacao?.id) {
        formik.setFieldValue('congregacao_id', usuario.congregacao.id);
      }
    }
    setDialogAberto(true);
  };

  // Função para fechar dialog
  const fecharDialog = () => {
    setDialogAberto(false);
    setMembroSelecionado(null);
    formik.resetForm();
  };

  // Função para abrir confirmação de exclusão
  const abrirConfirmacaoExclusao = (membro) => {
    setMembroParaExcluir(membro);
    setConfirmacaoExclusaoAberta(true);
  };

  // Função para fechar confirmação de exclusão
  const fecharConfirmacaoExclusao = () => {
    setConfirmacaoExclusaoAberta(false);
    setMembroParaExcluir(null);
  };

  // Função para excluir membro
  const excluirMembro = async () => {
    if (!membroParaExcluir) return;
    
    try {
      setLoading(true);
      await membroService.excluirMembro(membroParaExcluir.id);
      fecharConfirmacaoExclusao();
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      setError('Erro ao excluir membro. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar loading
  if (loading && membros.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Gerenciamento de Membros
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFiltroAberto(!filtroAberto)}
          >
            Filtros
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => abrirDialog()}
          >
            Novo Membro
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Painel de filtros */}
      {filtroAberto && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Nome"
                variant="outlined"
                size="small"
                value={filtros.nome}
                onChange={(e) => handleFiltroChange('nome', e.target.value)}
              />
            </Grid>
            
            {isAdmin && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="congregacao-select-label">Congregação</InputLabel>
                  <Select
                    labelId="congregacao-select-label"
                    id="congregacao-select"
                    value={filtros.congregacao_id}
                    onChange={(e) => handleFiltroChange('congregacao_id', e.target.value)}
                    label="Congregação"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {congregacoes.map((congregacao) => (
                      <MenuItem key={congregacao.id} value={congregacao.id}>
                        {congregacao.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="cargo-select-label">Cargo</InputLabel>
                <Select
                  labelId="cargo-select-label"
                  id="cargo-select"
                  value={filtros.cargo}
                  onChange={(e) => handleFiltroChange('cargo', e.target.value)}
                  label="Cargo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="MEMBRO">Membro</MenuItem>
                  <MenuItem value="DIACONO">Diácono</MenuItem>
                  <MenuItem value="PRESBITERO">Presbítero</MenuItem>
                  <MenuItem value="EVANGELISTA">Evangelista</MenuItem>
                  <MenuItem value="PASTOR">Pastor</MenuItem>
                  <MenuItem value="MISSIONARIO">Missionário</MenuItem>
                  <MenuItem value="LIDER_MINISTERIO">Líder de Ministério</MenuItem>
                  <MenuItem value="AUXILIAR">Auxiliar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  id="status-select"
                  value={filtros.status}
                  onChange={(e) => handleFiltroChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="ATIVO">Ativo</MenuItem>
                  <MenuItem value="INATIVO">Inativo</MenuItem>
                  <MenuItem value="TRANSFERIDO">Transferido</MenuItem>
                  <MenuItem value="FALECIDO">Falecido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={limparFiltros}>
                  Limpar
                </Button>
                <Button variant="contained" onClick={aplicarFiltros}>
                  Aplicar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabela de membros */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabela de membros">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Cargo</TableCell>
                {isAdmin && <TableCell>Congregação</TableCell>}
                <TableCell>Telefone</TableCell>
                <TableCell>Data de Membro</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {membros.length > 0 ? (
                membros.map((membro) => (
                  <TableRow key={membro.id} hover>
                    <TableCell>{membro.nome}</TableCell>
                    <TableCell>
                      <Chip 
                        label={membro.cargo} 
                        color="primary" 
                        size="small" 
                      />
                    </TableCell>
                    {isAdmin && <TableCell>{membro.congregacao?.nome}</TableCell>}
                    <TableCell>{membro.telefone || 'Não informado'}</TableCell>
                    <TableCell>
                      {membro.data_membro 
                        ? new Date(membro.data_membro).toLocaleDateString('pt-BR') 
                        : 'Não informado'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={membro.status} 
                        color={
                          membro.status === 'ATIVO' 
                            ? 'success' 
                            : membro.status === 'INATIVO' 
                              ? 'warning' 
                              : 'error'
                        } 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => abrirDialog(membro)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => abrirConfirmacaoExclusao(membro)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} align="center">
                    Nenhum membro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalRows}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Dialog de criação/edição de membro */}
      <Dialog 
        open={dialogAberto} 
        onClose={fecharDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {membroSelecionado ? 'Editar Membro' : 'Novo Membro'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="nome"
                  name="nome"
                  label="Nome Completo"
                  value={formik.values.nome}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.nome && Boolean(formik.errors.nome)}
                  helperText={formik.touched.nome && formik.errors.nome}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="telefone"
                  name="telefone"
                  label="Telefone"
                  value={formik.values.telefone}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="data_nascimento"
                  name="data_nascimento"
                  label="Data de Nascimento"
                  type="date"
                  value={formik.values.data_nascimento || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.data_nascimento && Boolean(formik.errors.data_nascimento)}
                  helperText={formik.touched.data_nascimento && formik.errors.data_nascimento}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Endereço
                </Typography>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  id="endereco.rua"
                  name="endereco.rua"
                  label="Rua"
                  value={formik.values.endereco.rua}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  id="endereco.numero"
                  name="endereco.numero"
                  label="Número"
                  value={formik.values.endereco.numero}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="endereco.complemento"
                  name="endereco.complemento"
                  label="Complemento"
                  value={formik.values.endereco.complemento}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="endereco.bairro"
                  name="endereco.bairro"
                  label="Bairro"
                  value={formik.values.endereco.bairro}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="endereco.cidade"
                  name="endereco.cidade"
                  label="Cidade"
                  value={formik.values.endereco.cidade}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  id="endereco.estado"
                  name="endereco.estado"
                  label="Estado"
                  value={formik.values.endereco.estado}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  id="endereco.cep"
                  name="endereco.cep"
                  label="CEP"
                  value={formik.values.endereco.cep}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Informações da Igreja
                </Typography>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="congregacao-label">Congregação</InputLabel>
                  <Select
                    labelId="congregacao-label"
                    id="congregacao_id"
                    name="congregacao_id"
                    value={formik.values.congregacao_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.congregacao_id && Boolean(formik.errors.congregacao_id)}
                    label="Congregação"
                    disabled={!isAdmin && usuario?.congregacao?.id}
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    {congregacoes.map((congregacao) => (
                      <MenuItem key={congregacao.id} value={congregacao.id}>
                        {congregacao.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="cargo-label">Cargo</InputLabel>
                  <Select
                    labelId="cargo-label"
                    id="cargo"
                    name="cargo"
                    value={formik.values.cargo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.cargo && Boolean(formik.errors.cargo)}
                    label="Cargo"
                  >
                    <MenuItem value="">Selecione</MenuItem>
                    <MenuItem value="MEMBRO">Membro</MenuItem>
                    <MenuItem value="DIACONO">Diácono</MenuItem>
                    <MenuItem value="PRESBITERO">Presbítero</MenuItem>
                    <MenuItem value="EVANGELISTA">Evangelista</MenuItem>
                    <MenuItem value="PASTOR">Pastor</MenuItem>
                    <MenuItem value="MISSIONARIO">Missionário</MenuItem>
                    <MenuItem value="LIDER_MINISTERIO">Líder de Ministério</MenuItem>
                    <MenuItem value="AUXILIAR">Auxiliar</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="data_batismo"
                  name="data_batismo"
                  label="Data de Batismo"
                  type="date"
                  value={formik.values.data_batismo || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.data_batismo && Boolean(formik.errors.data_batismo)}
                  helperText={formik.touched.data_batismo && formik.errors.data_batismo}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="data_membro"
                  name="data_membro"
                  label="Data de Membro"
                  type="date"
                  value={formik.values.data_membro || ''}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.data_membro && Boolean(formik.errors.data_membro)}
                  helperText={formik.touched.data_membro && formik.errors.data_membro}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.status && Boolean(formik.errors.status)}
                    label="Status"
                  >
                    <MenuItem value="ATIVO">Ativo</MenuItem>
                    <MenuItem value="INATIVO">Inativo</MenuItem>
                    <MenuItem value="TRANSFERIDO">Transferido</MenuItem>
                    <MenuItem value="FALECIDO">Falecido</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="observacoes"
                  name="observacoes"
                  label="Observações"
                  multiline
                  rows={4}
                  value={formik.values.observacoes}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={fecharDialog}>Cancelar</Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={confirmacaoExclusaoAberta}
        onClose={fecharConfirmacaoExclusao}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o membro "{membroParaExcluir?.nome}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita. Todos os dados relacionados a este membro serão perdidos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharConfirmacaoExclusao}>Cancelar</Button>
          <Button 
            onClick={excluirMembro} 
            variant="contained" 
            color="error"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GerenciamentoMembros;
