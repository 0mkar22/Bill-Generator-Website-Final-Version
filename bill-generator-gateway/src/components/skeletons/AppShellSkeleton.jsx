import React from 'react';
import {
  Box,
  Skeleton,
  CssBaseline,
  ThemeProvider
} from '@mui/material';
import theme from '../../theme';

const drawerWidth = 260;

const AppShellSkeleton = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', bgcolor: '#09090b', minHeight: '100vh' }}>
        {/* Sidebar Skeleton */}
        <Box
          sx={{
            width: { xs: 0, md: drawerWidth },
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 2,
            borderRight: '1px solid rgba(255, 255, 255, 0.10)',
            bgcolor: 'rgba(9, 9, 11, 0.85)',
            backdropFilter: 'blur(24px)'
          }}
        >
          <Box>
            {/* Brand Logo Skeleton */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 2, mb: 3 }}>
              <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '8px' }} />
              <Box>
                <Skeleton variant="text" width={110} height={22} />
                <Skeleton variant="text" width={80} height={14} />
              </Box>
            </Box>

            {/* Nav Items Skeleton */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1 }}>
              <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: '8px' }} />
            </Box>
          </Box>

          {/* User / Logout area */}
          <Box sx={{ px: 1, pb: 1 }}>
            <Skeleton variant="rounded" width="100%" height={38} sx={{ borderRadius: '8px' }} />
          </Box>
        </Box>

        {/* Main Content Skeleton Area */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 4 },
            width: { md: `calc(100% - ${drawerWidth}px)` },
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          {/* Top Bar Skeleton */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Skeleton variant="rounded" width={160} height={32} />
            <Skeleton variant="circular" width={36} height={36} />
          </Box>

          {/* Page Content Skeleton */}
          <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%', pt: 2 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Skeleton variant="text" width={280} height={44} sx={{ mx: 'auto', mb: 1 }} />
              <Skeleton variant="text" width={400} height={22} sx={{ mx: 'auto' }} />
            </Box>

            {/* Metric / Input Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 4 }}>
              <Skeleton variant="rounded" width="100%" height={90} sx={{ borderRadius: '12px' }} />
              <Skeleton variant="rounded" width="100%" height={90} sx={{ borderRadius: '12px' }} />
              <Skeleton variant="rounded" width="100%" height={90} sx={{ borderRadius: '12px' }} />
              <Skeleton variant="rounded" width="100%" height={90} sx={{ borderRadius: '12px' }} />
            </Box>

            {/* Large Table or Form Skeleton */}
            <Skeleton variant="rounded" width="100%" height={360} sx={{ borderRadius: '12px' }} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AppShellSkeleton;
