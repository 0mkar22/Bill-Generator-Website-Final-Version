import React from 'react';
import {
  Box,
  Container,
  Paper,
  Skeleton,
  Grid
} from '@mui/material';

const InvoiceSkeleton = () => {
  return (
    <Container sx={{ py: 3 }}>
      {/* Top Action Bar */}
      <Box
        sx={{
          my: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}
      >
        <Skeleton variant="rounded" width={90} height={36} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rounded" width={140} height={36} />
          <Skeleton variant="rounded" width={140} height={36} />
        </Box>
      </Box>

      {/* Invoice Document Placeholder */}
      <Paper
        sx={{
          p: 4,
          mt: 3,
          mb: 3,
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          width: '900px',
          maxWidth: '100%',
          margin: '0 auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Document Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Box sx={{ width: '45%' }}>
            <Skeleton variant="text" width={60} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
          <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Skeleton variant="rounded" width={180} height={60} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={18} />
            <Skeleton variant="text" width="65%" height={18} />
          </Box>
        </Box>

        {/* Meta details grid */}
        <Grid container spacing={2} sx={{ mb: 3, pb: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Grid item xs={6}>
            <Skeleton variant="text" width="70%" height={22} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={22} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="50%" height={22} />
          </Grid>
          <Grid item xs={6}>
            <Skeleton variant="text" width="65%" height={22} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="55%" height={22} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="75%" height={22} />
          </Grid>
        </Grid>

        {/* Table placeholder */}
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="rounded" width="100%" height={40} sx={{ mb: 1.5 }} />
          <Skeleton variant="rounded" width="100%" height={32} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="100%" height={32} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="100%" height={32} sx={{ mb: 1 }} />
        </Box>

        {/* Totals Calculation */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mb: 4 }}>
          <Skeleton variant="text" width={220} height={24} />
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="text" width={180} height={24} />
          <Skeleton variant="rounded" width={240} height={32} />
        </Box>

        {/* Signatures */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Skeleton variant="rounded" width={200} height={60} />
          <Skeleton variant="rounded" width={200} height={60} />
        </Box>
      </Paper>
    </Container>
  );
};

export default InvoiceSkeleton;
