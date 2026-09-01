import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Autocomplete, Snackbar, Alert, CircularProgress, IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCardIcon from '@mui/icons-material/AddCard';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import API, { getWorkOrders, getCompanies, updatePayout, deletePayout } from '../services/api';

const AmountPaid = () => {
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [rawWorkOrders, setRawWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPayoutId, setEditPayoutId] = useState(null);

  // Global Event Form Data
  const [globalForm, setGlobalForm] = useState({
      eventId: null,
      entryNumber: '',
      eventName: '',
      eventVenue: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
  });

  // Batch Personnel Array (for new) or Single Personnel (for edit)
  const [batchPersonnel, setBatchPersonnel] = useState([]);

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
              setPaidInvoices(invoices.filter(inv => inv.status === 'paid'));
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

                  const personnelMap = new Map();

                  items.forEach(item => {
                      const pList = Array.isArray(item.personnel) ? item.personnel.filter(p => p.name) : [];
                      
                      pList.forEach(p => {
                          const pName = p.name;
                          if (!personnelMap.has(pName)) {
                              personnelMap.set(pName, { workNames: new Set(), workSubs: new Set(), totalRate: 0 });
                          }
                          const pData = personnelMap.get(pName);
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
                              workName: Array.from(pData.workNames).join(', '),
                              duration: Array.from(pData.workSubs).join(', '),
                              amountPaid: Math.round(pData.totalRate) ? Math.round(pData.totalRate).toString() : ''
                          });
                      }
                  }

                  // Only push the event if there are still unpaid personnel
                  if (extractedPersonnel.length > 0) {
                      pendingPayoutOptions.push({
                          ...order,
                          extractedEventName: eName,
                          extractedEventVenue: eVenue,
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

  const handleEventSelection = (event, selectedOrder) => {
      if (!selectedOrder) {
          setGlobalForm({ ...globalForm, eventId: null, entryNumber: '', eventName: '', eventVenue: '' });
          setBatchPersonnel([]);
          return;
      }
      
      setGlobalForm({
          ...globalForm,
          eventId: selectedOrder.id,
          entryNumber: selectedOrder.entryNumber || '',
          eventName: selectedOrder.extractedEventName,
          eventVenue: selectedOrder.extractedEventVenue
      });
      setBatchPersonnel(selectedOrder.personnelList);
  };

  const handleBatchAmountChange = (index, value) => {
      const updated = [...batchPersonnel];
      updated[index].amountPaid = value;
      setBatchPersonnel(updated);
  };
  
  const handleEditPayout = (payout) => {
      const oOrder = rawWorkOrders.find(o => o.id === payout.event_id);
      setEditPayoutId(payout.id);
      
      setGlobalForm({
          eventId: payout.event_id,
          entryNumber: oOrder?.entryNumber || '',
          eventName: oOrder?.workItems?.[0]?.eventName || '',
          eventVenue: oOrder?.workItems?.[0]?.eventVenue || '',
          paymentDate: payout.payment_date || new Date().toISOString().split('T')[0],
          notes: payout.notes || ''
      });
      
      setBatchPersonnel([{
          personnelName: payout.personnel_name,
          workName: payout.work_name || '',
          duration: payout.duration || '',
          amountPaid: payout.amount_paid.toString()
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
          if (editPayoutId) {
              const singlePayload = {
                  event_id: globalForm.eventId,
                  personnel_name: batchPersonnel[0].personnelName,
                  work_name: batchPersonnel[0].workName,
                  duration: batchPersonnel[0].duration,
                  amount_paid: Number(batchPersonnel[0].amountPaid),
                  payment_date: globalForm.paymentDate,
                  notes: globalForm.notes
              };
              await updatePayout(editPayoutId, singlePayload);
              setSnackbar({ open: true, message: 'Payout updated successfully!', severity: 'success' });
          } else {
              const payloadArray = batchPersonnel.map(person => ({
                  event_id: globalForm.eventId,
                  personnel_name: person.personnelName,
                  work_name: person.workName,
                  duration: person.duration,
                  amount_paid: Number(person.amountPaid),
                  payment_date: globalForm.paymentDate,
                  notes: globalForm.notes
              }));
              await API.post('/personnelPayouts', payloadArray);
              setSnackbar({ open: true, message: 'Batch payout logged successfully!', severity: 'success' });
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
      setGlobalForm({ eventId: null, entryNumber: '', eventName: '', eventVenue: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
      setBatchPersonnel([]);
      setIsModalOpen(true);
  };

  const isFormValid = () => {
      if (!globalForm.eventId) return false;
      if (batchPersonnel.length === 0) return false;
      return batchPersonnel.every(p => p.personnelName && p.amountPaid !== '');
  };

  if (loading) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <CircularProgress />
          </Box>
      );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center" fontWeight="bold">Amount Paid Hub</Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" /> Paid Invoices
                </Typography>
                <TableContainer>
                  <Table>
                      <TableHead>
                          <TableRow>
                              <TableCell>Date Saved</TableCell>
                              <TableCell>Invoice Number</TableCell>
                              <TableCell>Company</TableCell>
                              <TableCell>Vendor</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {paidInvoices.length === 0 ? (
                              <TableRow><TableCell colSpan={4} align="center">No paid invoices found.</TableCell></TableRow>
                          ) : (
                              paidInvoices.map((inv) => (
                                  <TableRow key={inv.id}>
                                      <TableCell>{new Date(inv.createdAt).toLocaleString()}</TableCell>
                                      <TableCell>{inv.invoiceNumber}</TableCell>
                                      <TableCell>{companies.find(c => c.id === inv.company_id)?.company_name || 'N/A'}</TableCell>
                                      <TableCell>{inv.parentOrderInfo?.vendor || 'N/A'}</TableCell>
                                  </TableRow>
                              ))
                          )}
                      </TableBody>
                  </Table>
                </TableContainer>
            </Paper>
        </Grid>

        <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddCardIcon /> Paid Assigned Personnel
                    </Typography>
                    <Button variant="contained" color="secondary" onClick={openNewPayout}>
                        Log Payout
                    </Button>
                </Box>
                <TableContainer>
                  <Table>
                      <TableHead>
                          <TableRow>
                              <TableCell>Payment Date</TableCell>
                              <TableCell>Event Details</TableCell>
                              <TableCell>Personnel Name</TableCell>
                              <TableCell>Work Name</TableCell>
                              <TableCell>Amount Paid (Rs)</TableCell>
                              <TableCell align="right">Actions</TableCell>
                          </TableRow>
                      </TableHead>
                      <TableBody>
                          {payouts.length === 0 ? (
                              <TableRow><TableCell colSpan={6} align="center">No payouts logged yet.</TableCell></TableRow>
                          ) : (
                              payouts.map((p) => {
                                  const oOrder = rawWorkOrders.find(o => o.id === p.event_id);
                                  const eName = oOrder?.workItems?.[0]?.eventName || '';
                                  const eVenue = oOrder?.workItems?.[0]?.eventVenue || '';
                                  
                                  return (
                                  <TableRow key={p.id}>
                                      <TableCell>{p.payment_date}</TableCell>
                                      <TableCell>
                                        <strong>Entry {p.workOrders?.entryNumber}</strong> <br/>
                                        <Typography variant="caption" color="textSecondary">{eName}{eVenue ? ` - ${eVenue}` : ''}</Typography>
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>{p.personnel_name}</TableCell>
                                      <TableCell>{p.work_name}</TableCell>
                                      <TableCell>₹{p.amount_paid}</TableCell>
                                      <TableCell align="right">
                                          <IconButton size="small" color="primary" onClick={() => handleEditPayout(p)}><EditIcon /></IconButton>
                                          <IconButton size="small" color="error" onClick={() => handleDeletePayout(p.id)}><DeleteIcon /></IconButton>
                                      </TableCell>
                                  </TableRow>
                              )})
                          )}
                      </TableBody>
                  </Table>
                </TableContainer>
            </Paper>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => { setIsModalOpen(false); setEditPayoutId(null); }} maxWidth="md" fullWidth>
          <DialogTitle>{editPayoutId ? 'Edit Personnel Payout' : 'Batch Log Personnel Payouts'}</DialogTitle>
          <DialogContent dividers>
              <Grid container spacing={3}>
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
                  <Grid item xs={4}>
                      <TextField label="Entry Number" fullWidth value={globalForm.entryNumber} disabled />
                  </Grid>
                  <Grid item xs={4}>
                      <TextField label="Event Name" fullWidth value={globalForm.eventName} disabled />
                  </Grid>
                  <Grid item xs={4}>
                      <TextField label="Event Venue" fullWidth value={globalForm.eventVenue} disabled />
                  </Grid>

                  {/* Batch Personnel Array */}
                  <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                          Assigned Personnel
                      </Typography>
                      {batchPersonnel.length === 0 ? (
                          <Typography variant="body2" color="textSecondary">Select an event to view assigned personnel.</Typography>
                      ) : (
                          batchPersonnel.map((person, idx) => (
                              <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#fafafa' }}>
                                  <Grid container spacing={2} alignItems="center">
                                      <Grid item xs={3}>
                                          <TextField label="Personnel Name" fullWidth value={person.personnelName} disabled size="small" />
                                      </Grid>
                                      <Grid item xs={3}>
                                          <TextField label="Work Name" fullWidth value={person.workName} disabled size="small" />
                                      </Grid>
                                      <Grid item xs={3}>
                                          <TextField label="Duration / Subcategory" fullWidth value={person.duration} disabled size="small" />
                                      </Grid>
                                      <Grid item xs={3}>
                                          <TextField
                                              label="Amount Paid (Rs)"
                                              type="number"
                                              fullWidth
                                              required
                                              size="small"
                                              value={person.amountPaid}
                                              onChange={(e) => handleBatchAmountChange(idx, e.target.value)}
                                          />
                                      </Grid>
                                  </Grid>
                              </Paper>
                          ))
                      )}
                  </Grid>

                  {/* Global Payout Details */}
                  <Grid item xs={12} sm={6}>
                      <TextField
                          label="Global Payment Date"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={globalForm.paymentDate}
                          onChange={e => setGlobalForm({...globalForm, paymentDate: e.target.value})}
                      />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <TextField
                          label="Global Notes (Optional)"
                          multiline
                          fullWidth
                          value={globalForm.notes}
                          onChange={e => setGlobalForm({...globalForm, notes: e.target.value})}
                      />
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => { setIsModalOpen(false); setEditPayoutId(null); }}>Cancel</Button>
              <Button variant="contained" color="secondary" onClick={handleSubmitPayout} disabled={!isFormValid() || saving}>
                  {saving ? <CircularProgress size={24} /> : (editPayoutId ? 'Update Payout' : 'Save Batch')}
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
