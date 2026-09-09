import React from 'react';
import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const TableSkeleton = ({
  columns = 6,
  rows = 6,
  hasSearch = true,
  hasPagination = true,
  title = null,
  subtitle = null,
  headerAction = null,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Optional Title & Subtitle */}
      {(title || subtitle) && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          {title && (
            <Skeleton
              variant="text"
              width={260}
              height={40}
              sx={{ mx: 'auto', mb: 1 }}
            />
          )}
          {subtitle && (
            <Skeleton
              variant="text"
              width={420}
              height={22}
              sx={{ mx: 'auto' }}
            />
          )}
        </Box>
      )}

      {/* Action / Search Bar */}
      {(hasSearch || headerAction) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          {headerAction ? (
            <Skeleton variant="rounded" width={140} height={36} />
          ) : (
            <Box />
          )}
          {hasSearch && (
            <Skeleton
              variant="rounded"
              width={{ xs: '100%', sm: 280 }}
              height={36}
            />
          )}
        </Box>
      )}

      {/* Table Container */}
      <TableContainer
        component={Paper}
        sx={{
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: 'rgba(9, 9, 11, 0.65)' }}>
            <TableRow>
              {Array.from({ length: columns }).map((_, idx) => (
                <TableCell key={`th-skel-${idx}`}>
                  <Skeleton
                    variant="text"
                    width={idx === 0 ? 30 : idx === 1 ? 90 : 70}
                    height={20}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.10)'
                    }}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <TableRow
                key={`tr-skel-${rIdx}`}
                sx={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  bgcolor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                }}
              >
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <TableCell key={`td-skel-${rIdx}-${cIdx}`} sx={{ py: 1.5 }}>
                    <Skeleton
                      variant="rounded"
                      width={
                        cIdx === 0
                          ? 24
                          : cIdx === 1
                          ? '60%'
                          : cIdx === columns - 1
                          ? '40%'
                          : '80%'
                      }
                      height={18}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Skeleton */}
        {hasPagination && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              p: 1.5,
              gap: 2,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="rounded" width={80} height={28} />
          </Box>
        )}
      </TableContainer>
    </Box>
  );
};

export default TableSkeleton;
