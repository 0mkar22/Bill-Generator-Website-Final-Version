import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Paper, Typography, Box, Button, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ButtonGroup,
  Divider, FormControl, InputLabel, Select, MenuItem, Grid, Snackbar, Alert, TablePagination, TextField, InputAdornment, CircularProgress,
  TableSortLabel, Chip, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import API, { getWorkOrders, getCompanies, getInvoices, updateInvoiceStatus, deleteInvoice } from '../services/api';
import { supabase } from '../supabase';
import { TableSkeleton } from '../components/skeletons';

const InvoiceGenerator = () => {
  const [workItems, setWorkItems] = useState([]);
  const [selected, setSelected] = useState({});
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();
  const [viewingInvoiceType, setViewingInvoiceType] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All Vendors');
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmInvoice, setDeleteConfirmInvoice] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  // Pagination & Search state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sorting state for work items table
  const [orderBy, setOrderBy] = useState('entryNumber');
  const [order, setOrder] = useState('desc');
  
  const [savedPage, setSavedPage] = useState(0);
  const [savedRowsPerPage, setSavedRowsPerPage] = useState(10);

  const fetchCompanies = async () => {
    try {
      const response = await getCompanies();
      const list = response?.data?.data || response?.data || [];
      setCompanies(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchWorkItems = async () => {
    try {
      const response = await getWorkOrders();
      const rawOrders = response?.data?.data || response?.data || [];
      const allItems = (Array.isArray(rawOrders) ? rawOrders : []).flatMap(order =>
             (order.workItems || []).map((item, index) => {
             const uniqueId = item.id || `entry-${order.entryNumber}-item-${index}`;
             return { ...item, id: uniqueId, itemIndex: index, parent: order };
         })
      );
      setWorkItems(allItems);
    } catch (error) {
      console.error("Failed to fetch work items", error);
    }
  };


      const handleMarkAsPaid = async (id) => {
          setMarkingPaidId(id);
          try {
              await updateInvoiceStatus(id, 'paid');
              
              setAllInvoices(prev => {
                  const paidInvoice = prev.find(inv => inv.id === id);
                  if (paidInvoice && paidInvoice.invoiceNumber) {
                      return prev.map(inv => inv.invoiceNumber === paidInvoice.invoiceNumber ? { ...inv, status: 'paid' } : inv);
                  }
                  return prev.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv);
              });
              
              setSnackbar({ open: true, message: 'Invoice marked as paid!', severity: 'success' });
          } catch (err) {
              console.error('Failed to mark invoice as paid:', err);
              const serverError = err.response?.data?.error || err.message || 'Failed to mark invoice as paid.';
              setSnackbar({ open: true, message: serverError, severity: 'error' });
          } finally {
              setMarkingPaidId(null);
          }
      };
    
    const fetchAllInvoices = async () => {
      try {
          const response = await getInvoices();
          let invoices = response?.data?.data || response?.data || [];
          if (!Array.isArray(invoices)) invoices = [];
          
          const normalized = invoices.map(inv => {
              let parsedItems = [];
              if (Array.isArray(inv.workItems)) {
                  parsedItems = inv.workItems;
              } else if (typeof inv.workItems === 'string') {
                  try { parsedItems = JSON.parse(inv.workItems); } catch(e) {}
              }
              return { ...inv, workItems: parsedItems };
          });
          setAllInvoices(normalized);
      } catch (error) {
          console.error("Failed to fetch all invoices", error);
      }
  };

  useEffect(() => {
    Promise.all([
      fetchCompanies(),
      fetchWorkItems(),
      fetchAllInvoices()
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  const isONGCCompany = (companyId, fallbackName = '') => {
    const comp = companies.find(c => c.id === companyId);
    const nameStr = (comp?.company_name || fallbackName || '').toUpperCase();
    return comp?.requires_po_number === true || 
           nameStr.includes('ONGC') || 
           nameStr.includes('OIL & NATURAL GAS') || 
           nameStr.includes('OIL AND NATURAL GAS');
  };

  const invoiceStatusMap = useMemo(() => {
    const statusMap = {};
    for (const invoice of allInvoices) {
      const items = Array.isArray(invoice.workItems) ? invoice.workItems : [];
      for (const workItemId of items) {
        if (!statusMap[workItemId]) { statusMap[workItemId] = {}; }
        statusMap[workItemId][invoice.invoiceType] = true;
      }
    }
    return statusMap;
  }, [allInvoices]);
  
  const savedInvoices = useMemo(() => allInvoices.filter(inv => inv.status !== 'paid'), [allInvoices]);

  const handleSelect = (itemId) => {
    setSelected(prev => {
      const nextVal = !prev[itemId];
      if (nextVal) {
        setSelectedOrder(old => (old.includes(itemId) ? old : [...old, itemId]));
      } else {
        setSelectedOrder(old => old.filter(id => id !== itemId));
      }
      return { ...prev, [itemId]: nextVal };
    });
  };

  const getSelectedItems = () => {
    const items = workItems.filter(item => selected[item.id]);

    return items.sort((a, b) => {
      // 1. Sort primarily by eventDate ascending (oldest to newest)
      const dateA = a.parent?.eventDate || a.eventDate ? new Date(a.parent?.eventDate || a.eventDate).getTime() : 0;
      const dateB = b.parent?.eventDate || b.eventDate ? new Date(b.parent?.eventDate || b.eventDate).getTime() : 0;

      if (dateA !== dateB) {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      }

      // 2. If dates are equal (or missing), sort by the order they were selected
      const orderA = selectedOrder.indexOf(a.id);
      const orderB = selectedOrder.indexOf(b.id);
      if (orderA !== -1 && orderB !== -1) {
        return orderA - orderB;
      }
      if (orderA !== -1) return -1;
      if (orderB !== -1) return 1;

      // 3. Fallback: natural entryNumber and itemIndex order
      const entryA = String(a.parent?.entryNumber || '');
      const entryB = String(b.parent?.entryNumber || '');
      const entryComp = entryA.localeCompare(entryB, undefined, { numeric: true });
      if (entryComp !== 0) return entryComp;

      return (a.itemIndex ?? 0) - (b.itemIndex ?? 0);
    });
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
    const itemsForInvoice = invItems.map(id => {
      return workItems.find(item => {
        if (item.id === id) return true;
        const fallbackId = `entry-${item.parent?.entryNumber}-item-${item.itemIndex ?? 0}`;
        return fallbackId === id;
      });
    }).filter(Boolean);

    // Ensure items are ordered by eventDate ascending, then by saved sequence
    itemsForInvoice.sort((a, b) => {
      const dateA = a.parent?.eventDate || a.eventDate ? new Date(a.parent?.eventDate || a.eventDate).getTime() : 0;
      const dateB = b.parent?.eventDate || b.eventDate ? new Date(b.parent?.eventDate || b.eventDate).getTime() : 0;
      if (dateA !== dateB) {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      }
      return invItems.indexOf(a.id) - invItems.indexOf(b.id);
    });

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
        gstNo: savedInvoice.gstno || savedInvoice.gstNo 
      } 
    });
  };

  const handleDeleteInvoice = async () => {
    if (!deleteConfirmInvoice) return;
    const invId = deleteConfirmInvoice.id;
    setDeletingId(invId);
    try {
      await deleteInvoice(invId);
      setAllInvoices(prev => prev.filter(inv => inv.id !== invId));
      setSnackbar({
        open: true,
        message: `Invoice ${deleteConfirmInvoice.invoiceNumber || ''} deleted successfully.`,
        severity: 'success'
      });
      setDeleteConfirmInvoice(null);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      const serverError = err.response?.data?.error || err.message || 'Failed to delete invoice.';
      setSnackbar({ open: true, message: serverError, severity: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditWorkItem = (parentOrder) => {
    navigate('/work-orders', { 
      state: { 
        editData: parentOrder,
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
    let invoices = [...savedInvoices];
    // Sort descending by creation date (newest first)
    invoices.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (viewingInvoiceType !== 'All') {
      invoices = invoices.filter(invoice => invoice.invoiceType === viewingInvoiceType);
    }
    if (vendorFilter !== 'All Vendors') {
      invoices = invoices.filter(invoice => invoice.parentOrderInfo?.vendor === vendorFilter);
    }

    return invoices;
  }, [savedInvoices, viewingInvoiceType, vendorFilter]);

  useEffect(() => {
    setSavedPage(0);
  }, [viewingInvoiceType, vendorFilter]);


  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const selectedItemsList = getSelectedItems();
  
  const isONGCSelected = selectedItemsList.length > 0 && isONGCCompany(
    selectedItemsList[0].parent?.company_id,
    companies.find(c => c.id === selectedItemsList[0].parent?.company_id)?.company_name
  );

  const showWorkOrderBtn = selectedItemsList.length === 0 || isONGCSelected;

  const activeEntryNumber = selectedItemsList.length > 0 ? selectedItemsList[0].parent?.entryNumber : null;

  const filteredWorkItems = workItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const compName = (companies.find(c => c.id === item.parent?.company_id)?.company_name || '').toLowerCase();
    return (
      (item.eventName || '').toLowerCase().includes(term) ||
      (item.poNpo || '').toLowerCase().includes(term) ||
      (item.parent?.entryNumber?.toString() || '').includes(term) ||
      (item.workMain || '').toLowerCase().includes(term) ||
      compName.includes(term)
    );
  });

  const sortedWorkItems = useMemo(() => {
    return [...filteredWorkItems].sort((a, b) => {
      let comparison = 0;
      switch (orderBy) {
        case 'entryNumber': {
          const valA = String(a.parent?.entryNumber || '');
          const valB = String(b.parent?.entryNumber || '');
          comparison = valA.localeCompare(valB, undefined, { numeric: true });
          break;
        }
        case 'company': {
          const compA = companies.find(c => c.id === a.parent?.company_id)?.company_name || '';
          const compB = companies.find(c => c.id === b.parent?.company_id)?.company_name || '';
          comparison = compA.localeCompare(compB);
          break;
        }
        case 'vendorInvoice': {
          const valA = invoiceStatusMap[a.id]?.Vendor ? 'Generated' : 'None';
          const valB = invoiceStatusMap[b.id]?.Vendor ? 'Generated' : 'None';
          comparison = valA.localeCompare(valB);
          break;
        }
        case 'workOrderInvoice': {
          const valA = invoiceStatusMap[a.id]?.WorkOrder ? 'Generated' : 'None';
          const valB = invoiceStatusMap[b.id]?.WorkOrder ? 'Generated' : 'None';
          comparison = valA.localeCompare(valB);
          break;
        }
        case 'eventName': {
          comparison = (a.eventName || '').localeCompare(b.eventName || '');
          break;
        }
        case 'poNpo': {
          comparison = (a.poNpo || '').localeCompare(b.poNpo || '');
          break;
        }
        case 'eventDate': {
          const dateA = a.parent?.eventDate ? new Date(a.parent.eventDate).getTime() : 0;
          const dateB = b.parent?.eventDate ? new Date(b.parent.eventDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'workType': {
          comparison = (a.workMain || '').localeCompare(b.workMain || '');
          break;
        }
        default:
          comparison = 0;
      }
      return order === 'desc' ? -comparison : comparison;
    });
  }, [filteredWorkItems, orderBy, order, companies, invoiceStatusMap]);

  const paginatedWorkItems = sortedWorkItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const paginatedSavedInvoices = filteredSavedInvoices.slice(savedPage * savedRowsPerPage, savedPage * savedRowsPerPage + savedRowsPerPage);

  const selectablePageItems = useMemo(() => {
    if (selectedItemsList.length > 0) {
      if (isONGCSelected) {
        return paginatedWorkItems.filter(item => isONGCCompany(
          item.parent?.company_id,
          companies.find(c => c.id === item.parent?.company_id)?.company_name
        ));
      }
      return paginatedWorkItems.filter(item => item.parent?.entryNumber === activeEntryNumber);
    }
    const allPageAreONGC = paginatedWorkItems.length > 0 && paginatedWorkItems.every(item => isONGCCompany(
      item.parent?.company_id,
      companies.find(c => c.id === item.parent?.company_id)?.company_name
    ));
    if (allPageAreONGC) {
      return paginatedWorkItems;
    }
    return [];
  }, [paginatedWorkItems, selectedItemsList, isONGCSelected, activeEntryNumber, companies]);

  const numSelectedOnPage = useMemo(() => {
    return selectablePageItems.filter(item => selected[item.id]).length;
  }, [selectablePageItems, selected]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = { ...selected };
      const toAdd = [];
      selectablePageItems.forEach(item => {
        newSelected[item.id] = true;
        toAdd.push(item.id);
      });
      setSelected(newSelected);
      setSelectedOrder(old => {
        const existing = new Set(old);
        const uniqueToAdd = toAdd.filter(id => !existing.has(id));
        return [...old, ...uniqueToAdd];
      });
    } else {
      const newSelected = { ...selected };
      const toRemove = new Set();
      selectablePageItems.forEach(item => {
        delete newSelected[item.id];
        toRemove.add(item.id);
      });
      setSelected(newSelected);
      setSelectedOrder(old => old.filter(id => !toRemove.has(id)));
    }
  };


  return (
    <Container>
      {loading ? (
        <Paper sx={{ p: 4, mt: 4, backgroundColor: 'rgba(24, 24, 27, 0.50)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.10)', borderRadius: '12px' }}>
          <TableSkeleton
            title="Generate Invoice"
            subtitle="Select work items from the same event to generate a consolidated invoice."
            columns={8}
            rows={8}
            hasSearch={true}
            hasPagination={true}
          />
        </Paper>
      ) : (
        <>
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Generate Invoice
        </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            {isONGCSelected 
              ? 'Selecting work items for ONGC — multiple work items from different Entry Numbers can be combined.' 
              : 'Select work items from the same event (or across different Entry Numbers for ONGC) to generate a consolidated invoice.'}
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
          <TableContainer sx={{ border: '1px solid rgba(255, 255, 255, 0.10)', borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(9, 9, 11, 0.60)' }}>
                <TableRow>
                    <TableCell padding="checkbox">
                      {selectablePageItems.length > 0 && (
                        <Checkbox
                          color="primary"
                          indeterminate={numSelectedOnPage > 0 && numSelectedOnPage < selectablePageItems.length}
                          checked={selectablePageItems.length > 0 && numSelectedOnPage === selectablePageItems.length}
                          onChange={handleSelectAllClick}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.3)',
                            '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#818cf8' }
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'entryNumber'}
                        direction={orderBy === 'entryNumber' ? order : 'asc'}
                        onClick={() => handleRequestSort('entryNumber')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        Entry No.
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'company'}
                        direction={orderBy === 'company' ? order : 'asc'}
                        onClick={() => handleRequestSort('company')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        Company
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'vendorInvoice'}
                        direction={orderBy === 'vendorInvoice' ? order : 'asc'}
                        onClick={() => handleRequestSort('vendorInvoice')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        Vendor Invoice
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'workOrderInvoice'}
                        direction={orderBy === 'workOrderInvoice' ? order : 'asc'}
                        onClick={() => handleRequestSort('workOrderInvoice')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        Work Order Invoice
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'eventName'}
                        direction={orderBy === 'eventName' ? order : 'asc'}
                        onClick={() => handleRequestSort('eventName')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        Event Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'poNpo'}
                        direction={orderBy === 'poNpo' ? order : 'asc'}
                        onClick={() => handleRequestSort('poNpo')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        PO/NPO
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'eventDate'}
                        direction={orderBy === 'eventDate' ? order : 'asc'}
                        onClick={() => handleRequestSort('eventDate')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        Event Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>
                      <TableSortLabel
                        active={orderBy === 'workType'}
                        direction={orderBy === 'workType' ? order : 'asc'}
                        onClick={() => handleRequestSort('workType')}
                        sx={{
                          color: 'inherit',
                          '&.Mui-active': { color: '#818cf8' },
                          '& .MuiTableSortLabel-icon': { color: '#818cf8 !important' }
                        }}
                      >
                        Work Type
                      </TableSortLabel>
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {paginatedWorkItems.map((item) => {
                const hasVendorInvoice = invoiceStatusMap[item.id]?.Vendor || false;
                const hasWorkOrderInvoice = invoiceStatusMap[item.id]?.WorkOrder || false;
                
                const isSelected = !!selected[item.id];
                const itemIsONGC = isONGCCompany(
                  item.parent?.company_id,
                  companies.find(c => c.id === item.parent?.company_id)?.company_name
                );

                let isDisabled = false;
                let isHighlighted = false;

                if (selectedItemsList.length > 0) {
                  if (isONGCSelected) {
                    // For ONGC work items, allow selecting multiple work items from different Entry Numbers!
                    isDisabled = !itemIsONGC;
                    isHighlighted = itemIsONGC && !isSelected;
                  } else {
                    // For non-ONGC companies, restrict selection to the same Entry Number
                    const isSameEntryNumber = item.parent?.entryNumber === activeEntryNumber;
                    isDisabled = !isSameEntryNumber;
                    isHighlighted = isSameEntryNumber && !isSelected;
                  }
                }

                return (
                  <TableRow 
                    key={item.id} 
                    hover 
                    sx={{ 
                      bgcolor: isSelected ? 'rgba(99, 102, 241, 0.14)' : (isHighlighted ? 'rgba(99, 102, 241, 0.06)' : 'inherit'),
                      opacity: isDisabled ? 0.45 : 1,
                      '&:hover': { bgcolor: 'rgba(39, 39, 42, 0.40)' }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelect(item.id)}
                          disabled={isDisabled}
                          sx={{
                            color: 'rgba(255, 255, 255, 0.3)',
                            '&.Mui-checked': { color: '#818cf8' }
                          }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#818cf8', fontWeight: 600 }}>{item.parent.entryNumber}</TableCell>
                    <TableCell>{companies.find(c => c.id === item.parent.company_id)?.company_name || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <span className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded border ${hasVendorInvoice ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800/50 text-zinc-500 border-white/5'}`}>
                        {hasVendorInvoice ? 'Generated' : 'None'}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded border ${hasWorkOrderInvoice ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800/50 text-zinc-500 border-white/5'}`}>
                        {hasWorkOrderInvoice ? 'Generated' : 'None'}
                      </span>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.eventName}</TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{item.poNpo}</TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>
                      {item.parent?.eventDate ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                          <Typography component="span" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: '#e4e4e7' }}>
                            {new Date(item.parent.eventDate).toLocaleDateString('en-GB')}
                          </Typography>
                          {item.eventTime && (
                            <Typography component="span" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', color: '#a1a1aa' }}>
                              {item.eventTime}
                            </Typography>
                          )}
                        </Box>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{item.workMain ? item.workMain.replaceAll('_', ' ') : 'N/A'}</TableCell>

                  </TableRow>
                );
              })}
              {paginatedWorkItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: '#a1a1aa' }}>No items found.</TableCell>
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
            <>
              <TableContainer sx={{ border: '1px solid rgba(255, 255, 255, 0.10)', borderRadius: '12px 12px 0 0' }}>
                  <Table>
                      <TableHead sx={{ bgcolor: 'rgba(9, 9, 11, 0.60)' }}>
                          <TableRow>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Date Saved</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Invoice Number</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Type</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', minWidth: 160 }}>Company</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', minWidth: 200, maxWidth: 260 }}>Event Name(s)</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>PO/NPO</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', minWidth: 120 }}>Vendor</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', minWidth: 260 }}>Actions</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {paginatedSavedInvoices.map((invoice, i) => {
                              const invItems = Array.isArray(invoice.workItems) ? invoice.workItems : [];
                              const matchedItems = workItems.filter(item => {
                                if (invItems.includes(item.id)) return true;
                                const fallbackId = `entry-${item.parent?.entryNumber}-item-${item.itemIndex ?? 0}`;
                                return invItems.includes(fallbackId);
                              });
                              const rawEventNames = matchedItems.map(item => item.eventName).filter(Boolean);
                              const uniqueEventNames = Array.from(new Set(rawEventNames.map(s => String(s).trim()))).filter(Boolean);
                              const displayPoNpo = matchedItems[0]?.poNpo || 'N/A';
                              const companyObj = companies.find(c => c.id === invoice.company_id);
                              const companyName = companyObj?.company_name || invoice.recipient || 'N/A';
                              const isWorkOrder = invoice.invoiceType === 'WorkOrder';

                              return (
                                <TableRow key={invoice.id || `${invoice.invoiceNumber}-${i}`} hover sx={{ '&:hover': { bgcolor: 'rgba(39, 39, 42, 0.40)' } }}>
                                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', whiteSpace: 'nowrap' }}>
                                      {invoice.createdAt ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                                          <Typography component="span" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7' }}>
                                            {new Date(invoice.createdAt).toLocaleDateString('en-GB')}
                                          </Typography>
                                          <Typography component="span" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', color: '#a1a1aa' }}>
                                            {new Date(invoice.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                          </Typography>
                                        </Box>
                                      ) : 'N/A'}
                                    </TableCell>

                                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#818cf8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {invoice.invoiceNumber || 'N/A'}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                      {isWorkOrder ? (
                                        <Chip
                                          label="Work Order"
                                          size="small"
                                          sx={{
                                            bgcolor: 'rgba(168, 85, 247, 0.15)',
                                            color: '#c084fc',
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                            border: '1px solid rgba(168, 85, 247, 0.35)',
                                            borderRadius: '6px'
                                          }}
                                        />
                                      ) : (
                                        <Chip
                                          label="Vendor"
                                          size="small"
                                          sx={{
                                            bgcolor: 'rgba(59, 130, 246, 0.15)',
                                            color: '#60a5fa',
                                            fontWeight: 600,
                                            fontSize: '0.72rem',
                                            border: '1px solid rgba(59, 130, 246, 0.35)',
                                            borderRadius: '6px'
                                          }}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 160, fontSize: '0.82rem' }}>
                                      {companyName}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 260, verticalAlign: 'middle' }}>
                                      {uniqueEventNames.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                          {invoice.serviceDescription ? String(invoice.serviceDescription).slice(0, 40) : (invoice.parentOrderInfo?.entryNumber ? `Entry #${invoice.parentOrderInfo.entryNumber}` : 'N/A')}
                                        </Typography>
                                      ) : uniqueEventNames.length === 1 ? (
                                        <Tooltip title={uniqueEventNames[0]} arrow enterDelay={300}>
                                          <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 500, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {uniqueEventNames[0]}
                                          </Typography>
                                        </Tooltip>
                                      ) : uniqueEventNames.length === 2 ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                          {uniqueEventNames.map((name, idx) => (
                                            <Tooltip key={idx} title={name} arrow enterDelay={300}>
                                              <Typography variant="body2" noWrap sx={{ fontSize: '0.75rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                • {name}
                                              </Typography>
                                            </Tooltip>
                                          ))}
                                        </Box>
                                      ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'nowrap' }}>
                                          <Tooltip title={uniqueEventNames[0]} arrow enterDelay={300}>
                                            <Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                              {uniqueEventNames[0]}
                                            </Typography>
                                          </Tooltip>
                                          <Tooltip
                                            arrow
                                            componentsProps={{
                                              tooltip: {
                                                sx: {
                                                  bgcolor: 'rgba(15, 23, 42, 0.95)',
                                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                                  maxWidth: 400,
                                                  p: 1.5
                                                }
                                              }
                                            }}
                                            title={
                                              <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#818cf8', display: 'block', mb: 1, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 0.5 }}>
                                                  All Events ({uniqueEventNames.length}):
                                                </Typography>
                                                {uniqueEventNames.map((name, idx) => (
                                                  <Typography key={idx} variant="caption" sx={{ display: 'block', py: 0.3, color: '#e4e4e7', fontSize: '0.75rem' }}>
                                                    {idx + 1}. {name}
                                                  </Typography>
                                                ))}
                                              </Box>
                                            }
                                          >
                                            <Chip
                                              label={`+${uniqueEventNames.length - 1} more`}
                                              size="small"
                                              clickable
                                              sx={{
                                                height: 22,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                bgcolor: 'rgba(99, 102, 241, 0.18)',
                                                color: '#c7d2fe',
                                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                                '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.35)' }
                                              }}
                                            />
                                          </Tooltip>
                                        </Box>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                      {displayPoNpo}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', minWidth: 120 }}>
                                      {invoice.parentOrderInfo?.vendor || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                            {isWorkOrder ? (
                                                <>
                                                    <Button 
                                                      variant="contained" 
                                                      color="secondary" 
                                                      size="small"
                                                      startIcon={<AssignmentIcon fontSize="small" />}
                                                      onClick={() => handleViewSavedInvoice(invoice, 'WorkOrder')}
                                                      sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                                    >
                                                        Work Order
                                                    </Button>
                                                    <Button 
                                                      variant="outlined" 
                                                      size="small"
                                                      startIcon={<EditIcon fontSize="small" />}
                                                      onClick={() => handleViewSavedInvoice(invoice, 'WorkOrder', true)}
                                                      sx={{ textTransform: 'none', borderRadius: '6px', borderColor: 'rgba(255, 255, 255, 0.15)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                                    >
                                                        Edit
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button 
                                                      variant="contained" 
                                                      color="primary" 
                                                      size="small"
                                                      startIcon={<ReceiptIcon fontSize="small" />}
                                                      onClick={() => handleViewSavedInvoice(invoice, 'Vendor')}
                                                      sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                                    >
                                                        Vendor Invoice
                                                    </Button>
                                                    <Button 
                                                      variant="outlined" 
                                                      size="small"
                                                      startIcon={<EditIcon fontSize="small" />}
                                                      onClick={() => handleViewSavedInvoice(invoice, 'Vendor', true)}
                                                      sx={{ textTransform: 'none', borderRadius: '6px', borderColor: 'rgba(255, 255, 255, 0.15)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                                    >
                                                        Edit
                                                    </Button>
                                                </>
                                            )}

                                            <Button 
                                              variant="outlined"
                                              size="small"
                                              disabled={markingPaidId === invoice.id}
                                              startIcon={<CheckCircleIcon fontSize="small" />}
                                              onClick={() => handleMarkAsPaid(invoice.id)}
                                              sx={{
                                                textTransform: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                whiteSpace: 'nowrap',
                                                color: '#34d399',
                                                bgcolor: 'rgba(16, 185, 129, 0.10)',
                                                border: '1px solid rgba(16, 185, 129, 0.20)',
                                                '&:hover': {
                                                  bgcolor: 'rgba(16, 185, 129, 0.20)',
                                                  borderColor: 'rgba(16, 185, 129, 0.35)'
                                                }
                                              }}
                                            >
                                                Mark as Paid
                                            </Button>

                                            <Tooltip title="Delete Invoice" arrow>
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setDeleteConfirmInvoice(invoice)}
                                                sx={{
                                                  borderRadius: '6px',
                                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                                  bgcolor: 'rgba(239, 68, 68, 0.08)',
                                                  '&:hover': {
                                                    bgcolor: 'rgba(239, 68, 68, 0.20)',
                                                    borderColor: 'rgba(239, 68, 68, 0.45)'
                                                  }
                                                }}
                                              >
                                                <DeleteOutlineIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                              )
                          })}
                      </TableBody>
                  </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filteredSavedInvoices.length}
                page={savedPage}
                onPageChange={(e, newPage) => setSavedPage(newPage)}
                rowsPerPage={savedRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setSavedRowsPerPage(parseInt(e.target.value, 10));
                  setSavedPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  bgcolor: 'rgba(9, 9, 11, 0.40)'
                }}
              />
            </>
          ) : (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                  {`No ${vendorFilter === 'All Vendors' ? '' : vendorFilter} ${viewingInvoiceType === 'All' ? '' : viewingInvoiceType} invoices found.`}
              </Typography>
          )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmInvoice)}
        onClose={() => !deletingId && setDeleteConfirmInvoice(null)}
        PaperProps={{
          sx: {
            bgcolor: '#18181b',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            color: '#fff',
            p: 1,
            minWidth: 360
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          Delete Saved Invoice
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#a1a1aa' }}>
            Are you sure you want to delete invoice <strong style={{ color: '#fff' }}>{deleteConfirmInvoice?.invoiceNumber || 'N/A'}</strong> ({deleteConfirmInvoice?.invoiceType === 'WorkOrder' ? 'Work Order Invoice' : 'Vendor Invoice'})? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmInvoice(null)}
            disabled={Boolean(deletingId)}
            sx={{ textTransform: 'none', color: '#a1a1aa' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteInvoice}
            disabled={Boolean(deletingId)}
            startIcon={deletingId ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
            sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600 }}
          >
            {deletingId ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>


      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
          </>
      )}
    </Container>
  );
};

export default InvoiceGenerator;