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
  Church as ChurchIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { congregacaoService } from '../services/api';

const GerenciamentoCongregacoes = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [congregacoes, setCongregacoes] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    nome: '',
    tipo: '',
    ativo: ''
  });
  const [dialogAberto, setDialogAberto] = useState(false);
  const [congregacaoSelecionada, setCongregacaoSelecionada] = useState(null);
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] = useState(false);
  const [congregacaoParaExcluir, setCongregacaoParaExcluir] = useState(null);

  // Verificar se o usuário é administrador
  const isAdmin = usuario?.perfil === 'admin_global' || usuario?.perfil === 'diretor';

  // Esquema de validação com Yup
  const validationSchema = Yup.object({
    nome: Yup.string()
      .required('Nome é obrigatório')
      .min(3, 'Nome deve ter pelo menos 3 caracteres'),
    endereco: Yup.object({
      rua: Yup.string().required('Rua é obrigatória'),
      numero: Yup.string().required('Número é obrigatório'),
      bairro: Yup.string().required('Bairro é obrigatório'),
      cidade: Yup.string().required('Cidade é obrigatória'),
      estado: Yup.string().required('Estado é obrigatório'),
      cep: Yup.string().required('CEP é obrigatório')
    }),
    telefone: Yup.string(),
    email: Yup.string().email('Email inválido'),
    tipo: Yup.string().required('Tipo é obrigatório'),
    pastor_id: Yup.string(),
    congregacao_mae_id: Yup.string()
  });

  // Configuração do Formik
  const formik = useFormik({
    initialValues: {
      nome: '',
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
      telefone: '',
      email: '',
      tipo: '',
      pastor_id: '',
      congregacao_mae_id: '',
      ativo: true,
      dados_financeiros: {
        saldo_atual: 0,
        meta_mensal: 0
      }
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        if (congregacaoSelecionada) {
          // Atualizar congregação existente
          await congregacaoService.atualizarCongregacao(congregacaoSelecionada.id, values);
        } else {
          // Criar nova congregação
          await congregacaoService.criarCongregacao(values);
        }
        
        // Fechar dialog e recarregar dados
        setDialogAberto(false);
        setCongregacaoSelecionada(null);
        carregarDados();
      } catch (error) {
        console.error('Erro ao salvar congregação:', error);
        setError('Erro ao salvar congregação. Por favor, tente novamente mais tarde.');
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
      // Verificar permissões
      if (!isAdmin) {
        setError('Você não tem permissão para acessar esta página');
        setLoading(false);
        return;
      }

      // Preparar parâmetros para a requisição
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filtros
      };

      // Carregar congregações
      const congregacoesResponse = await congregacaoService.getCongregacoes(params);
      setCongregacoes(congregacoesResponse.congregacoes);
      setTotalRows(congregacoesResponse.paginacao.total);
    } catch (error) {
      console.error('Erro ao carregar congregações:', error);
      setError('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [page, rowsPerPage, filtros, isAdmin]);

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
      tipo: '',
      ativo: ''
    });
    setPage(0);
    setFiltroAberto(false);
  };

  // Função para abrir dialog de criação/edição
  const abrirDialog = (congregacao = null) => {
    if (congregacao) {
      // Editar congregação existente
      setCongregacaoSelecionada(congregacao);
      formik.setValues({
        nome: congregacao.nome || '',
        endereco: congregacao.endereco || {
          rua: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
          pais: 'Brasil'
        },
        telefone: congregacao.telefone || '',
        email: congregacao.email || '',
        tipo: congregacao.tipo || '',
        pastor_id: congregacao.pastor_id || '',
        congregacao_mae_id: congregacao.congregacao_mae_id || '',
        ativo: congregacao.ativo !== undefined ? congregacao.ativo : true,
        dados_financeiros: congregacao.dados_financeiros || {
          saldo_atual: 0,
          meta_mensal: 0
        }
      });
    } else {
      // Criar nova congregação
      setCongregacaoSelecionada(null);
      formik.resetForm();
    }
    setDialogAberto(true);
  };

  // Função para fechar dialog
  const fecharDialog = () => {
    setDialogAberto(false);
    setCongregacaoSelecionada(null);
    formik.resetForm();
  };

  // Função para abrir confirmação de exclusão
  const abrirConfirmacaoExclusao = (congregacao) => {
    setCongregacaoParaExcluir(congregacao);
    setConfirmacaoExclusaoAberta(true);
  };

  // Função para fechar confirmação de exclusão
  const fecharConfirmacaoExclusao = () => {
    setConfirmacaoExclusaoAberta(false);
    setCongregacaoParaExcluir(null);
  };

  // Função para excluir congregação
  const excluirCongregacao = async () => {
    if (!congregacaoParaExcluir) return;
    
    try {
      setLoading(true);
      await congregacaoService.excluirCongregacao(congregacaoParaExcluir.id);
      fecharConfirmacaoExclusao();
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir congregação:', error);
      setError('Erro ao excluir congregação. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar loading
  if (loading && congregacoes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Renderizar erro de permissão
  if (!isAdmin) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          Você não tem permissão para acessar esta página. Esta funcionalidade é restrita a administradores.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          Gerenciamento de Congregações
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
            Nova Congregação
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
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nome"
                variant="outlined"
                size="small"
                value={filtros.nome}
                onChange={(e) => handleFiltroChange('nome', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="tipo-select-label">Tipo</InputLabel>
                <Select
                  labelId="tipo-select-label"
                  id="tipo-select"
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="SEDE">Sede</MenuItem>
                  <MenuItem value="FILIAL">Filial</MenuItem>
                  <MenuItem value="MISSAO">Missão</MenuItem>
                  <MenuItem value="CONGREGACAO">Congregação</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="ativo-select-label">Status</InputLabel>
                <Select
                  labelId="ativo-select-label"
                  id="ativo-select"
                  value={filtros.ativo}
                  onChange={(e) => handleFiltroChange('ativo', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="true">Ativo</MenuItem>
                  <MenuItem value="false">Inativo</MenuItem>
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

      {/* Tabela de congregações */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabela de congregações">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Cidade/Estado</TableCell>
                <TableCell>Pastor</TableCell>
                <TableCell>Telefone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {congregacoes.length > 0 ? (
                congregacoes.map((congregacao) => (
                  <TableRow key={congregacao.id} hover>
                    <TableCell>{congregacao.nome}</TableCell>
                    <TableCell>
                      <Chip 
                        label={congregacao.tipo} 
                        color="primary" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {congregacao.endereco?.cidade}, {congregacao.endereco?.estado}
                    </TableCell>
                    <TableCell>{congregacao.pastor?.nome || 'Não definido'}</TableCell>
                    <TableCell>{congregacao.telefone || 'Não definido'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={congregacao.ativo ? 'Ativo' : 'Inativo'} 
                        color={congregacao.ativo ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => abrirDialog(congregacao)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => abrirConfirmacaoExclusao(congregacao)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhuma congregação encontrada
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

      {/* Dialog de criação/edição de congregação */}
      <Dialog 
        open={dialogAberto} 
        onClose={fecharDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {congregacaoSelecionada ? 'Editar Congregação' : 'Nova Congregação'}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="nome"
                  name="nome"
                  label="Nome da Congregação"
                  value={formik.values.nome}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.nome && Boolean(formik.errors.nome)}
                  helperText={formik.touched.nome && formik.errors.nome}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-label"
                    id="tipo"
                    name="tipo"
                    value={formik.values.tipo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.tipo && Boolean(formik.errors.tipo)}
                    label="Tipo"
                  >
                    <MenuItem value="SEDE">Sede</MenuItem>
                    <MenuItem value="FILIAL">Filial</MenuItem>
                    <MenuItem value="MISSAO">Missão</MenuItem>
                    <MenuItem value="CONGREGACAO">Congregação</MenuItem>
                  </Select>
                </FormControl>
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
                  onBlur={formik.handleBlur}
                  error={formik.touched.endereco?.rua && Boolean(formik.errors.endereco?.rua)}
                  helperText={formik.touched.endereco?.rua && formik.errors.endereco?.rua}
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
                  onBlur={formik.handleBlur}
                  error={formik.touched.endereco?.numero && Boolean(formik.errors.endereco?.numero)}
                  helperText={formik.touched.endereco?.numero && formik.errors.endereco?.numero}
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
                  onBlur={formik.handleBlur}
                  error={formik.touched.endereco?.bairro && Boolean(formik.errors.endereco?.bairro)}
                  helperText={formik.touched.endereco?.bairro && formik.errors.endereco?.bairro}
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
                  onBlur={formik.handleBlur}
                  error={formik.touched.endereco?.cidade && Boolean(formik.errors.endereco?.cidade)}
                  helperText={formik.touched.endereco?.cidade && formik.errors.endereco?.cidade}
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
                  onBlur={formik.handleBlur}
                  error={formik.touched.endereco?.estado && Boolean(formik.errors.endereco?.estado)}
                  helperText={formik.touched.endereco?.estado && formik.errors.endereco?.estado}
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
                  onBlur={formik.handleBlur}
                  error={formik.touched.endereco?.cep && Boolean(formik.errors.endereco?.cep)}
                  helperText={formik.touched.endereco?.cep && formik.errors.endereco?.cep}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Contato
                </Typography>
                <Divider />
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
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  Configurações
                </Typography>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="pastor-label">Pastor Responsável</InputLabel>
                  <Select
                    labelId="pastor-label"
                    id="pastor_id"
                    name="pastor_id"
                    value={formik.values.pastor_id}
                    onChange={formik.handleChange}
                    label="Pastor Responsável"
                  >
                    <MenuItem value="">Nenhum</MenuItem>
                    {/* Lista de pastores seria carregada do backend */}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="congregacao-mae-label">Congregação Mãe</InputLabel>
                  <Select
                    labelId="congregacao-mae-label"
                    id="congregacao_mae_id"
                    name="congregacao_mae_id"
                    value={formik.values.congregacao_mae_id}
                    onChange={formik.handleChange}
                    label="Congregação Mãe"
                  >
                    <MenuItem value="">Nenhuma</MenuItem>
                    {/* Lista de congregações seria carregada do backend */}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="ativo-label">Status</InputLabel>
                  <Select
                    labelId="ativo-label"
                    id="ativo"
                    name="ativo"
                    value={formik.values.ativo}
                    onChange={formik.handleChange}
                    label="Status"
                  >
                    <MenuItem value={true}>Ativo</MenuItem>
                    <MenuItem value={false}>Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="dados_financeiros.meta_mensal"
                  name="dados_financeiros.meta_mensal"
                  label="Meta Mensal (R$)"
                  type="number"
                  value={formik.values.dados_financeiros.meta_mensal}
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
            Tem certeza que deseja excluir a congregação "{congregacaoParaExcluir?.nome}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Esta ação não pode ser desfeita. Todos os dados relacionados a esta congregação serão perdidos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharConfirmacaoExclusao}>Cancelar</Button>
          <Button 
            onClick={excluirCongregacao} 
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

export default GerenciamentoCongregacoes;
