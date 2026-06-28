import { useMemo, useState } from 'react';
import { AppBar, Avatar, Box, Button, Chip, Container, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { Assessment, CalendarMonth, ContentCut, Dashboard, Logout, Menu, Reviews, RoomService } from '@mui/icons-material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalBusy } from '../../hooks/useGlobalBusy.ts';

const drawerWidth = 260;
const mobileDrawerWidth = 'min(88vw, 320px)';

const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isGlobalBusy } = useGlobalBusy();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
      { label: 'Servicios', path: '/servicios', icon: <RoomService /> },
      { label: 'Barberos', path: '/barberos', icon: <ContentCut /> },
      { label: 'Valoraciones', path: '/valoraciones', icon: <Reviews /> },
      { label: 'Reportes', path: '/reportes', icon: <Assessment /> },
      { label: 'Horarios', path: '/horarios', icon: <CalendarMonth /> },
    ],
    [],
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const currentSection = useMemo(() => {
    const found = navItems.find((item) => item.path === pathname);
    return found?.label ?? 'Panel';
  }, [navItems, pathname]);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fafbff' }}>
      <Toolbar sx={{ minHeight: { xs: 68, md: 74 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: '#111827', width: 34, height: 34 }}>B</Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '0.98rem', md: '1rem' } }}>
            Diamond BarberHub
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Panel Admin
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: { xs: 1.25, md: 1 }, py: { xs: 1.5, md: 2 }, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              selected={isActive}
              sx={{ mb: 0.6, minHeight: { xs: 46, md: 42 }, borderRadius: 2, border: '1px solid', borderColor: isActive ? 'primary.main' : 'transparent', bgcolor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent', '&:hover': { bgcolor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(15, 23, 42, 0.04)' } }}
            >
              <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth color="error" variant="outlined" startIcon={<Logout />} onClick={logout}>
          Cerrar sesion
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#f6f8fc',
        backgroundImage: { xs: 'radial-gradient(circle at top left, rgba(25,118,210,0.14) 0%, rgba(25,118,210,0.08) 18%, rgba(25,118,210,0.03) 34%, transparent 62%)', sm: 'radial-gradient(900px 380px at -10% -18%, rgba(25,118,210,0.12), transparent 60%)', md: 'radial-gradient(1300px 500px at -5% -20%, rgba(25,118,210,0.10), transparent 60%)' },
        backgroundRepeat: 'no-repeat',
        overflowX: 'hidden',
      }}
    >
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(6px)', width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` } }}>
        <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: { xs: 64, sm: 70 } }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}>
            <Menu />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
              Panel Administrativo
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.70rem', sm: '0.75rem' } }}>
              Seccion actual: {currentSection}
            </Typography>
          </Box>
          {isGlobalBusy && <Chip size="small" color="warning" label="Procesando cambios" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
          <Avatar sx={{ width: { xs: 30, sm: 32 }, height: { xs: 30, sm: 32 } }}>{user?.initials ?? 'A'}</Avatar>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.displayName ?? 'Administrador'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: mobileDrawerWidth, boxSizing: 'border-box' } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Container sx={{ py: { xs: 2.5, md: 4 }, px: { xs: 1.5, sm: 2.5, md: 3 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;
