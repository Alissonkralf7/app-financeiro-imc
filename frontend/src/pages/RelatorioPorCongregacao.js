import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  People as PeopleIcon,
  Church as ChurchIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { financeiroService, cultoService, congregacaoService, membroService } from '../services/api';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

const RelatorioPorCongregacao = () => {
  const theme = useTheme();
  const { usuario } = useAuth();
  const { congregacaoId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [congregacao, setCongregacao] = useState(null);
  const [resumoFinanceiro, setResumoFinanceiro] = useState(null);
  const [estatisticasCultos, setEstatisticasCultos] = useState(null);
  const [estatisticasMembros, setEstatisticasMembros] = useState(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('mes');
  const [proximosCultos, setProximosCultos] = useState([]);
  const [ultimasTransacoes, setUltimasTransacoes] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      setError('');
      try {
        // Verificar se o usuário tem permissão para acessar esta congregação
        if (usuario.perfil !== 'admin_global' && usuario.perfil !== 'diretor' && usuario.congregacao?.id !== parseInt(congregacaoId)) {
          setError('Você não tem permissão para acessar esta congregação');
          setLoading(false);
          return;
        }

        // Carregar dados da congregação
        const congregacaoResponse = await congregacaoService.getCongregacaoPorId(congregacaoId);
        setCongregacao(congregacaoResponse.congregacao);

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
          data_fim: dataFimFormatada,
          congregacao_id: congregacaoId
        };
        
        // Carregar dados financeiros da congregação
        const resumoFinanceiroResponse = await financeiroService.getResumoFinanceiroCongregacao(congregacaoId, params);
        setResumoFinanceiro(resumoFinanceiroResponse);
        
        // Carregar estatísticas de cultos da congregação
        const estatisticasCultosResponse = await cultoService.getEstatisticasCultosCongregacao(congregacaoId, params);
        setEstatisticasCultos(estatisticasCultosResponse);
        
        // Carregar estatísticas de membros da congregação
        const estatisticasMembrosResponse = await membroService.getEstatisticasMembros({ congregacao_id: congregacaoId });
        setEstatisticasMembros(estatisticasMembrosResponse);
        
        // Carregar próximos cultos
        const proximosCultosResponse = await cultoService.getProximosCultos({ 
          congregacao_id: congregacaoId,
          limit: 5
        });
        setProximosCultos(proximosCultosResponse.cultos);
        
        // Carregar últimas transações
        const ultimasTransacoesResponse = await financeiroService.getTransacoes({ 
          congregacao_id: congregacaoId,
          limit: 5,
          sort: 'data:desc'
        });
        setUltimasTransacoes(ultimasTransacoesResponse.transacoes);
      } catch (error) {
        console.error('Erro ao carregar relatório da congregação:', error);
        setError('Erro ao carregar dados. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    if (congregacaoId) {
      carregarDados();
    }
  }, [congregacaoId, periodoSelecionado, usuario]);

  // Dados para o gráfico de receitas por categoria
  const dadosGraficoReceitas = {
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

  // Dados para o gráfico de membros por cargo
  const dadosGraficoMembros = {
    labels: estatisticasMembros?.membrosPorCargo?.map(item => item.cargo) || [],
    datasets: [
      {
        label: 'Membros por Cargo',
        data: estatisticasMembros?.membrosPorCargo?.map(item => item.total) || [],
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

  // Renderizar erro
  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Relatório: {congregacao?.nome}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {congregacao?.endereco?.cidade}, {congregacao?.endereco?.estado}
          </Typography>
        </Box>
        
        <Box>
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
                  Membros
                </Typography>
                <PeopleIcon color="success" fontSize="large" />
              </Box>
              <Typography variant="h4" component="div" color="success.main" sx={{ fontWeight: 'bold' }}>
                {estatisticasMembros?.totalMembros || '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {estatisticasMembros?.membrosPorStatus?.find(item => item.status === 'ATIVO')?.total || '0'} ativos
              </Typography>
            </CardContent>
          </Card>
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
              <Bar data={dadosGraficoReceitas} options={opcoesGrafico} />
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
        
        {/* Gráfico de Membros por Cargo */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Membros por Cargo
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Pie data={dadosGraficoMembros} options={opcoesGrafico} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Próximos cultos e últimas transações */}
      <Grid container spacing={3}>
        {/* Próximos cultos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Próximos Cultos
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {proximosCultos.length > 0 ? (
              <List>
                {proximosCultos.map((culto) => (
                  <ListItem key={culto.id} divider>
                    <ListItemIcon>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={culto.titulo}
                      secondary={`${new Date(culto.data).toLocaleDateString('pt-BR')} - ${culto.tipo}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Nenhum culto agendado
              </Typography>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/relatorios/cultos')}
              >
                Ver todos os cultos
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Últimas transações */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Últimas Transações
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {ultimasTransacoes.length > 0 ? (
              <List>
                {ultimasTransacoes.map((transacao) => (
                  <ListItem key={transacao.id} divider>
                    <ListItemIcon>
                      <MoneyIcon color={transacao.tipo === 'RECEITA' ? 'primary' : 'secondary'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={transacao.descricao}
                      secondary={`${new Date(transacao.data).toLocaleDateString('pt-BR')} - ${transacao.categoria}`}
                    />
                    <Typography 
                      variant="body2" 
                      color={transacao.tipo === 'RECEITA' ? 'primary.main' : 'secondary.main'}
                      sx={{ fontWeight: 'bold', ml: 2 }}
                    >
                      R$ {parseFloat(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Nenhuma transação registrada
              </Typography>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/relatorios/financeiro')}
              >
                Ver todas as transações
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RelatorioPorCongregacao;
