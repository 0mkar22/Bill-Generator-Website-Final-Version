import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const InvoiceSwitcher = () => {
  const [entryNumber, setEntryNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!entryNumber) {
      setError('Please enter an Entry Number.');
      return;
    }
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/workOrders');
      const workOrders = response.data.data || [];
      const foundOrder = workOrders.find(order => order.entryNumber === entryNumber);

      if (foundOrder) {
        navigate(`/workorder-invoice/${foundOrder._id}`);
      } else {
        setError('Work Order with this Entry Number not found.');
      }
    } catch (err) {
      setError('Failed to fetch work orders. Please try again.');
      console.error(err);
    }
  };

  return (
    <Container>
      <Paper sx={{ p: 4, mt: 4, maxWidth: 'md', mx: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center">
          Find Work Order Invoice
        </Typography>
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Enter Work Order Entry Number"
            variant="outlined"
            value={entryNumber}
            onChange={(e) => setEntryNumber(e.target.value)}
            error={!!error}
            helperText={error}
          />
          <Button variant="contained" size="large" onClick={handleSearch}>
            Find Invoice
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 4 }}>OR</Divider>

      <Paper sx={{ p: 4, maxWidth: 'md', mx: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center">
          Create Manual Invoice
        </Typography>
        <Box sx={{ mt: 2 }}>
            <Button 
                variant="contained" 
                color="secondary" 
                size="large" 
                fullWidth 
                onClick={() => navigate('/vendor-invoice')}
            >
                Go to Vendor Invoice Page
            </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InvoiceSwitcher;