import React from 'react';
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Grid
} from '@mui/material';

const cardStyle = {
  p: 3,
  backgroundColor: 'rgba(24, 24, 27, 0.50)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '12px',
  backdropFilter: 'blur(20px)'
};

const DashboardSkeleton = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }} className="lumina-page-enter">
      {/* Top Header & Greeting Area */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="text" width={220} height={36} />
          </Box>
          <Skeleton variant="text" width={320} height={20} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: '8px' }} />
        </Box>
      </Box>

      {/* 4-Column KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Paper sx={cardStyle}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="text" width={110} height={20} />
                <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '8px' }} />
              </Box>
              <Skeleton variant="text" width={160} height={44} sx={{ mb: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="rounded" width={60} height={20} sx={{ borderRadius: '4px' }} />
                <Skeleton variant="text" width={100} height={16} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Quick-Action Shortcuts Bar */}
      <Paper sx={{ ...cardStyle, p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant="circular" width={18} height={18} />
            <Skeleton variant="text" width={140} height={22} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={130} height={36} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={140} height={36} sx={{ borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={130} height={36} sx={{ borderRadius: '8px' }} />
          </Box>
        </Box>
      </Paper>

      {/* Split Section: Feed on Left (7 cols), Operations on Right (5 cols) */}
      <Grid container spacing={3}>
        {/* Left: Recent Activity Feed */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ ...cardStyle, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="circular" width={22} height={22} />
                <Skeleton variant="text" width={180} height={28} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rounded" width={60} height={28} sx={{ borderRadius: '6px' }} />
                <Skeleton variant="rounded" width={60} height={28} sx={{ borderRadius: '6px' }} />
                <Skeleton variant="rounded" width={60} height={28} sx={{ borderRadius: '6px' }} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <Box
                  key={row}
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: '8px' }} />
                    <Box>
                      <Skeleton variant="text" width={180} height={22} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width={120} height={16} />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Skeleton variant="text" width={90} height={24} sx={{ mb: 0.5, ml: 'auto' }} />
                    <Skeleton variant="text" width={60} height={16} sx={{ ml: 'auto' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Operational & Workforce Analytics */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Work Order Breakdown */}
            <Paper sx={cardStyle}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Skeleton variant="circular" width={22} height={22} />
                <Skeleton variant="text" width={160} height={26} />
              </Box>
              <Skeleton variant="text" width="100%" height={16} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" width="100%" height={10} sx={{ borderRadius: '5px', mb: 3 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Skeleton variant="rounded" width="100%" height={64} sx={{ borderRadius: '8px' }} />
                </Grid>
                <Grid item xs={6}>
                  <Skeleton variant="rounded" width="100%" height={64} sx={{ borderRadius: '8px' }} />
                </Grid>
              </Grid>
            </Paper>

            {/* Crew Deployment Stats */}
            <Paper sx={cardStyle}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Skeleton variant="circular" width={22} height={22} />
                <Skeleton variant="text" width={180} height={26} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: '8px' }} />
                <Skeleton variant="rounded" width="100%" height={48} sx={{ borderRadius: '8px' }} />
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardSkeleton;
