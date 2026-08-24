import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Paper, Typography, Box, Button, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ButtonGroup,
  Divider, FormControl, InputLabel, Select, MenuItem, Grid, Snackbar, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { getWorkOrders } from '../services/api';
import API from '../services/api';
import { supabase } from '../supabase';

const InvoiceGenerator = () => {
  const [workItems, setWorkItems] = useState([]);
  const [selected, setSelected] = useState({});
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();
  const [viewingInvoiceType, setViewingInvoiceType] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from('companies').select('*');
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchWorkItems = async () => {
    try {
      const response = await getWorkOrders();
      const allItems = (response.data.data || []).flatMap(order =>
             (order.workItems || []).map((item, index) => {
             const uniqueId = item.id || `entry-${order.entryNumber}-item-${index}`;
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
    fetchCompanies();
    fetchWorkItems();
    fetchSavedInvoices();
  }, []);

  const isONGCCompany = (companyId, fallbackName = '') => {
      const company = companies.find(c => c.id === companyId);
      const nameStr = (company?.company_name || fallbackName || '').toUpperCase();
      return nameStr.includes('ONGC') || nameStr.includes('OIL & NATURAL GAS') || nameStr.includes('OIL AND NATURAL GAS');
  };

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
      setSnackbar({ open: true, message: 'Please select at least one work item.', severity: 'warning' });
      return;
    }
    const route = type === 'WorkOrder' ? '/workorder-invoice' : '/vendor-invoice';
    navigate(route, { state: { items: selectedItems, invoiceType: type } });
  };

  const handleViewSavedInvoice = (savedInvoice, type, isEditing = false) => {
    const invItems = Array.isArray(savedInvoice.workItems) ? savedInvoice.workItems : [];
    const itemsForInvoice = workItems.filter(item => invItems.includes(item.id));

    if (itemsForInvoice.length === 0) {
        setSnackbar({ open: true, message: 'Corrupted Invoice Data. This invoice was saved with a broken reference. Please generate a new invoice.', severity: 'error' });
        return;
    }

    const route = type === 'WorkOrder' ? '/workorder-invoice' : '/vendor-invoice';
    const currentInvoiceId = savedInvoice.id || savedInvoice._id; 
    
    navigate(route, { 
      state: { 
        items: itemsForInvoice, 
        savedInvoice: true, 
        isEditing, 
        invoiceId: currentInvoiceId, 
        invoiceNumber: savedInvoice.invoiceNumber, 
        invoiceDate: savedInvoice.createdAt, 
        recipient: savedInvoice.recipient, 
        dealingOfficer: savedInvoice.dealingOfficer, 
        emailId: savedInvoice.emailId, 
        vendorCode: savedInvoice.vendorCode, 
        poNumber: savedInvoice.poNumber, 
        poDate: savedInvoice.poDate, 
        serviceDescription: savedInvoice.serviceDescription, 
        gstNo: savedInvoice.gstNo 
      } 
    });
  };

  const handleEditWorkItem = (parentOrder) => {
    navigate('/work-order', { 
      state: { 
        isEditing: true, 
        recordId: parentOrder.id || parentOrder._id, 
        savedData: parentOrder,
        items: parentOrder.workItems || []
      } 
    });
  };

  const uniqueVendors = useMemo(() => {
    const vendors = new Set();
    savedInvoices.forEach(inv => {
      if (inv.parentOrderInfo?.vendor) vendors.add(inv.parentOrderInfo.vendor);
    });
    return Array.from(vendors);
  }, [savedInvoices]);

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

  const selectedItemsList = getSelectedItems();
  const showWorkOrderBtn = selectedItemsList.length === 0 || isONGCCompany(selectedItemsList[0].parent.company_id);

  return (
    <Container>
      <Paper sx={{ p: 4, mt: 4, bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
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
          {showWorkOrderBtn && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => handleGenerate('WorkOrder')}
              sx={{ minWidth: '200px' }}
            >
              Preview Work Order Invoice
            </Button>
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 4, mt: 4, bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
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
                          {uniqueVendors.map(v => (
                            <MenuItem key={v} value={v}>{v}</MenuItem>
                          ))}
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
                            
                            const isInvoiceONGC = isONGCCompany(invoice.company_id, invoice.recipient);

                            return (
                              <TableRow key={invoice.invoiceNumber || invoice.id || i}>
                                  <TableCell>{new Date(invoice.createdAt).toLocaleString()}</TableCell>
                                  <TableCell>{invoice.invoiceNumber}</TableCell>
                                  <TableCell>{displayEventName}</TableCell>
                                  <TableCell>{displayPoNpo}</TableCell>
                                  <TableCell>{invoice.parentOrderInfo?.vendor}</TableCell>
                                  <TableCell>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                          { (viewingInvoiceType === 'All' ? invoice.types.has('Vendor') : true) && viewingInvoiceType !== 'WorkOrder' &&
                                              <>
                                                  <Button 
                                                    variant="contained" 
                                                    color="primary" 
                                                    size="small"
                                                    startIcon={<ReceiptIcon />}
                                                    onClick={() => handleViewSavedInvoice(invoice, 'Vendor')}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)' }}
                                                  >
                                                      Vendor Invoice
                                                  </Button>
                                                  <Button 
                                                    variant="outlined" 
                                                    color="primary" 
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleViewSavedInvoice(invoice, 'Vendor', true)}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } }}
                                                  >
                                                      Edit Vendor
                                                  </Button>
                                              </>
                                          }
                                          { (viewingInvoiceType === 'All' ? invoice.types.has('WorkOrder') : true) && viewingInvoiceType !== 'Vendor' && isInvoiceONGC &&
                                              <>
                                                  <Button 
                                                    variant="contained" 
                                                    color="secondary" 
                                                    size="small"
                                                    startIcon={<AssignmentIcon />}
                                                    onClick={() => handleViewSavedInvoice(invoice, 'WorkOrder')}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(156, 39, 176, 0.2)' }}
                                                  >
                                                      Work Order Invoice
                                                  </Button>
                                                  <Button 
                                                    variant="outlined" 
                                                    color="secondary" 
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleViewSavedInvoice(invoice, 'WorkOrder', true)}
                                                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', borderWidth: '1.5px', '&:hover': { borderWidth: '1.5px' } }}
                                                  >
                                                      Edit Work Order
                                                  </Button>
                                              </>
                                          }
                                      </Box>
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

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InvoiceGenerator;