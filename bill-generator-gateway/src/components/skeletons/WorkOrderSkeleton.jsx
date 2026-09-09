import React from 'react';
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Grid
} from '@mui/material';

const WorkOrderSkeleton = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Skeleton
          variant="text"
          width={280}
          height={44}
          sx={{ mx: 'auto', mb: 1 }}
        />
        <Skeleton
          variant="text"
          width={380}
          height={24}
          sx={{ mx: 'auto' }}
        />
      </Box>

      {/* Main Order Details Card */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '12px'
        }}
      >
        <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
        </Grid>
      </Paper>

      {/* Work Item Section */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '12px'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={140} height={28} />
          <Skeleton variant="rounded" width={120} height={36} />
        </Box>

        {/* Item Accordion Card */}
        <Paper
          sx={{
            p: 2.5,
            backgroundColor: 'rgba(9, 9, 11, 0.40)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="text" width={160} height={24} />
            <Skeleton variant="circular" width={24} height={24} />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Skeleton variant="rounded" width="100%" height={40} />
            </Grid>
          </Grid>

          {/* Personnel Rows Placeholder */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <Skeleton variant="text" width={180} height={22} sx={{ mb: 1.5 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Skeleton variant="rounded" width="100%" height={36} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Skeleton variant="rounded" width="100%" height={36} />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Paper>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Skeleton variant="rounded" width={220} height={46} sx={{ borderRadius: '8px' }} />
      </Box>
    </Container>
  );
};

export default WorkOrderSkeleton;
