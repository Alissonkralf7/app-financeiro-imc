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
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { financeiroService, congregacaoService } from '../services/api';
import { Bar } from 'react-chartjs-2';

const RelatorioFinanceiro = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transacoes, setTransacoes] = useState([]);
  const [resumoFinanceiro, setResumoFinanceiro] = useState(null);
  const [congregacoes, setCongregacoes] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    categoria: '',
    data_inicio: null,
    data_fim: null,
    congregacao_id: '',
    status: ''
  });
  const [exportando, setExportando] = useState(false);

  // Verificar se o usuário é administrador
  const isAdmin = usuario?.perfil === 'admin_global' || usuario?.perfil === 'diretor';

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      setError('');
      try {
        // Carregar lista de congregações (apenas para administradores)
        if (isAdmin) {
          const congregacoesResponse = await congregacaoService.getCongregacoes();
          setCongregacoes(congregacoesResponse.congregacoes);
        }

        // Preparar parâmetros para a requisição
        const params = {
          page: page + 1,
          limit: rowsPerPage,
          ...filtros
        };

        // Formatar datas se existirem
        if (filtros.data_inicio) {
          params.data_inicio = filtros.data_inicio.toISOString().split('T')[0];
        }
        if (filtros.data_fim) {
          params.data_fim = filtros.data_fim.toISOString().split('T')[0];
        }

        // Se não for admin, filtrar por congregação do usuário
        if (!isAdmin && usuario?.congregacao?.id) {
          params.congregacao_id = usuario.congregacao.id;
        }

        // Carregar transações
        const transacoesResponse = await financeiroService.getTransacoes(params);
        setTransacoes(transacoesResponse.transacoes);
        setTotalRows(transacoesResponse.paginacao.total);

        // Carregar resumo financeiro
        const resumoParams = { ...params };
        delete resumoParams.page;
        delete resumoParams.limit;
        
        const resumoFinanceiroResponse = await financeiroService.getResumoFinanceiro(resumoParams);
        setResumoFinanceiro(resumoFinanceiroResponse);
      } catch (error) {
        console.error('Erro ao carregar relatório financeiro:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

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
      tipo: '',
      categoria: '',
      data_inicio: null,
      data_fim: null,
      congregacao_id: '',
      status: ''
    });
    setPage(0);
    setFiltroAberto(false);
  };

  // Função para exportar relatório
  const exportarRelatorio = async () => {
    setExportando(true);
    try {
      // Preparar parâmetros para a requisição
      const params = { ...filtros, formato: 'csv' };

      // Formatar datas se existirem
      if (filtros.data_inicio) {
        params.data_inicio = filtros.data_inicio.toISOString().split('T')[0];
      }
      if (filtros.data_fim) {
        params.data_fim = filtros.data_fim.toISOString().split('T')[0];
      }

      // Se não for admin, filtrar por congregação do usuário
      if (!isAdmin && usuario?.congregacao?.id) {
        params.congregacao_id = usuario.congregacao.id;
      }

      // Exportar relatório
      const response = await financeiroService.exportarRelatorio(params);
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio_financeiro.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      setError('Erro ao exportar relatório. Por favor, tente novamente mais tarde.');
    } finally {
      setExportando(false);
    }
  };

  // Dados para o gráfico de receitas e despesas por categoria
  const dadosGraficoFinanceiro = {
    labels: resumoFinanceiro?.receitasPorCategoria?.map(item => item.categoria) || [],
    datasets: [
      {
        label: 'Receitas por Categoria',
        data: resumoFinanceiro?.receitasPorCategoria?.map(item => item.total) || [],
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      }
    ],
  };

  // Dados para o gráfico de despesas por categoria
  const dadosGraficoDespesas = {
    labels: resumoFinanceiro?.despesasPorCategoria?.map(item => item.categoria) || [],
    datasets: [
      {
        label: 'Despesas por Categoria',
        data: resumoFinanceiro?.despesasPorCategoria?.map(item => item.total) || [],
        backgroundColor: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.dark,
        borderWidth: 1,
      }
    ],
  };

  // Opções para os gráficos
  const opcoesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Renderizar loading
  if (loading) {
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
          Relatório Financeiro
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
            startIcon={<FileDownloadIcon />}
            onClick={exportarRelatorio}
            disabled={exportando}
          >
            {exportando ? 'Exportando...' : 'Exportar CSV'}
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
                  <MenuItem value="RECEITA">Receita</MenuItem>
                  <MenuItem value="DESPESA">Despesa</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="categoria-select-label">Categoria</InputLabel>
                <Select
                  labelId="categoria-select-label"
                  id="categoria-select"
                  value={filtros.categoria}
                  onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                  label="Categoria"
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="DIZIMO">Dízimo</MenuItem>
                  <MenuItem value="OFERTA">Oferta</MenuItem>
                  <MenuItem value="DOACAO">Doação</MenuItem>
                  <MenuItem value="ALUGUEL">Aluguel</MenuItem>
                  <MenuItem value="AGUA">Água</MenuItem>
                  <MenuItem value="LUZ">Luz</MenuItem>
                  <MenuItem value="INTERNET">Internet</MenuItem>
                  <MenuItem value="MANUTENCAO">Manutenção</MenuItem>
                  <MenuItem value="MATERIAL">Material</MenuItem>
                  <MenuItem value="SALARIO">Salário</MenuItem>
                  <MenuItem value="MISSOES">Missões</MenuItem>
                  <MenuItem value="EVENTOS">Eventos</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
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
                  <MenuItem value="PENDENTE">Pendente</MenuItem>
                  <MenuItem value="CONFIRMADO">Confirmado</MenuItem>
                  <MenuItem value="CANCELADO">Cancelado</MenuItem>
                </Select>
              </FormControl>
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
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Início"
                  value={filtros.data_inicio}
                  onChange={(newValue) => handleFiltroChange('data_inicio', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Fim"
                  value={filtros.data_fim}
                  onChange={(newValue) => handleFiltroChange('data_fim', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={12} md={6}>
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

      {/* Cards com resumo financeiro */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total de Receitas
            </Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              R$ {resumoFinanceiro?.resumo?.totalReceitas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total de Despesas
            </Typography>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
              R$ {resumoFinanceiro?.resumo?.totalDespesas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Saldo
            </Typography>
            <Typography 
              variant="h4" 
              color={resumoFinanceiro?.resumo?.saldo >= 0 ? 'success.main' : 'error.main'} 
              sx={{ fontWeight: 'bold' }}
            >
              R$ {resumoFinanceiro?.resumo?.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de Receitas por Categoria */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Receitas por Categoria
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Bar data={dadosGraficoFinanceiro} options={opcoesGrafico} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Gráfico de Despesas por Categoria */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Despesas por Categoria
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Bar data={dadosGraficoDespesas} options={opcoesGrafico} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabela de transações */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabela de transações">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoria</TableCell>
                <TableCell>Descrição</TableCell>
                {isAdmin && <TableCell>Congregação</TableCell>}
                <TableCell>Valor</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Responsável</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transacoes.length > 0 ? (
                transacoes.map((transacao) => (
                  <TableRow key={transacao.id} hover>
                    <TableCell>
                      {new Date(transacao.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transacao.tipo} 
                        color={transacao.tipo === 'RECEITA' ? 'primary' : 'secondary'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{transacao.categoria}</TableCell>
                    <TableCell>{transacao.descricao}</TableCell>
                    {isAdmin && <TableCell>{transacao.congregacao?.nome}</TableCell>}
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={transacao.tipo === 'RECEITA' ? 'primary.main' : 'secondary.main'}
                        sx={{ fontWeight: 'bold' }}
                      >
                        R$ {parseFloat(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transacao.status} 
                        color={
                          transacao.status === 'CONFIRMADO' 
                            ? 'success' 
                            : transacao.status === 'PENDENTE' 
                              ? 'warning' 
                              : 'error'
                        } 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{transacao.responsavel?.nome}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} align="center">
                    Nenhuma transação encontrada
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
    </Box>
  );
};

export default RelatorioFinanceiro;
