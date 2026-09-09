import React from 'react';
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Grid
} from '@mui/material';
import TableSkeleton from './TableSkeleton';

const AmountPaidSkeleton = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Skeleton variant="text" width={280} height={44} sx={{ mx: 'auto', mb: 1 }} />
      </Box>

      <Grid container spacing={4}>
        {/* Paid Invoices Card */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(24, 24, 27, 0.50)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: '12px'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={160} height={30} />
            </Box>
            <TableSkeleton columns={6} rows={5} hasSearch={false} hasPagination={false} />
          </Paper>
        </Grid>

        {/* Personnel Payouts Card */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(24, 24, 27, 0.50)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: '12px'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5,
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Skeleton variant="text" width={200} height={30} />
              </Box>
              <Skeleton variant="rounded" width={180} height={38} />
            </Box>
            <TableSkeleton columns={5} rows={5} hasSearch={false} hasPagination={false} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AmountPaidSkeleton;
