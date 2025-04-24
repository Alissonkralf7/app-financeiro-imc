import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Divider,
  Paper,
  Button,
  CircularProgress,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Church as ChurchIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { financeiroService, cultoService, congregacaoService } from '../services/api';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

const Dashboard = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resumoFinanceiro, setResumoFinanceiro] = useState(null);
  const [estatisticasCultos, setEstatisticasCultos] = useState(null);
  const [congregacoes, setCongregacoes] = useState([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [congregacaoSelecionada, setCongregacaoSelecionada] = useState('todas');

  // Verificar se o usuário é administrador
  const isAdmin = usuario?.perfil === 'admin_global' || usuario?.perfil === 'diretor';

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Definir parâmetros de data com base no período selecionado
        const hoje = new Date();
        let dataInicio;
        
        switch (periodoSelecionado) {
          case 'semana':
            dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - 7);
            break;
          case 'mes':
            dataInicio = new Date(hoje);
            dataInicio.setMonth(hoje.getMonth() - 1);
            break;
          case 'trimestre':
            dataInicio = new Date(hoje);
            dataInicio.setMonth(hoje.getMonth() - 3);
            break;
          case 'ano':
            dataInicio = new Date(hoje);
            dataInicio.setFullYear(hoje.getFullYear() - 1);
            break;
          default:
            dataInicio = new Date(hoje);
            dataInicio.setMonth(hoje.getMonth() - 1);
        }
        
        // Formatar datas para YYYY-MM-DD
        const dataInicioFormatada = dataInicio.toISOString().split('T')[0];
        const dataFimFormatada = hoje.toISOString().split('T')[0];
        
        // Parâmetros para as requisições
        const params = {
          data_inicio: dataInicioFormatada,
          data_fim: dataFimFormatada
        };
        
        // Adicionar congregação se selecionada e não for 'todas'
        if (congregacaoSelecionada !== 'todas') {
          params.congregacao_id = congregacaoSelecionada;
        }
        
        // Carregar dados financeiros
        const resumoFinanceiroResponse = await financeiroService.getResumoFinanceiro(params);
        setResumoFinanceiro(resumoFinanceiroResponse);
        
        // Carregar estatísticas de cultos
        const estatisticasCultosResponse = await cultoService.getEstatisticasCultos(params);
        setEstatisticasCultos(estatisticasCultosResponse);
        
        // Carregar lista de congregações (apenas para administradores)
        if (isAdmin) {
          const congregacoesResponse = await congregacaoService.getCongregacoes();
          setCongregacoes(congregacoesResponse.congregacoes);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [periodoSelecionado, congregacaoSelecionada, isAdmin, usuario]);

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
          Dashboard {isAdmin ? 'Global' : 'da Congregação'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Seletor de período */}
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="periodo-select-label">Período</InputLabel>
            <Select
              labelId="periodo-select-label"
              id="periodo-select"
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
              label="Período"
            >
              <MenuItem value="semana">Última semana</MenuItem>
              <MenuItem value="mes">Último mês</MenuItem>
              <MenuItem value="trimestre">Último trimestre</MenuItem>
              <MenuItem value="ano">Último ano</MenuItem>
            </Select>
          </FormControl>
          
          {/* Seletor de congregação (apenas para administradores) */}
          {isAdmin && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="congregacao-select-label">Congregação</InputLabel>
              <Select
                labelId="congregacao-select-label"
                id="congregacao-select"
                value={congregacaoSelecionada}
                onChange={(e) => setCongregacaoSelecionada(e.target.value)}
                label="Congregação"
              >
                <MenuItem value="todas">Todas as congregações</MenuItem>
                {congregacoes.map((congregacao) => (
                  <MenuItem key={congregacao.id} value={congregacao.id}>
                    {congregacao.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {/* Cards com resumo financeiro */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div" color="text.secondary">
                  Receitas
                </Typography>
                <TrendingUpIcon color="primary" fontSize="large" />
              </Box>
              <Typography variant="h4" component="div" color="primary" sx={{ fontWeight: 'bold' }}>
                R$ {resumoFinanceiro?.resumo?.totalReceitas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div" color="text.secondary">
                  Despesas
                </Typography>
                <TrendingDownIcon color="secondary" fontSize="large" />
              </Box>
              <Typography variant="h4" component="div" color="secondary" sx={{ fontWeight: 'bold' }}>
                R$ {resumoFinanceiro?.resumo?.totalDespesas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div" color="text.secondary">
                  Saldo
                </Typography>
                <AccountBalanceIcon color="info" fontSize="large" />
              </Box>
              <Typography 
                variant="h4" 
                component="div" 
                color={resumoFinanceiro?.resumo?.saldo >= 0 ? 'success.main' : 'error.main'} 
                sx={{ fontWeight: 'bold' }}
              >
                R$ {resumoFinanceiro?.resumo?.saldo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div" color="text.secondary">
                  Cultos
                </Typography>
                <EventIcon color="success" fontSize="large" />
              </Box>
              <Typography variant="h4" component="div" color="success.main" sx={{ fontWeight: 'bold' }}>
                {estatisticasCultos?.totais?.total_cultos || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {estatisticasCultos?.totais?.total_participantes || '0'} participantes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
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
        
        {/* Gráfico de Cultos por Tipo */}
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
        
        {/* Card com estatísticas de cultos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Estatísticas de Cultos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Cultos
                  </Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {estatisticasCultos?.totais?.total_cultos || '0'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total de Participantes
                  </Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {estatisticasCultos?.totais?.total_participantes || '0'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Conversões
                  </Typography>
                  <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>
                    {estatisticasCultos?.totais?.total_conversoes || '0'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Batismos
                  </Typography>
                  <Typography variant="h5" color="secondary" sx={{ fontWeight: 'bold' }}>
                    {estatisticasCultos?.totais?.total_batismos || '0'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Dízimos
                  </Typography>
                  <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                    R$ {estatisticasCultos?.totais?.total_dizimos?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ofertas
                  </Typography>
                  <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                    R$ {estatisticasCultos?.totais?.total_ofertas?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
