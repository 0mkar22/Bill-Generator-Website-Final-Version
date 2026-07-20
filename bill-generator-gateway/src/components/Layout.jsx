import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  CssBaseline,
  AppBar,
  Box,
  Button
} from '@mui/material';
import { Link } from 'react-router-dom';
import WorkIcon from '@mui/icons-material/Work';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DescriptionIcon from '@mui/icons-material/Description';
import LogoutIcon from '@mui/icons-material/Logout';
import { supabase } from '../supabase'; // Import the Supabase client

const drawerWidth = 240;

const Layout = ({ children }) => {
  
  // Handle the logout process
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error logging out:", error.message);
    }
    // Note: App.jsx is listening for auth changes, so it will automatically kick the user back to the login screen!
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <img src="/ONGC logo.png" alt="logo" className="app-bar-logo" />
          
          {/* Added flexGrow to push the logout button to the far right */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Bill Generator
          </Typography>

          {/* New Logout Button */}
          <Button 
            color="inherit" 
            onClick={handleLogout} 
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem button component={Link} to="/">
              <ListItemIcon><WorkIcon /></ListItemIcon>
              <ListItemText primary="Event Data Entry" />
            </ListItem>
            <ListItem button component={Link} to="/invoices">
              <ListItemIcon><DescriptionIcon /></ListItemIcon>
              <ListItemText primary="Invoices" />
            </ListItem>
            <ListItem button component={Link} to="/reports">
              <ListItemIcon><AssessmentIcon /></ListItemIcon>
              <ListItemText primary="Reports" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;