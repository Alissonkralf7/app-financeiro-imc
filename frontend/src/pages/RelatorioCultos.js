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
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  People as PeopleIcon,
  Church as ChurchIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { cultoService, congregacaoService } from '../services/api';
import { Bar, Pie } from 'react-chartjs-2';

const RelatorioCultos = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cultos, setCultos] = useState([]);
  const [estatisticasCultos, setEstatisticasCultos] = useState(null);
  const [congregacoes, setCongregacoes] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo: '',
    data_inicio: null,
    data_fim: null,
    congregacao_id: '',
    pregador_id: ''
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

        // Carregar cultos
        const cultosResponse = await cultoService.getCultos(params);
        setCultos(cultosResponse.cultos);
        setTotalRows(cultosResponse.paginacao.total);

        // Carregar estatísticas de cultos
        const estatisticasParams = { ...params };
        delete estatisticasParams.page;
        delete estatisticasParams.limit;
        
        const estatisticasCultosResponse = await cultoService.getEstatisticasCultos(estatisticasParams);
        setEstatisticasCultos(estatisticasCultosResponse);
      } catch (error) {
        console.error('Erro ao carregar relatório de cultos:', error);
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
      data_inicio: null,
      data_fim: null,
      congregacao_id: '',
      pregador_id: ''
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
      const response = await cultoService.exportarRelatorio(params);
      
      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio_cultos.csv');
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

  // Dados para o gráfico de cultos por tipo
  const dadosGraficoCultos = {
    labels: estatisticasCultos?.estatisticasPorTipo?.map(item => item.tipo) || [],
    datasets: [
      {
        label: 'Participantes por Tipo de Culto',
        data: estatisticasCultos?.estatisticasPorTipo?.map(item => item.total_participantes) || [],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.warning.main,
        ],
        borderColor: [
          theme.palette.primary.dark,
          theme.palette.secondary.dark,
          theme.palette.info.dark,
          theme.palette.success.dark,
          theme.palette.warning.dark,
        ],
        borderWidth: 1,
      }
    ],
  };

  // Dados para o gráfico de conversões e batismos
  const dadosGraficoConversoes = {
    labels: estatisticasCultos?.estatisticasPorTipo?.map(item => item.tipo) || [],
    datasets: [
      {
        label: 'Conversões',
        data: estatisticasCultos?.estatisticasPorTipo?.map(item => item.total_conversoes) || [],
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      },
      {
        label: 'Batismos',
        data: estatisticasCultos?.estatisticasPorTipo?.map(item => item.total_batismos) || [],
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
          Relatório de Cultos
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
                <InputLabel id="tipo-select-label">Tipo de Culto</InputLabel>
                <Select
                  labelId="tipo-select-label"
                  id="tipo-select"
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  label="Tipo de Culto"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="DOMINGO">Domingo</MenuItem>
                  <MenuItem value="ORACAO">Oração</MenuItem>
                  <MenuItem value="ESTUDO_BIBLICO">Estudo Bíblico</MenuItem>
                  <MenuItem value="JOVENS">Jovens</MenuItem>
                  <MenuItem value="MULHERES">Mulheres</MenuItem>
                  <MenuItem value="HOMENS">Homens</MenuItem>
                  <MenuItem value="CRIANCAS">Crianças</MenuItem>
                  <MenuItem value="EVANGELISTICO">Evangelístico</MenuItem>
                  <MenuItem value="ESPECIAL">Especial</MenuItem>
                  <MenuItem value="OUTROS">Outros</MenuItem>
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
            
            <Grid item xs={12} sm={12} md={12}>
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

      {/* Cards com resumo de cultos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total de Cultos
            </Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {estatisticasCultos?.totais?.total_cultos || '0'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total de Participantes
            </Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {estatisticasCultos?.totais?.total_participantes || '0'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Média por Culto
            </Typography>
            <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
              {estatisticasCultos?.totais?.total_cultos > 0 
                ? Math.round(estatisticasCultos?.totais?.total_participantes / estatisticasCultos?.totais?.total_cultos) 
                : '0'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Cards com estatísticas de conversões e batismos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total de Conversões
            </Typography>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
              {estatisticasCultos?.totais?.total_conversoes || '0'}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Total de Batismos
            </Typography>
            <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
              {estatisticasCultos?.totais?.total_batismos || '0'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de Participantes por Tipo de Culto */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Participantes por Tipo de Culto
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Pie data={dadosGraficoCultos} options={opcoesGrafico} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Gráfico de Conversões e Batismos por Tipo de Culto */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Conversões e Batismos por Tipo de Culto
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Bar data={dadosGraficoConversoes} options={opcoesGrafico} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabela de cultos */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabela de cultos">
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Título</TableCell>
                {isAdmin && <TableCell>Congregação</TableCell>}
                <TableCell>Participantes</TableCell>
                <TableCell>Conversões</TableCell>
                <TableCell>Batismos</TableCell>
                <TableCell>Pregador</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cultos.length > 0 ? (
                cultos.map((culto) => (
                  <TableRow key={culto.id} hover>
                    <TableCell>
                      {new Date(culto.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={culto.tipo} 
                        color="primary" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{culto.titulo}</TableCell>
                    {isAdmin && <TableCell>{culto.congregacao?.nome}</TableCell>}
                    <TableCell>
                      <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {culto.participantes?.total || '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                        {culto.conversoes || '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                        {culto.batismos || '0'}
                      </Typography>
                    </TableCell>
                    <TableCell>{culto.pregador?.nome}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} align="center">
                    Nenhum culto encontrado
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

export default RelatorioCultos;
