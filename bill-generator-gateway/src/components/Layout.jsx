import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  CssBaseline,
  AppBar,
  Box,
  Button,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { supabase } from '../supabase';

const drawerWidth = 260;

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { path: '/', label: 'Executive Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { path: '/work-orders', label: 'Work Orders / Events', icon: <WorkIcon fontSize="small" /> },
    { path: '/invoices', label: 'Invoices', icon: <DescriptionIcon fontSize="small" /> },
    { path: '/reports', label: 'Reports', icon: <AssessmentIcon fontSize="small" /> },
    { path: '/amount-paid', label: 'Amount Paid', icon: <AccountBalanceWalletIcon fontSize="small" /> },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', p: 2 }}>
      <Box>
        {/* Brand Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 2, mb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.10)' }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            bgcolor: '#18181b',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: '#6366f1', boxShadow: '0 0 10px #6366f1' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Lumina Ledger
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '10px', fontFamily: '"JetBrains Mono", monospace' }}>
              BILL GENERATOR v2.0
            </Typography>
          </Box>
        </Box>

        {/* Navigation Items */}
        <List sx={{ pt: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/work-orders' && location.pathname === '/work-order');
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: '8px',
                  mb: 1,
                  px: 1.5,
                  py: 1,
                  transition: 'all 0.15s ease',
                  bgcolor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: isActive ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                  }
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 32,
                  color: isActive ? '#818cf8' : '#a1a1aa'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#f4f4f5' : '#a1a1aa',
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* System Status Footer */}
      <Box sx={{
        p: 1.5,
        borderRadius: '10px',
        bgcolor: 'rgba(24, 24, 27, 0.60)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, bgcolor: '#34d399' }} className="lumina-live-pulse" />
          <Typography sx={{ fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: '#a1a1aa' }}>
            Ledger Live
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '10px', fontFamily: '"JetBrains Mono", monospace', color: '#71717a' }}>
          99.98%
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#09090b' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'rgba(9, 9, 11, 0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
          color: '#f4f4f5',
          boxShadow: 'none',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div" sx={{ fontSize: '1.05rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#f4f4f5' }}>
              {navItems.find(item => item.path === location.pathname)?.label || 'Bill Generator'}
            </Typography>
          </Box>

          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon fontSize="small" />}
            sx={{
              color: '#a1a1aa',
              fontSize: '0.8rem',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              bgcolor: 'rgba(24, 24, 27, 0.50)',
              '&:hover': {
                color: '#f4f4f5',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.20)'
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{
            sx: {
              width: drawerWidth,
              bgcolor: 'rgba(9, 9, 11, 0.95)',
              backdropFilter: 'blur(24px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.10)',
              color: '#f4f4f5',
            }
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          PaperProps={{
            sx: {
              width: drawerWidth,
              bgcolor: 'rgba(9, 9, 11, 0.85)',
              backdropFilter: 'blur(24px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.10)',
              color: '#f4f4f5',
            }
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          maxWidth: '100%',
          overflowX: 'hidden',
          bgcolor: '#09090b',
          minHeight: '100vh',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.07) 0%, rgba(9, 9, 11, 0) 60%)'
        }}
      >
        <Toolbar />
        <Box key={location.pathname} className="lumina-page-enter">
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
