import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Autocomplete, Snackbar, Alert, CircularProgress, IconButton,
  Collapse, Tooltip, Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCardIcon from '@mui/icons-material/AddCard';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import API, { getWorkOrders, getCompanies, updatePayout, deletePayout, updateInvoiceAmountReceived, updateWorkOrderExpenses } from '../services/api';
import { calculateItemAmount } from '../utils/helpers';
import { AmountPaidSkeleton } from '../components/skeletons';

const AmountPaid = () => {
  const navigate = useNavigate();
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [rawWorkOrders, setRawWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPayoutId, setEditPayoutId] = useState(null);

  // Global Event Form Data
  const [globalForm, setGlobalForm] = useState({
      eventId: null,
      entryNumber: '',
      eventName: '',
      eventVenue: '',
      eventDate: '',
      travelExpense: '',
      foodExpense: '',
      stayExpense: '',
      notes: ''
  });

  // Batch Personnel Array (for new) or Single Personnel (for edit)
  const [batchPersonnel, setBatchPersonnel] = useState([]);
  const [selectedEventOption, setSelectedEventOption] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      try {
          const [invoicesRes, payoutsRes, companiesRes, ordersRes] = await Promise.allSettled([
              API.get('/invoices'),
              API.get('/personnelPayouts'),
              getCompanies(),
              getWorkOrders()
          ]);

          if (invoicesRes.status === 'fulfilled') {
              const invoices = invoicesRes.value.data.data || [];
              const paid = invoices.filter(inv => inv.status === 'paid');
              
              const grouped = new Map();
              paid.forEach(inv => {
                  if (!grouped.has(inv.invoiceNumber)) {
                      grouped.set(inv.invoiceNumber, inv);
                  }
              });
              
              setPaidInvoices(Array.from(grouped.values()));
          }
          
          let savedPayouts = [];
          if (payoutsRes.status === 'fulfilled') {
              savedPayouts = payoutsRes.value.data.data || [];
              setPayouts(savedPayouts);
          } else {
              console.error("Payouts fetch failed:", payoutsRes.reason);
          }
          
          if (companiesRes.status === 'fulfilled') {
              setCompanies(companiesRes.value.data.data || []);
          }
          
          if (ordersRes.status === 'fulfilled') {
              const rawOrders = ordersRes.value.data.data || [];
              setRawWorkOrders(rawOrders);
              const pendingPayoutOptions = [];
              
              rawOrders.forEach(order => {
                  const items = order.workItems || [];
                  const eName = items[0]?.eventName || '';
                  const eVenue = items[0]?.eventVenue || '';
                  const eDate = order.eventDate || order.event_date || 'N/A';

                  const personnelMap = new Map();

                  items.forEach(item => {
                      let rawPersonnel = item.personnel || [];
                      
                      // Retrofit legacy records before parsing
                      if (item.workMain === 'Two_Camera_Setup' && rawPersonnel.length > 0 && !rawPersonnel[0].role) {
                          const roles = ['Mixer Operator', 'Camera Operator', 'Camera Operator', 'Assistant'];
                          rawPersonnel = rawPersonnel.map((per, i) => ({ ...per, role: roles[i] || 'Assistant' }));
                      } else if (item.workMain === 'Three_Camera_Setup' && rawPersonnel.length > 0 && !rawPersonnel[0].role) {
                          const roles = ['Mixer Operator', 'Camera Operator', 'Camera Operator', 'Camera Operator', 'Assistant'];
                          rawPersonnel = rawPersonnel.map((per, i) => ({ ...per, role: roles[i] || 'Assistant' }));
                      }
                      
                      const pList = Array.isArray(rawPersonnel) ? rawPersonnel.filter(p => p.name) : [];
                      
                      pList.forEach(p => {
                          const pName = p.name;
                          if (!personnelMap.has(pName)) {
                              personnelMap.set(pName, { workNames: new Set(), workSubs: new Set(), roles: new Set(), totalRate: 0 });
                          }
                          const pData = personnelMap.get(pName);
                          if (p.role) pData.roles.add(p.role);
                          if (item.workMain) pData.workNames.add(item.workMain.replaceAll('_', ' '));
                          if (item.workSub) pData.workSubs.add(item.workSub.replaceAll('_', ' '));
                          if (item.customRate && pList.length > 0) {
                              pData.totalRate += (Number(item.customRate) / pList.length);
                          }
                      });
                  });
                  
                  const extractedPersonnel = [];
                  for (const [pName, pData] of personnelMap.entries()) {
                      // Check if THIS specific person was already paid for THIS event
                      const alreadyPaid = savedPayouts.some(p => p.event_id === order.id && p.personnel_name === pName);
                      if (!alreadyPaid) {
                          extractedPersonnel.push({
                              personnelName: pName,
                              workName: pData.roles.size > 0 ? Array.from(pData.roles).join(', ') : Array.from(pData.workNames).join(', '),
                              duration: Array.from(pData.workSubs).join(', '),
                              amountPaid: Math.round(pData.totalRate) ? Math.round(pData.totalRate).toString() : '',
                              paymentDate: new Date().toISOString().split('T')[0]
                          });
                      }
                  }

                  // Only push the event if there are still unpaid personnel
                  if (extractedPersonnel.length > 0) {
                      pendingPayoutOptions.push({
                          ...order,
                          extractedEventName: eName,
                          extractedEventVenue: eVenue,
                          extractedEventDate: eDate,
                          personnelList: extractedPersonnel
                      });
                  }
              });
              
              setWorkOrders(pendingPayoutOptions);
          }
      } catch (err) {
          console.error('Failed to fetch data', err);
          setSnackbar({ open: true, message: 'Failed to load data.', severity: 'error' });
      } finally {
          setLoading(false);
      }
  };

    const allItems = React.useMemo(() => {
        return rawWorkOrders.flatMap(order =>
             (order.workItems || []).map((item, index) => {
               const uniqueId = item.id || `entry-${order.entryNumber}-item-${index}`;
               return { ...item, id: uniqueId, parent: order };
           })
        );
    }, [rawWorkOrders]);

    const getInvoiceFinancials = (inv) => {
        let invItems = [];
        try {
            invItems = Array.isArray(inv.workItems) ? inv.workItems : (typeof inv.workItems === 'string' ? JSON.parse(inv.workItems || '[]') : []);
        } catch(e) {}
        
        const itemsForInvoice = allItems.filter(item => invItems.includes(item.id));
        const companyDetails = companies.find(c => c.id === inv.company_id) || {};
        
        let baseAmount = itemsForInvoice.reduce((sum, item) => sum + (calculateItemAmount(item, companyDetails) || 0), 0);
        let invoiceAmount = Math.round(baseAmount * 1.18);

        // Fallback if invoice items were not mapped
        if (baseAmount === 0 && inv.total) {
            invoiceAmount = Number(inv.total) || 0;
            baseAmount = Math.round(invoiceAmount / 1.18);
        }

        const gstAmount = invoiceAmount - baseAmount;
        const tdsAmount = Math.round(baseAmount * 0.03);
        const amountReceived = invoiceAmount - tdsAmount;

        return {
            baseAmount,
            invoiceAmount,
            gstAmount,
            tdsAmount,
            amountReceived
        };
    };

    const getInvoiceAmount = (inv) => {
        return getInvoiceFinancials(inv).invoiceAmount;
    };

    const handleReviewInvoice = (savedInvoice) => {
        let invItems = [];
        try {
            invItems = Array.isArray(savedInvoice.workItems)
                ? savedInvoice.workItems
                : (typeof savedInvoice.workItems === 'string' ? JSON.parse(savedInvoice.workItems || '[]') : []);
        } catch(e) {
            invItems = [];
        }

        let itemsForInvoice = allItems.filter(item => invItems.includes(item.id));

        // Fallback: match by parent order entry number if item IDs were not directly mapped
        if (itemsForInvoice.length === 0 && savedInvoice.parentOrderInfo?.entryNumber) {
            itemsForInvoice = allItems.filter(item => 
                String(item.parent?.entryNumber) === String(savedInvoice.parentOrderInfo.entryNumber)
            );
        }

        if (itemsForInvoice.length === 0) {
            setSnackbar({
                open: true,
                message: `Work items for Invoice #${savedInvoice.invoiceNumber} could not be located.`,
                severity: 'error'
            });
            return;
        }

        // Per user specification: "For ONGC only show Vendor Invoice"
        // Routes directly to /vendor-invoice in review mode for all paid invoices
        navigate('/vendor-invoice', {
            state: {
                items: itemsForInvoice,
                savedInvoice: true,
                isEditing: false,
                invoiceId: savedInvoice.id || savedInvoice._id,
                invoiceNumber: savedInvoice.invoiceNumber,
                invoiceDate: savedInvoice.createdAt,
                recipient: savedInvoice.recipient,
                dealingOfficer: savedInvoice.dealingOfficer,
                emailId: savedInvoice.emailId,
                vendorCode: savedInvoice.vendorCode,
                poNumber: savedInvoice.poNumber,
                poDate: savedInvoice.poDate,
                serviceDescription: savedInvoice.serviceDescription,
                gstNo: savedInvoice.gstNo || savedInvoice.gstno,
                from: '/amount-paid'
            }
        });
    };
    
    const handleResetInlineForm = () => {
      setSelectedEventOption(null);
      setGlobalForm({
          eventId: null,
          entryNumber: '',
          eventName: '',
          eventVenue: '',
          eventDate: '',
          travelExpense: '',
          foodExpense: '',
          stayExpense: '',
          notes: ''
      });
      setBatchPersonnel([]);
    };
    
    const handleEventSelection = (event, selectedOrder) => {
      setSelectedEventOption(selectedOrder);
      if (!selectedOrder) {
          handleResetInlineForm();
          return;
      }
      
      const existingTravel = selectedOrder.travel_expense ?? selectedOrder.workItems?.[0]?.travelExpense ?? '';
      const existingFood = selectedOrder.food_expense ?? selectedOrder.workItems?.[0]?.foodExpense ?? '';
      const existingStay = selectedOrder.stay_expense ?? selectedOrder.workItems?.[0]?.stayExpense ?? '';

      setGlobalForm({
          ...globalForm,
          eventId: selectedOrder.id,
          entryNumber: selectedOrder.entryNumber || '',
          eventName: selectedOrder.extractedEventName,
          eventVenue: selectedOrder.extractedEventVenue,
          eventDate: selectedOrder.extractedEventDate,
          travelExpense: existingTravel ? String(existingTravel) : '',
          foodExpense: existingFood ? String(existingFood) : '',
          stayExpense: existingStay ? String(existingStay) : ''
      });
      setBatchPersonnel(selectedOrder.personnelList);
  };

  const handleBatchAmountChange = (index, value) => {
      const updated = [...batchPersonnel];
      updated[index].amountPaid = value;
      setBatchPersonnel(updated);
  };

  const handleBatchDateChange = (index, value) => {
      const updated = [...batchPersonnel];
      updated[index].paymentDate = value;
      setBatchPersonnel(updated);
  };
  
  const handleEditPayout = (payout) => {
      const oOrder = rawWorkOrders.find(o => o.id === payout.event_id);
      setEditPayoutId(payout.id);

      const existingTravel = oOrder?.travel_expense ?? oOrder?.workItems?.[0]?.travelExpense ?? '';
      const existingFood = oOrder?.food_expense ?? oOrder?.workItems?.[0]?.foodExpense ?? '';
      const existingStay = oOrder?.stay_expense ?? oOrder?.workItems?.[0]?.stayExpense ?? '';
      
      setGlobalForm({
          eventId: payout.event_id,
          entryNumber: oOrder?.entryNumber || '',
          eventName: oOrder?.workItems?.[0]?.eventName || '',
          eventVenue: oOrder?.workItems?.[0]?.eventVenue || '',
          eventDate: oOrder?.eventDate ? new Date(oOrder.eventDate).toLocaleDateString('en-GB') : '',
          travelExpense: existingTravel ? String(existingTravel) : '',
          foodExpense: existingFood ? String(existingFood) : '',
          stayExpense: existingStay ? String(existingStay) : '',
          notes: payout.notes || ''
      });
      
      setBatchPersonnel([{
          personnelName: payout.personnel_name,
          workName: payout.work_name || '',
          duration: payout.duration || '',
          amountPaid: payout.amount_paid.toString(),
          paymentDate: payout.payment_date || new Date().toISOString().split('T')[0]
      }]);
      
      setIsModalOpen(true);
  };
  
  const handleDeletePayout = async (id) => {
      if (window.confirm("Are you sure you want to delete this payout?")) {
          try {
              await deletePayout(id);
              setSnackbar({ open: true, message: 'Payout deleted successfully!', severity: 'success' });
              fetchData();
          } catch (err) {
              setSnackbar({ open: true, message: 'Failed to delete payout.', severity: 'error' });
          }
      }
  };

  const handleSubmitPayout = async () => {
      setSaving(true);
      try {
          // If event expenses were provided or modified, persist them to work order
          if (globalForm.eventId && (globalForm.travelExpense !== '' || globalForm.foodExpense !== '' || globalForm.stayExpense !== '')) {
              await updateWorkOrderExpenses(globalForm.eventId, {
                  travel_expense: Number(globalForm.travelExpense) || 0,
                  food_expense: Number(globalForm.foodExpense) || 0,
                  stay_expense: Number(globalForm.stayExpense) || 0
              });
          }

          if (editPayoutId) {
              const singlePayload = {
                  event_id: globalForm.eventId,
                  personnel_name: batchPersonnel[0].personnelName,
                  work_name: batchPersonnel[0].workName,
                  duration: batchPersonnel[0].duration,
                  amount_paid: Number(batchPersonnel[0].amountPaid),
                  payment_date: batchPersonnel[0].paymentDate,
                  notes: globalForm.notes
              };
              await updatePayout(editPayoutId, singlePayload);
              setSnackbar({ open: true, message: 'Payout updated successfully!', severity: 'success' });
          } else {
              const eligiblePersonnel = batchPersonnel.filter(
                  person => person.amountPaid !== '' && 
                            person.amountPaid !== null && 
                            person.amountPaid !== undefined && 
                            String(person.amountPaid).trim() !== '' && 
                            !isNaN(Number(person.amountPaid)) && 
                            Number(person.amountPaid) > 0
              );

              if (eligiblePersonnel.length > 0) {
                  const payloadArray = eligiblePersonnel.map(person => ({
                      event_id: globalForm.eventId,
                      personnel_name: person.personnelName,
                      work_name: person.workName,
                      duration: person.duration,
                      amount_paid: Number(person.amountPaid),
                      payment_date: person.paymentDate,
                      notes: globalForm.notes
                  }));
                  await API.post('/personnelPayouts', payloadArray);
                  setSnackbar({ 
                      open: true, 
                      message: `Payout logged for ${eligiblePersonnel.length} personnel successfully!`, 
                      severity: 'success' 
                  });
              } else if (globalForm.travelExpense !== '' || globalForm.foodExpense !== '' || globalForm.stayExpense !== '') {
                  setSnackbar({ 
                      open: true, 
                      message: 'Event expenses updated successfully!', 
                      severity: 'success' 
                  });
              }
              handleResetInlineForm();
          }
          setIsModalOpen(false);
          setEditPayoutId(null);
          fetchData(); 
      } catch (err) {
          console.error(err);
          const serverError = err.response?.data?.error || err.message;
          setSnackbar({ open: true, message: `Failed to save: ${serverError}`, severity: 'error' });
      } finally {
          setSaving(false);
      }
  };
  
  const openNewPayout = () => {
      setEditPayoutId(null);
      setGlobalForm({
          eventId: null,
          entryNumber: '',
          eventName: '',
          eventVenue: '',
          eventDate: '',
          travelExpense: '',
          foodExpense: '',
          stayExpense: '',
          notes: ''
      });
      setBatchPersonnel([]);
      setIsModalOpen(true);
  };

  const openEventExpenseModal = (order) => {
      setEditPayoutId(null);
      const existingTravel = order.travel_expense ?? order.workItems?.[0]?.travelExpense ?? '';
      const existingFood = order.food_expense ?? order.workItems?.[0]?.foodExpense ?? '';
      const existingStay = order.stay_expense ?? order.workItems?.[0]?.stayExpense ?? '';
      const pendingOrder = workOrders.find(w => w.id === order.id);

      setGlobalForm({
          eventId: order.id,
          entryNumber: order.entryNumber || '',
          eventName: order.workItems?.[0]?.eventName || '',
          eventVenue: order.workItems?.[0]?.eventVenue || '',
          eventDate: order.eventDate ? new Date(order.eventDate).toLocaleDateString('en-GB') : '',
          travelExpense: existingTravel ? String(existingTravel) : '',
          foodExpense: existingFood ? String(existingFood) : '',
          stayExpense: existingStay ? String(existingStay) : '',
          notes: ''
      });
      setBatchPersonnel(pendingOrder ? pendingOrder.personnelList : []);
      setIsModalOpen(true);
  };

  const toggleEventExpanded = (eventId) => {
      setExpandedEvents(prev => ({
          ...prev,
          [eventId]: !prev[eventId]
      }));
  };

  const isFormValid = () => {
      if (!globalForm.eventId) return false;

      if (editPayoutId) {
          return batchPersonnel.length > 0 && 
                 Boolean(batchPersonnel[0].personnelName) && 
                 batchPersonnel[0].amountPaid !== '' && 
                 !isNaN(Number(batchPersonnel[0].amountPaid)) && 
                 Number(batchPersonnel[0].amountPaid) > 0 && 
                 Boolean(batchPersonnel[0].paymentDate);
      }

      const personnelWithAmount = batchPersonnel.filter(
          p => p.amountPaid !== '' && 
               p.amountPaid !== null && 
               p.amountPaid !== undefined && 
               String(p.amountPaid).trim() !== '' && 
               !isNaN(Number(p.amountPaid)) && 
               Number(p.amountPaid) > 0
      );

      const hasValidPersonnel = personnelWithAmount.length > 0 && 
                                personnelWithAmount.every(p => Boolean(p.paymentDate));

      const hasEventExpenses = globalForm.travelExpense !== '' || 
                               globalForm.foodExpense !== '' || 
                               globalForm.stayExpense !== '';

      return hasValidPersonnel || hasEventExpenses;
  };

  // Event-Wise Expenses for all events whose invoices are paid
  const eventWiseExpenses = useMemo(() => {
      if (!rawWorkOrders.length || !paidInvoices.length) return [];

      const results = [];

      rawWorkOrders.forEach(order => {
          // Match paid invoices by entryNumber or workItems prefix
          const matchingInvoices = paidInvoices.filter(inv => {
              if (inv.parentOrderInfo?.entryNumber && String(inv.parentOrderInfo.entryNumber) === String(order.entryNumber)) {
                  return true;
              }
              if (Array.isArray(inv.workItems)) {
                  return inv.workItems.some(item => typeof item === 'string' && item.startsWith(`entry-${order.entryNumber}-`));
              }
              return false;
          });

          if (matchingInvoices.length > 0) {
              const invoiceNumbers = Array.from(new Set(matchingInvoices.map(i => i.invoiceNumber))).join(', ');
              const invoiceBilledAmount = matchingInvoices.reduce((sum, inv) => sum + getInvoiceFinancials(inv).invoiceAmount, 0);
              const invoiceBaseAmount = matchingInvoices.reduce((sum, inv) => sum + getInvoiceFinancials(inv).baseAmount, 0);
              const gstAmount = matchingInvoices.reduce((sum, inv) => sum + getInvoiceFinancials(inv).gstAmount, 0);
              const tdsAmount = matchingInvoices.reduce((sum, inv) => sum + getInvoiceFinancials(inv).tdsAmount, 0);
              const amountReceived = matchingInvoices.reduce((sum, inv) => sum + getInvoiceFinancials(inv).amountReceived, 0);

              // Personnel payouts for this event
              const eventPayouts = payouts.filter(p => p.event_id === order.id);
              const crewWages = eventPayouts.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

              // Event-level expenses
              const travelExpense = Number(order.travel_expense ?? order.workItems?.[0]?.travelExpense) || 0;
              const foodExpense = Number(order.food_expense ?? order.workItems?.[0]?.foodExpense) || 0;
              const stayExpense = Number(order.stay_expense ?? order.workItems?.[0]?.stayExpense) || 0;
              const totalExpense = crewWages + travelExpense + foodExpense + stayExpense + gstAmount;

              const netProfit = amountReceived - totalExpense;
              const profitMargin = amountReceived > 0 ? Number(((netProfit / amountReceived) * 100).toFixed(1)) : 0;

              const comp = companies.find(c => c.id === order.company_id || c.id === matchingInvoices[0]?.company_id);

              results.push({
                  order,
                  eventId: order.id,
                  entryNumber: order.entryNumber,
                  eventName: order.workItems?.[0]?.eventName || `Event #${order.entryNumber}`,
                  eventVenue: order.workItems?.[0]?.eventVenue || '',
                  eventDate: order.eventDate || order.event_date || '',
                  companyName: comp?.company_name || 'N/A',
                  matchingInvoices,
                  invoiceNumbers,
                  invoiceBilledAmount,
                  invoiceBaseAmount,
                  gstAmount,
                  tdsAmount,
                  amountReceived,
                  crewWages,
                  travelExpense,
                  foodExpense,
                  stayExpense,
                  totalExpense,
                  netProfit,
                  profitMargin,
                  eventPayouts
              });
          }
      });

      return results.sort((a, b) => Number(b.entryNumber || 0) - Number(a.entryNumber || 0));
  }, [rawWorkOrders, paidInvoices, payouts, companies, allItems]);

  const eventExpenseSummary = useMemo(() => {
      const totalEvents = eventWiseExpenses.length;
      const totalReceived = eventWiseExpenses.reduce((sum, e) => sum + e.amountReceived, 0);
      const totalExpenses = eventWiseExpenses.reduce((sum, e) => sum + e.totalExpense, 0);
      const totalCrew = eventWiseExpenses.reduce((sum, e) => sum + e.crewWages, 0);
      const totalTravel = eventWiseExpenses.reduce((sum, e) => sum + e.travelExpense, 0);
      const totalFood = eventWiseExpenses.reduce((sum, e) => sum + e.foodExpense, 0);
      const totalStay = eventWiseExpenses.reduce((sum, e) => sum + e.stayExpense, 0);
      const totalGst = eventWiseExpenses.reduce((sum, e) => sum + e.gstAmount, 0);
      const netProfit = totalReceived - totalExpenses;
      const margin = totalReceived > 0 ? Number(((netProfit / totalReceived) * 100).toFixed(1)) : 0;

      return {
          totalEvents,
          totalReceived,
          totalExpenses,
          totalCrew,
          totalTravel,
          totalFood,
          totalStay,
          totalGst,
          netProfit,
          margin
      };
  }, [eventWiseExpenses]);

  if (loading) {
      return <AmountPaidSkeleton />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center" fontWeight="bold" sx={{ mb: 4 }}>Amount Paid Hub</Typography>

      <Grid container spacing={4}>
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#818cf8', fontWeight: 600 }}>
                        <AddCardIcon /> Paid Assigned Personnel
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a1a1aa', fontSize: '0.825rem', mt: 0.5 }}>
                        Log new crew disbursements and manage settled personnel payout records.
                    </Typography>
                </Box>

                {/* Inline Batch Log Personnel Payouts Form */}
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        mb: 4,
                        bgcolor: 'rgba(24, 24, 27, 0.60)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px'
                    }}
                >
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#f4f4f5', mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddCardIcon sx={{ color: '#818cf8', fontSize: 20 }} /> Log Event Personnel Payouts
                    </Typography>

                    <Grid container spacing={2.5}>
                        {/* Event Selector */}
                        <Grid item xs={12}>
                            <Autocomplete
                                options={workOrders}
                                value={selectedEventOption}
                                getOptionLabel={(option) => {
                                    return `Entry: ${option.entryNumber} | ${option.extractedEventName || 'N/A'}`;
                                }}
                                onChange={handleEventSelection}
                                renderInput={(params) => <TextField {...params} label="Select Pending Event" fullWidth />}
                            />
                        </Grid>

                        {/* Event Details (Read-Only) */}
                        <Grid item xs={12} sm={3}>
                            <TextField label="Entry Number" fullWidth value={globalForm.entryNumber} disabled InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }} />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField label="Event Name" fullWidth value={globalForm.eventName} disabled />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField label="Event Venue" fullWidth value={globalForm.eventVenue} disabled />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField label="Event Date" fullWidth value={globalForm.eventDate} disabled InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }} />
                        </Grid>

                        {/* Common Event Expenses: Travel, Food, Stay */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Travel Expense (₹)"
                                type="number"
                                fullWidth
                                size="small"
                                disabled={!globalForm.eventId}
                                value={globalForm.travelExpense}
                                onChange={(e) => setGlobalForm({ ...globalForm, travelExpense: e.target.value })}
                                placeholder="0"
                                InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Food Expense (₹)"
                                type="number"
                                fullWidth
                                size="small"
                                disabled={!globalForm.eventId}
                                value={globalForm.foodExpense}
                                onChange={(e) => setGlobalForm({ ...globalForm, foodExpense: e.target.value })}
                                placeholder="0"
                                InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Stay Expense (₹)"
                                type="number"
                                fullWidth
                                size="small"
                                disabled={!globalForm.eventId}
                                value={globalForm.stayExpense}
                                onChange={(e) => setGlobalForm({ ...globalForm, stayExpense: e.target.value })}
                                placeholder="0"
                                InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                            />
                        </Grid>

                        {/* Batch Personnel Array */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mt: 1, mb: 1.5, color: '#818cf8', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 1 }}>
                                Assigned Personnel
                            </Typography>
                            {batchPersonnel.length === 0 ? (
                                <Typography variant="body2" sx={{ color: '#71717a', fontStyle: 'italic', py: 1 }}>
                                    Select an event from the dropdown above to view assigned personnel.
                                </Typography>
                            ) : (
                                batchPersonnel.map((person, idx) => (
                                    <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px' }}>
                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <TextField label="Personnel Name" sx={{ flex: 1, minWidth: '130px' }} value={person.personnelName} disabled size="small" />
                                            <TextField label="Work Name" sx={{ flex: 1, minWidth: '130px' }} value={person.workName} disabled size="small" />
                                            <TextField label="Duration / Subcategory" sx={{ flex: 1, minWidth: '130px' }} value={person.duration} disabled size="small" />
                                            <TextField
                                                label="Amount Paid (Rs)"
                                                type="number"
                                                sx={{ flex: 1, minWidth: '130px' }}
                                                placeholder="Leave blank to skip"
                                                size="small"
                                                value={person.amountPaid}
                                                onChange={(e) => handleBatchAmountChange(idx, e.target.value)}
                                                InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                                            />
                                            <TextField
                                                label="Payment Date"
                                                type="date"
                                                sx={{ flex: 1, minWidth: '130px' }}
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                                value={person.paymentDate}
                                                onChange={(e) => handleBatchDateChange(idx, e.target.value)}
                                                InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                                            />
                                        </Box>
                                    </Paper>
                                ))
                            )}
                        </Grid>

                        {/* Global Notes */}
                        <Grid item xs={12}>
                            <TextField
                                label="Global Notes (Optional)"
                                multiline
                                rows={2}
                                fullWidth
                                value={globalForm.notes}
                                onChange={e => setGlobalForm({ ...globalForm, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>

                    {/* Actions Bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <Button
                            variant="outlined"
                            onClick={handleResetInlineForm}
                            disabled={saving || (!globalForm.eventId && !selectedEventOption)}
                            sx={{ color: '#a1a1aa', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                        >
                            Clear Form
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmitPayout}
                            disabled={!isFormValid() || saving}
                            sx={{ px: 3 }}
                        >
                            {saving ? <CircularProgress size={22} color="inherit" /> : 'Save Batch Payout'}
                        </Button>
                    </Box>
                </Paper>

                {/* Subtitle for Settled Payouts Table */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#f4f4f5' }}>
                        Settled Payouts History
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#71717a', fontFamily: '"JetBrains Mono", monospace' }}>
                        {payouts.length} {payouts.length === 1 ? 'record' : 'records'}
                    </Typography>
                </Box>
                <TableContainer sx={{ border: '1px solid rgba(255, 255, 255, 0.10)', borderRadius: '12px' }}>
                  <Table>
                      <TableHead sx={{ bgcolor: 'rgba(9, 9, 11, 0.60)' }}>
                          <TableRow>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>Entry Number</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>Event Details</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>Personnel Name</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>Work Name</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>Amount Paid (Rs)</TableCell>
                              <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>Payment Date</TableCell>
                              <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}>Actions</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {payouts.length === 0 ? (
                              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#a1a1aa' }}>No payouts logged yet.</TableCell></TableRow>
                          ) : (
                              (() => {
                                  const payoutsByEvent = [];
                                  const eventGroups = {};
                                  payouts.forEach(p => {
                                      if (!eventGroups[p.event_id]) {
                                          eventGroups[p.event_id] = [];
                                          payoutsByEvent.push(eventGroups[p.event_id]);
                                      }
                                      eventGroups[p.event_id].push(p);
                                  });

                                  return payoutsByEvent.map(group => {
                                      return group.map((p, index) => {
                                          const oOrder = rawWorkOrders.find(o => o.id === p.event_id);
                                          const eName = oOrder?.workItems?.[0]?.eventName || '';
                                          const eVenue = oOrder?.workItems?.[0]?.eventVenue || '';
                                          
                                          let displayWorkName = p.work_name;
                                          if (oOrder && oOrder.workItems) {
                                              for (const item of oOrder.workItems) {
                                                  let personnelArray = item.personnel || [];
                                                  
                                                  // Retrofit legacy records
                                                  if (item.workMain === 'Two_Camera_Setup' && personnelArray.length > 0 && !personnelArray[0].role) {
                                                      const roles = ['Mixer Operator', 'Camera Operator', 'Camera Operator', 'Assistant'];
                                                      personnelArray = personnelArray.map((per, i) => ({ ...per, role: roles[i] || 'Assistant' }));
                                                  } else if (item.workMain === 'Three_Camera_Setup' && personnelArray.length > 0 && !personnelArray[0].role) {
                                                      const roles = ['Mixer Operator', 'Camera Operator', 'Camera Operator', 'Camera Operator', 'Assistant'];
                                                      personnelArray = personnelArray.map((per, i) => ({ ...per, role: roles[i] || 'Assistant' }));
                                                  }

                                                  const person = personnelArray.find(person => person.name === p.personnel_name);
                                                  if (person && person.role) {
                                                      displayWorkName = person.role;
                                                      break;
                                                  }
                                              }
                                          }

                                          return (
                                              <TableRow key={p.id} hover sx={{ '&:hover': { bgcolor: 'rgba(39, 39, 42, 0.40)' } }}>
                                                  {index === 0 && (
                                                      <TableCell rowSpan={group.length} sx={{ verticalAlign: 'top', borderRight: '1px solid rgba(255, 255, 255, 0.08)', fontFamily: '"JetBrains Mono", monospace', color: '#818cf8', fontWeight: 600 }}>
                                                          Entry {p.workOrders?.entryNumber}
                                                      </TableCell>
                                                  )}
                                                  {index === 0 && (
                                                      <TableCell rowSpan={group.length} sx={{ verticalAlign: 'top', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                                          {eName}
                                                          {eVenue && <Typography variant="caption" display="block" sx={{ color: '#a1a1aa' }}>📍 {eVenue}</Typography>}
                                                          {(() => {
                                                              const travel = Number(oOrder?.travel_expense ?? oOrder?.workItems?.[0]?.travelExpense) || 0;
                                                              const food = Number(oOrder?.food_expense ?? oOrder?.workItems?.[0]?.foodExpense) || 0;
                                                              const stay = Number(oOrder?.stay_expense ?? oOrder?.workItems?.[0]?.stayExpense) || 0;
                                                              if (!travel && !food && !stay) return null;
                                                              return (
                                                                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                      {travel > 0 && (
                                                                          <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', px: 0.8, py: 0.2, bgcolor: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.7rem' }}>
                                                                              Travel: ₹{travel.toLocaleString('en-IN')}
                                                                          </Typography>
                                                                      )}
                                                                      {food > 0 && (
                                                                          <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', px: 0.8, py: 0.2, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#fcd34d', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.7rem' }}>
                                                                              Food: ₹{food.toLocaleString('en-IN')}
                                                                          </Typography>
                                                                      )}
                                                                      {stay > 0 && (
                                                                          <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', px: 0.8, py: 0.2, bgcolor: 'rgba(52, 211, 153, 0.12)', color: '#6ee7b7', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.25)', fontSize: '0.7rem' }}>
                                                                              Stay: ₹{stay.toLocaleString('en-IN')}
                                                                          </Typography>
                                                                      )}
                                                                  </Box>
                                                              );
                                                          })()}
                                                      </TableCell>
                                                  )}
                                                  <TableCell sx={{ fontWeight: 500 }}>{p.personnel_name}</TableCell>
                                                  <TableCell>{displayWorkName}</TableCell>
                                                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#34d399', fontWeight: 600 }}>₹{Number(p.amount_paid).toLocaleString('en-IN')}</TableCell>
                                                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.payment_date}</TableCell>
                                                  <TableCell align="right">
                                                      <IconButton size="small" onClick={() => handleEditPayout(p)} sx={{ color: '#818cf8' }}>
                                                          <EditIcon fontSize="small" />
                                                      </IconButton>
                                                      <IconButton size="small" onClick={() => handleDeletePayout(p.id)} color="error">
                                                          <DeleteIcon fontSize="small" />
                                                      </IconButton>
                                                  </TableCell>
                                              </TableRow>
                                          );
                                      });
                                  });
                              })()
                          )}
                      </TableBody>
                  </Table>
                </TableContainer>
            </Paper>
        </Grid>
      
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#34d399', fontWeight: 600 }}>
                    <CheckCircleIcon sx={{ color: '#34d399' }} /> Paid Invoices
                </Typography>
                <TableContainer sx={{ border: '1px solid rgba(255, 255, 255, 0.10)', borderRadius: '12px', overflowX: 'auto' }}>
                  <Table sx={{ minWidth: 960 }}>
                      <TableHead sx={{ bgcolor: 'rgba(9, 9, 11, 0.60)' }}>
                          <TableRow sx={{ '& th': { whiteSpace: 'nowrap', py: 1.5, verticalAlign: 'middle', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' } }}>
                              <TableCell>Date Saved</TableCell>
                              <TableCell>Invoice Number</TableCell>
                              <TableCell>Company</TableCell>
                              <TableCell>Vendor</TableCell>
                              <TableCell>Invoice Amount</TableCell>
                              <TableCell>TDS & Other (3%)</TableCell>
                              <TableCell>Amount Received</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {paidInvoices.length === 0 ? (
                              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: '#a1a1aa' }}>No paid invoices found.</TableCell></TableRow>
                          ) : (
                              paidInvoices.map((inv) => {
                                  const { baseAmount, invoiceAmount, tdsAmount, amountReceived } = getInvoiceFinancials(inv);
                                  return (
                                      <TableRow key={inv.id} hover sx={{ '&:hover': { bgcolor: 'rgba(39, 39, 42, 0.40)' } }}>
                                          <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(inv.createdAt).toLocaleString()}</TableCell>
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                              <Tooltip title={`Click to review saved invoice #${inv.invoiceNumber}`} arrow>
                                                  <Typography
                                                      component="span"
                                                      onClick={() => handleReviewInvoice(inv)}
                                                      sx={{
                                                          fontFamily: '"JetBrains Mono", monospace',
                                                          color: '#818cf8',
                                                          fontWeight: 700,
                                                          cursor: 'pointer',
                                                          textDecoration: 'underline',
                                                          textUnderlineOffset: '3px',
                                                          fontSize: '0.85rem',
                                                          transition: 'color 0.15s ease',
                                                          '&:hover': {
                                                              color: '#a5b4fc',
                                                              textDecorationThickness: '2px'
                                                          }
                                                      }}
                                                  >
                                                      {inv.invoiceNumber}
                                                  </Typography>
                                              </Tooltip>
                                          </TableCell>
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{companies.find(c => c.id === inv.company_id)?.company_name || 'N/A'}</TableCell>
                                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{inv.parentOrderInfo?.vendor || 'N/A'}</TableCell>
                                          <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: '#e4e4e7', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                  ₹{invoiceAmount.toLocaleString('en-IN')}
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                  Base: ₹{baseAmount.toLocaleString('en-IN')}
                                              </Typography>
                                          </TableCell>
                                          <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: '#fbbf24', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                  ₹{tdsAmount.toLocaleString('en-IN')}
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                  3% Base
                                              </Typography>
                                          </TableCell>
                                          <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                              <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#34d399', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                  ₹{amountReceived.toLocaleString('en-IN')}
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                  Invoice − TDS
                                              </Typography>
                                          </TableCell>
                                      </TableRow>
                                  );
                              })
                          )}
                      </TableBody>
                  </Table>
                </TableContainer>
            </Paper>
        </Grid>

        {/* Event Expense Section (Paid Invoices) */}
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
                    <Box>
                        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f59e0b', fontWeight: 600 }}>
                            <ReceiptLongIcon sx={{ color: '#f59e0b' }} /> Event Expense
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a1a1aa', fontSize: '0.825rem', mt: 0.2 }}>
                            Event-wise expense breakdown, crew disbursements, and net operating margins for events with paid invoices.
                        </Typography>
                    </Box>
                </Box>

                {/* Summary KPI Cards Bar */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{
                            p: 2,
                            borderRadius: '10px',
                            bgcolor: 'rgba(24, 24, 27, 0.60)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Settled Events
                            </Typography>
                            <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.4rem', fontWeight: 800, color: '#f4f4f5', mt: 0.5 }}>
                                {eventExpenseSummary.totalEvents} Events
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem' }}>
                                Invoices marked as paid
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{
                            p: 2,
                            borderRadius: '10px',
                            bgcolor: 'rgba(24, 24, 27, 0.60)',
                            border: '1px solid rgba(52, 211, 153, 0.20)'
                        }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Total Amount Received
                            </Typography>
                            <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.4rem', fontWeight: 800, color: '#34d399', mt: 0.5 }}>
                                ₹{eventExpenseSummary.totalReceived.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem' }}>
                                Inflows from paid events
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{
                            p: 2,
                            borderRadius: '10px',
                            bgcolor: 'rgba(24, 24, 27, 0.60)',
                            border: '1px solid rgba(251, 113, 133, 0.20)'
                        }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Total Event Expenses
                            </Typography>
                            <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.4rem', fontWeight: 800, color: '#fb7185', mt: 0.5 }}>
                                ₹{eventExpenseSummary.totalExpenses.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem' }}>
                                Crew + Travel + Food + Stay + GST
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{
                            p: 2,
                            borderRadius: '10px',
                            bgcolor: 'rgba(24, 24, 27, 0.60)',
                            border: '1px solid rgba(129, 140, 248, 0.20)'
                        }}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Net Operating Margin
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.4rem', fontWeight: 800, color: eventExpenseSummary.netProfit >= 0 ? '#34d399' : '#fb7185' }}>
                                    ₹{eventExpenseSummary.netProfit.toLocaleString('en-IN')}
                                </Typography>
                                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 700, color: eventExpenseSummary.margin >= 0 ? '#34d399' : '#fb7185' }}>
                                    ({eventExpenseSummary.margin}%)
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem' }}>
                                Amount Received − Expenses
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* Event Expense Table */}
                <TableContainer sx={{ border: '1px solid rgba(255, 255, 255, 0.10)', borderRadius: '12px', overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 1280 }}>
                        <TableHead sx={{ bgcolor: 'rgba(9, 9, 11, 0.60)' }}>
                            <TableRow sx={{ '& th': { whiteSpace: 'nowrap', verticalAlign: 'middle', py: 1.5, px: 1.5, fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace' } }}>
                                <TableCell sx={{ width: 44, minWidth: 44, p: 1 }} />
                                <TableCell sx={{ minWidth: 105 }}>Entry / Date</TableCell>
                                <TableCell sx={{ minWidth: 160 }}>Event Details</TableCell>
                                <TableCell sx={{ minWidth: 159 }}>Client & Invoice</TableCell>
                                <TableCell sx={{ minWidth: 140 }}>Amount Received</TableCell>
                                <TableCell sx={{ minWidth: 115 }}>Crew Wages</TableCell>
                                <TableCell sx={{ minWidth: 165 }}>Travel / Food / Stay</TableCell>
                                <TableCell sx={{ minWidth: 125 }}>GST (18%)</TableCell>
                                <TableCell sx={{ minWidth: 115 }}>Total Expense</TableCell>
                                <TableCell sx={{ minWidth: 105 }}>Net Profit</TableCell>
                                <TableCell align="right" sx={{ minWidth: 80 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {eventWiseExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 3, color: '#a1a1aa' }}>
                                        No events with paid invoices found yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                eventWiseExpenses.map((ev) => {
                                    const isExpanded = !!expandedEvents[ev.eventId];
                                    return (
                                        <React.Fragment key={ev.eventId}>
                                            <TableRow hover sx={{ '&:hover': { bgcolor: 'rgba(39, 39, 42, 0.40)' } }}>
                                                {/* Expand Chevron */}
                                                <TableCell sx={{ p: 1, whiteSpace: 'nowrap' }}>
                                                    <Tooltip title={isExpanded ? "Collapse crew breakdown" : "Expand crew breakdown"}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => toggleEventExpanded(ev.eventId)}
                                                            sx={{
                                                                color: isExpanded ? '#f59e0b' : '#a1a1aa',
                                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>

                                                {/* Entry & Date */}
                                                <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#818cf8', fontWeight: 700, fontSize: '0.85rem' }}>
                                                        Entry {ev.entryNumber}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#a1a1aa', fontSize: '0.75rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                        {ev.eventDate ? (isNaN(new Date(ev.eventDate).getTime()) ? ev.eventDate : new Date(ev.eventDate).toLocaleDateString('en-GB')) : 'N/A'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Event Name & Venue */}
                                                <TableCell sx={{ verticalAlign: 'middle' }}>
                                                    <Typography sx={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.85rem' }}>
                                                        {ev.eventName}
                                                    </Typography>
                                                    {ev.eventVenue && (
                                                        <Typography variant="caption" sx={{ color: '#a1a1aa', display: 'block', fontSize: '0.75rem' }}>
                                                            📍 {ev.eventVenue}
                                                        </Typography>
                                                    )}
                                                </TableCell>

                                                {/* Client & Invoice */}
                                                <TableCell sx={{ verticalAlign: 'middle' }}>
                                                    <Typography sx={{ fontSize: '0.85rem', color: '#e4e4e7', fontWeight: 500, whiteSpace: 'wrap' }}>
                                                        {ev.companyName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', flexWrap: 'wrap', mt: 0.3 }}>
                                                        {ev.matchingInvoices && ev.matchingInvoices.length > 0 ? (
                                                            ev.matchingInvoices.map((inv) => (
                                                                <Tooltip key={inv.id || inv.invoiceNumber} title={`Click to review saved invoice #${inv.invoiceNumber}`} arrow>
                                                                    <Typography
                                                                        component="span"
                                                                        onClick={() => handleReviewInvoice(inv)}
                                                                        sx={{
                                                                            fontFamily: '"JetBrains Mono", monospace',
                                                                            color: '#818cf8',
                                                                            cursor: 'pointer',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 600,
                                                                            textDecoration: 'underline',
                                                                            textUnderlineOffset: '2px',
                                                                            whiteSpace: 'nowrap',
                                                                            transition: 'color 0.15s ease',
                                                                            '&:hover': {
                                                                                color: '#a5b4fc',
                                                                                textDecorationThickness: '2px'
                                                                            }
                                                                        }}
                                                                    >
                                                                        Inv #{inv.invoiceNumber}
                                                                    </Typography>
                                                                </Tooltip>
                                                            ))
                                                        ) : (
                                                            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: '#818cf8', display: 'block', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                                Inv #{ev.invoiceNumbers}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>

                                                {/* Amount Received */}
                                                <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#34d399', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                        ₹{ev.amountReceived.toLocaleString('en-IN')}
                                                    </Typography>
                                                    {ev.invoiceBilledAmount !== ev.amountReceived && (
                                                        <Box sx={{ mt: 0.2 }}>
                                                            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                                TDS: ₹{ev.tdsAmount?.toLocaleString('en-IN')}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                                Billed: ₹{ev.invoiceBilledAmount.toLocaleString('en-IN')}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </TableCell>

                                                {/* Crew Wages */}
                                                <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: ev.crewWages > 0 ? '#fb7185' : '#71717a', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                        ₹{ev.crewWages.toLocaleString('en-IN')}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                        {ev.eventPayouts.length} crew {ev.eventPayouts.length === 1 ? 'member' : 'members'}
                                                    </Typography>
                                                </TableCell>

                                                {/* Travel / Food / Stay */}
                                                <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                                                        {ev.travelExpense > 0 && (
                                                            <Tooltip title="Travel Expense">
                                                                <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', px: 0.8, py: 0.2, bgcolor: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                                                    T: ₹{ev.travelExpense.toLocaleString('en-IN')}
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                        {ev.foodExpense > 0 && (
                                                            <Tooltip title="Food Expense">
                                                                <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', px: 0.8, py: 0.2, bgcolor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                                                    F: ₹{ev.foodExpense.toLocaleString('en-IN')}
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                        {ev.stayExpense > 0 && (
                                                            <Tooltip title="Stay Expense">
                                                                <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', px: 0.8, py: 0.2, bgcolor: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', borderRadius: '4px', border: '1px solid rgba(167, 139, 250, 0.25)', fontSize: '0.7rem', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                                                    S: ₹{ev.stayExpense.toLocaleString('en-IN')}
                                                                </Typography>
                                                            </Tooltip>
                                                        )}
                                                        {ev.travelExpense === 0 && ev.foodExpense === 0 && ev.stayExpense === 0 && (
                                                            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                                ₹0
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </TableCell>

                                                {/* GST (18%) Expense */}
                                                <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: ev.gstAmount > 0 ? '#06b6d4' : '#71717a', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                        ₹{ev.gstAmount.toLocaleString('en-IN')}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                                                        18% on ₹{ev.invoiceBaseAmount?.toLocaleString('en-IN')}
                                                    </Typography>
                                                </TableCell>

                                                {/* Total Expense */}
                                                <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: '#fb7185', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                        ₹{ev.totalExpense.toLocaleString('en-IN')}
                                                    </Typography>
                                                </TableCell>

                                                {/* Net Profit & Margin */}
                                                <TableCell sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: ev.netProfit >= 0 ? '#34d399' : '#fb7185', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                        ₹{ev.netProfit.toLocaleString('en-IN')}
                                                    </Typography>
                                                    <Box sx={{
                                                        display: 'inline-block',
                                                        px: 0.8,
                                                        py: 0.1,
                                                        borderRadius: '4px',
                                                        bgcolor: ev.profitMargin >= 0 ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)',
                                                        color: ev.profitMargin >= 0 ? '#34d399' : '#fb7185',
                                                        fontFamily: '"JetBrains Mono", monospace',
                                                        fontSize: '0.68rem',
                                                        fontWeight: 600,
                                                        mt: 0.3,
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {ev.profitMargin >= 0 ? `+${ev.profitMargin}%` : `${ev.profitMargin}%`} margin
                                                    </Box>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell align="right" sx={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                                                        onClick={() => openEventExpenseModal(ev.order)}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            textTransform: 'none',
                                                            whiteSpace: 'wrap',
                                                            borderColor: 'rgba(245, 158, 11, 0.35)',
                                                            color: '#fbbf24',
                                                            '&:hover': {
                                                                borderColor: '#f59e0b',
                                                                bgcolor: 'rgba(245, 158, 11, 0.10)'
                                                            }
                                                        }}
                                                    >
                                                        Edit Expenses
                                                    </Button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expandable Crew Drawer Sub-Row */}
                                            <TableRow>
                                                <TableCell colSpan={11} sx={{ py: 0, px: 2, bgcolor: 'rgba(24, 24, 27, 0.40)', borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.10)' : 'none' }}>
                                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                        <Box sx={{ py: 2, px: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                                                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#f4f4f5' }}>
                                                                    Personnel Payouts for Entry {ev.entryNumber} — {ev.eventName}
                                                                </Typography>
                                                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                        Travel: <b style={{ color: '#38bdf8' }}>₹{ev.travelExpense.toLocaleString('en-IN')}</b>
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                        Food: <b style={{ color: '#f59e0b' }}>₹{ev.foodExpense.toLocaleString('en-IN')}</b>
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                        Stay: <b style={{ color: '#a78bfa' }}>₹{ev.stayExpense.toLocaleString('en-IN')}</b>
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                        Crew: <b style={{ color: '#fb7185' }}>₹{ev.crewWages.toLocaleString('en-IN')}</b>
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                        GST (18%): <b style={{ color: '#06b6d4' }}>₹{ev.gstAmount.toLocaleString('en-IN')}</b>
                                                                    </Typography>
                                                                </Box>
                                                            </Box>

                                                            {ev.eventPayouts.length === 0 ? (
                                                                <Typography sx={{ fontSize: '0.75rem', color: '#71717a', py: 1 }}>
                                                                    No personnel payouts logged yet for this event. Use "Edit Expenses" to log crew payouts.
                                                                </Typography>
                                                            ) : (
                                                                <Table size="small" sx={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', overflow: 'hidden' }}>
                                                                    <TableHead sx={{ bgcolor: 'rgba(9, 9, 11, 0.70)' }}>
                                                                        <TableRow>
                                                                            <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#a1a1aa' }}>Personnel</TableCell>
                                                                            <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#a1a1aa' }}>Role / Work</TableCell>
                                                                            <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#a1a1aa' }}>Duration / Location</TableCell>
                                                                            <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#a1a1aa' }}>Payment Date</TableCell>
                                                                            <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem', color: '#a1a1aa' }}>Amount Paid</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {ev.eventPayouts.map((p) => (
                                                                            <TableRow key={p.id} sx={{ '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' } }}>
                                                                                <TableCell sx={{ fontSize: '0.75rem', color: '#e4e4e7', fontWeight: 500 }}>
                                                                                    {p.personnel_name}
                                                                                </TableCell>
                                                                                <TableCell sx={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                                    {p.work_name || 'Personnel'}
                                                                                </TableCell>
                                                                                <TableCell sx={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                                    {p.duration || 'Standard'}
                                                                                </TableCell>
                                                                                <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: '#a1a1aa' }}>
                                                                                    {p.payment_date || (p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : 'N/A')}
                                                                                </TableCell>
                                                                                <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', fontWeight: 700, color: '#fb7185' }}>
                                                                                    ₹{Number(p.amount_paid || 0).toLocaleString('en-IN')}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            )}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid>
      </Grid>

      <Dialog 
        open={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditPayoutId(null); }} 
        maxWidth="md" 
        fullWidth
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(9, 9, 11, 0.7)', backdropFilter: 'blur(8px)' } }
        }}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(24, 24, 27, 0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            overflow: 'hidden'
          }
        }}
      >
          {/* Spotlight glow */}
          <Box sx={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 320,
            height: 120,
            bgcolor: 'rgba(99, 102, 241, 0.15)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }} />

          <DialogTitle sx={{ color: '#f4f4f5', fontWeight: 700, letterSpacing: '-0.02em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {editPayoutId ? 'Edit Personnel Payout' : 'Edit Event Expenses & Payouts'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2.5}>
                  {!editPayoutId && (
                  <Grid item xs={12}>
                      <Autocomplete
                          options={workOrders}
                          getOptionLabel={(option) => {
                              return `Entry: ${option.entryNumber} | ${option.extractedEventName || 'N/A'}`;
                          }}
                          onChange={handleEventSelection}
                          renderInput={(params) => <TextField {...params} label="Select Pending Event" fullWidth />}
                      />
                  </Grid>
                  )}
                  
                  {/* Global Event Details */}
                  <Grid item xs={12} sm={3}>
                      <TextField label="Entry Number" fullWidth value={globalForm.entryNumber} disabled InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                      <TextField label="Event Name" fullWidth value={globalForm.eventName} disabled />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                      <TextField label="Event Venue" fullWidth value={globalForm.eventVenue} disabled />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                      <TextField label="Event Date" fullWidth value={globalForm.eventDate} disabled InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }} />
                  </Grid>

                  {/* Common Event Expenses: Travel, Food, Stay */}
                  <Grid item xs={12} sm={4}>
                      <TextField
                          label="Travel Expense (₹)"
                          type="number"
                          fullWidth
                          size="small"
                          disabled={!globalForm.eventId}
                          value={globalForm.travelExpense}
                          onChange={(e) => setGlobalForm({ ...globalForm, travelExpense: e.target.value })}
                          placeholder="0"
                          InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                      />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                      <TextField
                          label="Food Expense (₹)"
                          type="number"
                          fullWidth
                          size="small"
                          disabled={!globalForm.eventId}
                          value={globalForm.foodExpense}
                          onChange={(e) => setGlobalForm({ ...globalForm, foodExpense: e.target.value })}
                          placeholder="0"
                          InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                      />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                      <TextField
                          label="Stay Expense (₹)"
                          type="number"
                          fullWidth
                          size="small"
                          disabled={!globalForm.eventId}
                          value={globalForm.stayExpense}
                          onChange={(e) => setGlobalForm({ ...globalForm, stayExpense: e.target.value })}
                          placeholder="0"
                          InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                      />
                  </Grid>

                  {/* Batch Personnel Array */}
                  <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mt: 1, mb: 1.5, color: '#818cf8', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 1 }}>
                          Assigned Personnel
                      </Typography>
                      {batchPersonnel.length === 0 ? (
                          <Typography variant="body2" sx={{ color: '#71717a', fontStyle: 'italic' }}>Select an event to view assigned personnel.</Typography>
                      ) : (
                          batchPersonnel.map((person, idx) => (
                              <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px' }}>
                                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                      <TextField label="Personnel Name" sx={{ flex: 1, minWidth: '130px' }} value={person.personnelName} disabled size="small" />
                                      <TextField label="Work Name" sx={{ flex: 1, minWidth: '130px' }} value={person.workName} disabled size="small" />
                                      <TextField label="Duration / Subcategory" sx={{ flex: 1, minWidth: '130px' }} value={person.duration} disabled size="small" />
                                      <TextField
                                          label="Amount Paid (Rs)"
                                          type="number"
                                          sx={{ flex: 1, minWidth: '130px' }}
                                          placeholder={editPayoutId ? undefined : "Leave blank to skip"}
                                          required={Boolean(editPayoutId)}
                                          size="small"
                                          value={person.amountPaid}
                                          onChange={(e) => handleBatchAmountChange(idx, e.target.value)}
                                          InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                                      />
                                      <TextField
                                          label="Payment Date"
                                          type="date"
                                          sx={{ flex: 1, minWidth: '130px' }}
                                          required={Boolean(editPayoutId)}
                                          size="small"
                                          InputLabelProps={{ shrink: true }}
                                          value={person.paymentDate}
                                          onChange={(e) => handleBatchDateChange(idx, e.target.value)}
                                          InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                                      />
                                  </Box>
                              </Paper>
                          ))
                      )}
                  </Grid>

                  {/* Global Payout Details */}
                  <Grid item xs={12}>
                      <TextField
                          label="Global Notes (Optional)"
                          multiline
                          rows={2}
                          fullWidth
                          value={globalForm.notes}
                          onChange={e => setGlobalForm({...globalForm, notes: e.target.value})}
                      />
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Button onClick={() => { setIsModalOpen(false); setEditPayoutId(null); }}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={handleSubmitPayout} disabled={!isFormValid() || saving}>
                  {saving ? <CircularProgress size={22} /> : (editPayoutId ? 'Update Payout' : 'Save Batch')}
              </Button>
          </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AmountPaid;
