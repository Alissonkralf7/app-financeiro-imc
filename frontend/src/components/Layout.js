import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Avatar, 
  Menu, 
  MenuItem, 
  Collapse,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  AttachMoney as MoneyIcon,
  Church as ChurchIcon,
  People as PeopleIcon,
  BarChart as ChartIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Report as ReportIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Importar o logotipo da IMC
import logo from '../assets/logo-imc.png';

const drawerWidth = 260;

const Layout = () => {
  const theme = useTheme();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCongregacoes, setMenuCongregacoes] = useState(false);
  const [menuRelatorios, setMenuRelatorios] = useState(false);
  
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  
  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleProfile = () => {
    handleClose();
    navigate('/perfil');
  };
  
  const handleMenuClick = (path) => {
    navigate(path);
  };
  
  const toggleMenuCongregacoes = () => {
    setMenuCongregacoes(!menuCongregacoes);
  };
  
  const toggleMenuRelatorios = () => {
    setMenuRelatorios(!menuRelatorios);
  };
  
  // Verificar se o usuário tem permissão para acessar recursos administrativos
  const isAdmin = usuario?.perfil === 'admin_global' || usuario?.perfil === 'diretor';
  
  // Verificar se o usuário é pastor
  const isPastor = usuario?.perfil === 'pastor';
  
  // ID da congregação do usuário (para pastores)
  const congregacaoId = usuario?.congregacao?.id;
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            APP Financeiro IMC Mundial
          </Typography>
          
          {usuario && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 2 }}>
                {usuario.nome}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  {usuario.nome.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <AccountIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Meu Perfil</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sair</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            ...(open ? {
              overflowX: 'hidden',
            } : {
              overflowX: 'hidden',
              width: theme.spacing(7),
            }),
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: [1],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Box 
              component="img" 
              src={logo} 
              alt="Logo IMC Mundial" 
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 1 
              }} 
            />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              IMC Mundial
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {/* Dashboard */}
          <ListItem 
            button 
            onClick={() => handleMenuClick(isAdmin ? '/dashboard' : `/congregacoes/${congregacaoId}/dashboard`)}
            selected={location.pathname === '/dashboard' || location.pathname === `/congregacoes/${congregacaoId}/dashboard`}
          >
            <ListItemIcon>
              <DashboardIcon color={location.pathname === '/dashboard' || location.pathname === `/congregacoes/${congregacaoId}/dashboard` ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          
          {/* Congregações - apenas para admin */}
          {isAdmin && (
            <>
              <ListItem button onClick={toggleMenuCongregacoes}>
                <ListItemIcon>
                  <ChurchIcon />
                </ListItemIcon>
                <ListItemText primary="Congregações" />
                {menuCongregacoes ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={menuCongregacoes} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem 
                    button 
                    sx={{ pl: 4 }} 
                    onClick={() => handleMenuClick('/gerenciamento/congregacoes')}
                    selected={location.pathname === '/gerenciamento/congregacoes'}
                  >
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Gerenciar" />
                  </ListItem>
                </List>
              </Collapse>
            </>
          )}
          
          {/* Membros */}
          <ListItem 
            button 
            onClick={() => handleMenuClick('/gerenciamento/membros')}
            selected={location.pathname === '/gerenciamento/membros'}
          >
            <ListItemIcon>
              <PeopleIcon color={location.pathname === '/gerenciamento/membros' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Membros" />
          </ListItem>
          
          {/* Relatórios */}
          <ListItem button onClick={toggleMenuRelatorios}>
            <ListItemIcon>
              <ReportIcon />
            </ListItemIcon>
            <ListItemText primary="Relatórios" />
            {menuRelatorios ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={menuRelatorios} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem 
                button 
                sx={{ pl: 4 }} 
                onClick={() => handleMenuClick(isAdmin ? '/relatorios/financeiro' : `/congregacoes/${congregacaoId}/relatorios`)}
                selected={location.pathname === '/relatorios/financeiro' || location.pathname === `/congregacoes/${congregacaoId}/relatorios`}
              >
                <ListItemIcon>
                  <MoneyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Financeiro" />
              </ListItem>
              <ListItem 
                button 
                sx={{ pl: 4 }} 
                onClick={() => handleMenuClick('/relatorios/cultos')}
                selected={location.pathname === '/relatorios/cultos'}
              >
                <ListItemIcon>
                  <ChartIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Cultos" />
              </ListItem>
            </List>
          </Collapse>
          
          {/* Análise Preditiva - apenas para admin */}
          {isAdmin && (
            <ListItem 
              button 
              onClick={() => handleMenuClick('/analise-predicao')}
              selected={location.pathname === '/analise-predicao'}
            >
              <ListItemIcon>
                <AnalyticsIcon color={location.pathname === '/analise-predicao' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Análise Preditiva" />
            </ListItem>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          {/* Perfil */}
          <ListItem 
            button 
            onClick={() => handleMenuClick('/perfil')}
            selected={location.pathname === '/perfil'}
          >
            <ListItemIcon>
              <AccountIcon color={location.pathname === '/perfil' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Meu Perfil" />
          </ListItem>
          
          {/* Logout */}
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
