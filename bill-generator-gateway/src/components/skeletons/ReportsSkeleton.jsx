import React from 'react';
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Grid
} from '@mui/material';
import TableSkeleton from './TableSkeleton';

const ReportsSkeleton = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Title */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Skeleton variant="text" width={220} height={42} sx={{ mx: 'auto', mb: 1 }} />
      </Box>

      {/* Filter Card */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '12px'
        }}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
        </Grid>

        {/* Export Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Skeleton variant="rounded" width={110} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={140} height={36} />
        </Box>

        {/* Report Table */}
        <TableSkeleton columns={9} rows={7} hasSearch={false} hasPagination={true} />
      </Paper>
    </Container>
  );
};

export default ReportsSkeleton;
