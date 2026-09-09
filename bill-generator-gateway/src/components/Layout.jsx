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
import WorkIcon from '@mui/icons-material/Work';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { supabase } from '../supabase';

const drawerWidth = 240;

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

  const getListItemStyle = (path) => ({
    bgcolor: location.pathname === path ? '#F3F4F6' : 'transparent',
    '&:hover': { bgcolor: '#F9FAFB' },
    borderRadius: '6px',
    mx: 1,
    mb: 0.5
  });

  const getListTextStyle = (path) => ({
    fontWeight: location.pathname === path ? 600 : 400,
    color: location.pathname === path ? '#0F172A' : '#475569'
  });

  const getIconStyle = (path) => ({
    color: location.pathname === path ? '#059669' : '#64748B',
    minWidth: '40px'
  });

  const drawerContent = (
    <>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #E5E7EB', minHeight: '64px' }}>
        <img src="/logo.PNG" alt="Company Logo" style={{ height: '32px' }} />
      </Box>
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          <ListItemButton component={Link} to="/" onClick={() => isMobile && setMobileOpen(false)} sx={getListItemStyle('/')}>
            <ListItemIcon sx={getIconStyle('/')}><WorkIcon /></ListItemIcon>
            <ListItemText primary="Event Data Entry" primaryTypographyProps={getListTextStyle('/')} />
          </ListItemButton>
          <ListItemButton component={Link} to="/invoices" onClick={() => isMobile && setMobileOpen(false)} sx={getListItemStyle('/invoices')}>
            <ListItemIcon sx={getIconStyle('/invoices')}><DescriptionIcon /></ListItemIcon>
            <ListItemText primary="Invoices" primaryTypographyProps={getListTextStyle('/invoices')} />
          </ListItemButton>
          <ListItemButton component={Link} to="/reports" onClick={() => isMobile && setMobileOpen(false)} sx={getListItemStyle('/reports')}>
            <ListItemIcon sx={getIconStyle('/reports')}><AssessmentIcon /></ListItemIcon>
            <ListItemText primary="Reports" primaryTypographyProps={getListTextStyle('/reports')} />
          </ListItemButton>
          <ListItemButton component={Link} to="/amount-paid" onClick={() => isMobile && setMobileOpen(false)} sx={getListItemStyle('/amount-paid')}>
            <ListItemIcon sx={getIconStyle('/amount-paid')}><AccountBalanceWalletIcon /></ListItemIcon>
            <ListItemText primary="Amount Paid" primaryTypographyProps={getListTextStyle('/amount-paid')} />
          </ListItemButton>
        </List>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className="bg-white border-b border-gray-200 shadow-sm"
        sx={{ 
          bgcolor: 'white', 
          color: '#0F172A', 
          boxShadow: 'none', 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1 
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: '1.2rem', fontWeight: 600 }}>
            Bill Generator
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' } }}
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
          PaperProps={{ sx: { borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' } }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: 3, maxWidth: '100%', overflowX: 'hidden' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
