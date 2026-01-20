import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Paper, Typography, Box, Button, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ButtonGroup, Divider, FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getWorkOrders } from '../services/api';
import API from '../services/api'; 

const InvoiceGenerator = () => {
  const [workItems, setWorkItems] = useState([]);
  const [selected, setSelected] = useState({});
  const [savedInvoices, setSavedInvoices] = useState([]);
  const navigate = useNavigate();

  const [viewingInvoiceType, setViewingInvoiceType] = useState('All'); // Default to 'All'
  const [vendorFilter, setVendorFilter] = useState('All Vendors');

  const fetchWorkItems = async () => {
    try {
      const response = await getWorkOrders();
      const allItems = (response.data.data || []).flatMap(order => 
        order.workItems.map(item => ({ ...item, parent: order }))
      );
      setWorkItems(allItems);
    } catch (error) {
      console.error("Failed to fetch work items", error);
    }
  };

  const fetchSavedInvoices = async () => {
      try {
          const response = await API.get('/invoices');
          setSavedInvoices(response.data.data || []);
      } catch (error) {
          console.error("Failed to fetch saved invoices", error);
      }
  };

  useEffect(() => {
    fetchWorkItems();
    fetchSavedInvoices();
  }, []);

  const invoiceStatusMap = useMemo(() => {
    const statusMap = {};
    for (const invoice of savedInvoices) {
      for (const workItemId of invoice.workItems) {
        if (!statusMap[workItemId]) { statusMap[workItemId] = {}; }
        statusMap[workItemId][invoice.invoiceType] = true;
      }
    }
    return statusMap;
  }, [savedInvoices]);

  const handleSelect = (itemId) => {
    setSelected(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };
  
  const getSelectedItems = () => {
      return workItems.filter(item => selected[item._id]);
  };

  const handleGenerate = async (type) => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      alert('Please select at least one work item.');
      return;
    }
    const route = type === 'WorkOrder' ? '/workorder-invoice' : '/vendor-invoice';
    navigate(route, { state: { items: selectedItems, invoiceType: type } });
  };

  const handleViewSavedInvoice = (savedInvoice, type) => {
    const itemsForInvoice = workItems.filter(item => savedInvoice.workItems.includes(item._id));
    if (itemsForInvoice.length === 0) {
        alert("The original work items for this saved invoice could not be found.");
        return;
    }
    const route = type === 'WorkOrder' ? '/workorder-invoice' : '/vendor-invoice';
    navigate(route, { state: { items: itemsForInvoice, savedInvoice: true, invoiceNumber: savedInvoice.invoiceNumber } });
  };

  const filteredSavedInvoices = useMemo(() => {
      let invoices = savedInvoices;

      if (viewingInvoiceType !== 'All') {
          invoices = invoices.filter(invoice => invoice.invoiceType === viewingInvoiceType);
      }

      if (vendorFilter !== 'All Vendors') {
          invoices = invoices.filter(invoice => invoice.parentOrderInfo?.vendor === vendorFilter);
      }
      
      if (viewingInvoiceType === 'All') {
          const groupedInvoices = new Map();
          invoices.forEach(invoice => {
              if (!groupedInvoices.has(invoice.invoiceNumber)) {
                  groupedInvoices.set(invoice.invoiceNumber, { ...invoice, types: new Set() });
              }
              groupedInvoices.get(invoice.invoiceNumber).types.add(invoice.invoiceType);
          });
          return Array.from(groupedInvoices.values());
      }

      return invoices;
  }, [savedInvoices, viewingInvoiceType, vendorFilter]);

  return (
    <Container>
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Generate Invoice
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Select the work items you want to include in the invoice.
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
                <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Entry No.</TableCell>
                    <TableCell align="center">Vendor Invoice</TableCell>
                    <TableCell align="center">Work Order Invoice</TableCell>
                    <TableCell>Event Name</TableCell>
                    <TableCell>PO/NPO</TableCell>
                    <TableCell>Event Date</TableCell>
                    <TableCell>Work Type</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {workItems.map((item) => {
                const hasVendorInvoice = invoiceStatusMap[item._id]?.Vendor || false;
                const hasWorkOrderInvoice = invoiceStatusMap[item._id]?.WorkOrder || false;
                return (
                    <TableRow key={item._id} hover >
                      <TableCell padding="checkbox">
                        <Checkbox 
                            checked={!!selected[item._id]}
                            onChange={() => handleSelect(item._id)}
                        />
                      </TableCell>
                      <TableCell>{item.parent.entryNumber}</TableCell>
                      <TableCell align="center">
                        <Checkbox checked={hasVendorInvoice} disabled />
                      </TableCell>
                      <TableCell align="center">
                        <Checkbox checked={hasWorkOrderInvoice} disabled />
                      </TableCell>
                      <TableCell>{item.eventName}</TableCell>
                      <TableCell>{item.poNpo}</TableCell>
                      <TableCell>{new Date(item.parent.eventDate).toLocaleDateString()}</TableCell>
                      <TableCell>{item.workMain.replaceAll('_', ' ')}</TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large" 
            onClick={() => handleGenerate('Vendor')}
            sx={{ minWidth: '200px' }}
          >
            Preview Vendor Invoice
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={() => handleGenerate('WorkOrder')}
            sx={{ minWidth: '200px' }}
          >
            Preview Work Order Invoice
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
              Saved Invoices
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center" justifyContent="center">
              <Grid item>
                <ButtonGroup>
                    <Button variant={viewingInvoiceType === 'All' ? 'contained' : 'outlined'} onClick={() => setViewingInvoiceType('All')}>All Invoices</Button>
                    <Button variant={viewingInvoiceType === 'Vendor' ? 'contained' : 'outlined'} onClick={() => setViewingInvoiceType('Vendor')}>Vendor Invoices</Button>
                    <Button variant={viewingInvoiceType === 'WorkOrder' ? 'contained' : 'outlined'} onClick={() => setViewingInvoiceType('WorkOrder')}>Work Order Invoices</Button>
                </ButtonGroup>
              </Grid>
              <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size="small">
                      <InputLabel>Filter by Vendor</InputLabel>
                      <Select
                          value={vendorFilter}
                          label="Filter by Vendor"
                          onChange={(e) => setVendorFilter(e.target.value)}
                      >
                          <MenuItem value="All Vendors">All Vendors</MenuItem>
                          <MenuItem value="ICOMP SYSTEMS">ICOMP SYSTEMS</MenuItem>
                          <MenuItem value="STUDIO VISION">STUDIO VISION</MenuItem>
                          <MenuItem value="WAGHSONS PHOTO VISION">WAGHSONS PHOTO VISION</MenuItem>
                      </Select>
                  </FormControl>
              </Grid>
          </Grid>
          <Divider sx={{ mb: 3 }} />

          {filteredSavedInvoices.length > 0 ? (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date Saved</TableCell>
                            <TableCell>Invoice Number</TableCell>
                            <TableCell>Event Name(s)</TableCell>
                            <TableCell>PO/NPO</TableCell>
                            <TableCell>Vendor</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSavedInvoices.map(invoice => {
                            const eventNames = workItems.filter(item => invoice.workItems.includes(item._id)).map(item => item.eventName);
                            const uniqueEventNames = [...new Set(eventNames)];
                            const displayEventName = uniqueEventNames.join(' and ') || 'N/A';
                            const displayPoNpo = workItems.find(item => invoice.workItems.includes(item._id))?.poNpo || 'N/A';
                            
                            return (
                              <TableRow key={invoice.invoiceNumber || invoice._id}>
                                  <TableCell>{new Date(invoice.createdAt).toLocaleString()}</TableCell>
                                  <TableCell>{invoice.invoiceNumber}</TableCell>
                                  <TableCell>{displayEventName}</TableCell>
                                  <TableCell>{displayPoNpo}</TableCell>
                                  <TableCell>{invoice.parentOrderInfo?.vendor}</TableCell>
                                  <TableCell>
                                      <ButtonGroup variant="outlined" size="small">
                                          { (viewingInvoiceType === 'All' ? invoice.types.has('Vendor') : true) && viewingInvoiceType !== 'WorkOrder' &&
                                              <Button onClick={() => handleViewSavedInvoice(invoice, 'Vendor')}>Vendor Invoice</Button>
                                          }
                                          { (viewingInvoiceType === 'All' ? invoice.types.has('WorkOrder') : true) && viewingInvoiceType !== 'Vendor' &&
                                              <Button onClick={() => handleViewSavedInvoice(invoice, 'WorkOrder')}>Work Order Invoice</Button>
                                          }
                                      </ButtonGroup>
                                  </TableCell>
                              </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
          ) : (
              <Typography align="center" color="text.secondary">
                  {`No ${vendorFilter === 'All Vendors' ? '' : vendorFilter} ${viewingInvoiceType === 'All' ? '' : viewingInvoiceType} invoices found.`}
              </Typography>
          )}
      </Paper>
    </Container>
  );
};
export default InvoiceGenerator;