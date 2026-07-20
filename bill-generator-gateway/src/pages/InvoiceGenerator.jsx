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
  const [viewingInvoiceType, setViewingInvoiceType] = useState('All'); 
  const [vendorFilter, setVendorFilter] = useState('All Vendors');

  const fetchWorkItems = async () => {
    try {
      const response = await getWorkOrders();
      const allItems = (response.data.data || []).flatMap(order =>
         order.workItems.map((item, index) => {
             // BULLETPROOF ID: Fallback to the physical entry number if DB IDs are acting up
             const uniqueId = item.id || item._id || `entry-${order.entryNumber}-item-${index}`;
             return { ...item, id: uniqueId, parent: order };
         })
      );
      setWorkItems(allItems);
    } catch (error) {
      console.error("Failed to fetch work items", error);
    }
  };

  const fetchSavedInvoices = async () => {
      try {
          const response = await API.get('/invoices');
          const invoices = response.data.data || [];
          
          // Force parse workItems to ensure they are always valid arrays
          const normalized = invoices.map(inv => {
              let parsedItems = [];
              if (Array.isArray(inv.workItems)) {
                  parsedItems = inv.workItems;
              } else if (typeof inv.workItems === 'string') {
                  try { parsedItems = JSON.parse(inv.workItems); } catch(e) {}
              }
              return { ...inv, workItems: parsedItems };
          });
          setSavedInvoices(normalized);
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
      const items = Array.isArray(invoice.workItems) ? invoice.workItems : [];
      for (const workItemId of items) {
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
      return workItems.filter(item => selected[item.id]);
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
    const invItems = Array.isArray(savedInvoice.workItems) ? savedInvoice.workItems : [];
    const itemsForInvoice = workItems.filter(item => invItems.includes(item.id));
    
    if (itemsForInvoice.length === 0) {
        alert(`Corrupted Invoice Data.\n\nThis invoice was saved with a broken reference before the database was fixed. Please generate a new invoice.`);
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
                const hasVendorInvoice = invoiceStatusMap[item.id]?.Vendor || false;
                const hasWorkOrderInvoice = invoiceStatusMap[item.id]?.WorkOrder || false;
                return (
                    <TableRow key={item.id} hover >
                      <TableCell padding="checkbox">
                        <Checkbox 
                            checked={!!selected[item.id]}
                            onChange={() => handleSelect(item.id)}
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
                      <TableCell>{item.parent.eventDate ? new Date(item.parent.eventDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{item.workMain ? item.workMain.replaceAll('_', ' ') : 'N/A'}</TableCell>
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
                        {filteredSavedInvoices.map((invoice, i) => {
                            const invItems = Array.isArray(invoice.workItems) ? invoice.workItems : [];
                            const eventNames = workItems.filter(item => invItems.includes(item.id)).map(item => item.eventName);
                            const uniqueEventNames = [...new Set(eventNames)];
                            const displayEventName = uniqueEventNames.join(' and ') || 'N/A';
                            const displayPoNpo = workItems.find(item => invItems.includes(item.id))?.poNpo || 'N/A';
                            
                            return (
                              <TableRow key={invoice.invoiceNumber || invoice.id || invoice._id || i}>
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