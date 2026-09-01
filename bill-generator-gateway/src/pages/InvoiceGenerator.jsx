import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Paper, Typography, Box, Button, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ButtonGroup,
  Divider, FormControl, InputLabel, Select, MenuItem, Grid, Snackbar, Alert, TablePagination, TextField, InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { getWorkOrders, getCompanies } from '../services/api';
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

  // Pagination & Search state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [savedPage, setSavedPage] = useState(0);
  const [savedRowsPerPage, setSavedRowsPerPage] = useState(10);

  const fetchCompanies = async () => {
    try {
      const response = await getCompanies();
      setCompanies(response.data.data || []);
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

  
    const handleMarkAsPaid = async (id) => {
        try {
            await API.patch(`/invoices/${id}/status`, { status: 'paid' });
            setSavedInvoices(prev => prev.filter(inv => inv.id !== id));
            setSnackbar({ open: true, message: 'Invoice marked as paid!', severity: 'success' });
        } catch (err) {
            console.error('Failed to mark invoice as paid:', err);
            const serverError = err.response?.data?.error || 'Failed to mark invoice as paid.';
            setSnackbar({ open: true, message: serverError, severity: 'error' });
        }
    };
    
    const fetchSavedInvoices = async () => {
      try {
          const response = await API.get('/invoices');
          let invoices = response.data.data || [];
            invoices = invoices.filter(inv => inv.status !== 'paid');

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
    const comp = companies.find(c => c.id === companyId);
    if (comp && comp.requires_po_number !== undefined) {
      return comp.requires_po_number === true;
    }
    if (comp) {
      const nameStr = (comp.company_name || fallbackName).toUpperCase();
      return nameStr.includes('ONGC') || nameStr.includes('OIL & NATURAL GAS') || nameStr.includes('OIL AND NATURAL GAS');
    }
    const nameStr = fallbackName.toUpperCase();
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

  const activeEntryNumber = selectedItemsList.length > 0 ? selectedItemsList[0].parent.entryNumber : null;

  const filteredWorkItems = workItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.eventName || '').toLowerCase().includes(term) ||
      (item.poNpo || '').toLowerCase().includes(term) ||
      (item.parent?.entryNumber?.toString() || '').includes(term) ||
      (item.workMain || '').toLowerCase().includes(term)
    );
  });

  const paginatedWorkItems = filteredWorkItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const paginatedSavedInvoices = filteredSavedInvoices.slice(savedPage * savedRowsPerPage, savedPage * savedRowsPerPage + savedRowsPerPage);

  return (
    <Container>
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Generate Invoice
        </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Select work items from the same event to generate a consolidated invoice.
          </Typography>
          
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <TextField
              size="small"
              placeholder="Search by event, PO, or entry number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: '300px' }}
            />
          </Box>
          <TableContainer>
          <Table>
            <TableHead>
                <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Entry No.</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell align="center">Vendor Invoice</TableCell>
                    <TableCell align="center">Work Order Invoice</TableCell>
                    <TableCell>Event Name</TableCell>
                    <TableCell>PO/NPO</TableCell>
                    <TableCell>Event Date</TableCell>
                    <TableCell>Work Type</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {paginatedWorkItems.map((item) => {
                const hasVendorInvoice = invoiceStatusMap[item.id]?.Vendor || false;
                const hasWorkOrderInvoice = invoiceStatusMap[item.id]?.WorkOrder || false;
                
                const isSelected = !!selected[item.id];
                const isSameEntryNumber = activeEntryNumber !== null && item.parent.entryNumber === activeEntryNumber;
                const isDisabled = activeEntryNumber !== null && !isSameEntryNumber;
                const isHighlighted = isSameEntryNumber && !isSelected;

                return (
                  <TableRow 
                    key={item.id} 
                    hover 
                    sx={{ 
                      bgcolor: isSelected ? 'rgba(25, 118, 210, 0.15)' : (isHighlighted ? 'rgba(76, 175, 80, 0.1)' : 'inherit'),
                      opacity: isDisabled ? 0.5 : 1
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelect(item.id)}
                          disabled={isDisabled}
                          color={isSameEntryNumber ? "success" : "primary"}
                      />
                    </TableCell>
                    <TableCell>{item.parent.entryNumber}</TableCell>
                    <TableCell>{companies.find(c => c.id === item.parent.company_id)?.company_name || 'N/A'}</TableCell>
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
                );
              })}
              {paginatedWorkItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">No items found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredWorkItems.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
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
                            <TableCell>Company</TableCell>
                            <TableCell>Event Name(s)</TableCell>
                            <TableCell>PO/NPO</TableCell>
                            <TableCell>Vendor</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedSavedInvoices.map((invoice, i) => {
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
                                  <TableCell>{companies.find(c => c.id === invoice.company_id)?.company_name || 'N/A'}</TableCell>
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
                                            <Button 
                                              variant="contained" 
                                              color="success" 
                                              size="small"
                                              startIcon={<CheckCircleIcon />}
                                              onClick={() => handleMarkAsPaid(invoice.id)}
                                              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold', ml: 'auto' }}
                                            >
                                                Mark as Paid
                                            </Button>
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