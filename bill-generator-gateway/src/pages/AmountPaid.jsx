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
  const [payoutForm, setPayoutForm] = useState({
      eventId: null,
      entryNumber: '',
      eventName: '',
      eventVenue: '',
      personnelName: '',
      workName: '',
      duration: '',
      amountPaid: '',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ''
  });
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
                  
                  if (personnelMap.size === 0) {
                      let allWorkNames = new Set();
                      let allWorkSubs = new Set();
                      items.forEach(item => {
                          if (item.workMain) allWorkNames.add(item.workMain.replaceAll('_', ' '));
                          if (item.workSub) allWorkSubs.add(item.workSub.replaceAll('_', ' '));
                      });
                      pendingPayoutOptions.push({
                          ...order,
                          extracted: {
                              personnelName: '',
                              workName: Array.from(allWorkNames).join(', '),
                              duration: Array.from(allWorkSubs).join(', '),
                              amountPaid: '',
                              eventName: eName,
                              eventVenue: eVenue
                          }
                      });
                  } else {
                      let idx = 0;
                      for (const [pName, pData] of personnelMap.entries()) {
                          pendingPayoutOptions.push({
                              ...order,
                              id: \`\${order.id}-\${idx}\`,
                              originalId: order.id,
                              extracted: {
                                  personnelName: pName,
                                  workName: Array.from(pData.workNames).join(', '),
                                  duration: Array.from(pData.workSubs).join(', '),
                                  amountPaid: Math.round(pData.totalRate) || '',
                                  eventName: eName,
                                  eventVenue: eVenue
                              }
                          });
                          idx++;
                      }
                  }
              });
              
              // Filter out payouts that are already saved
              const filteredOptions = pendingPayoutOptions.filter(opt => {
                  return !savedPayouts.some(p => p.event_id === opt.originalId && p.personnel_name === opt.extracted.personnelName);
              });
              
              setWorkOrders(filteredOptions);
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
          setPayoutForm({ ...payoutForm, eventId: null, entryNumber: '', eventName: '', eventVenue: '', personnelName: '', workName: '', duration: '', amountPaid: '' });
          return;
      }
      
      setPayoutForm({
          ...payoutForm,
          eventId: selectedOrder.originalId || selectedOrder.id,
          entryNumber: selectedOrder.entryNumber || '',
          eventName: selectedOrder.extracted.eventName,
          eventVenue: selectedOrder.extracted.eventVenue,
          personnelName: selectedOrder.extracted.personnelName,
          workName: selectedOrder.extracted.workName,
          duration: selectedOrder.extracted.duration,
          amountPaid: selectedOrder.extracted.amountPaid ? selectedOrder.extracted.amountPaid.toString() : ''
      });
  };
  
  const handleEditPayout = (payout) => {
      const oOrder = rawWorkOrders.find(o => o.id === payout.event_id);
      setEditPayoutId(payout.id);
      setPayoutForm({
          eventId: payout.event_id,
          entryNumber: oOrder?.entryNumber || '',
          eventName: oOrder?.workItems?.[0]?.eventName || '',
          eventVenue: oOrder?.workItems?.[0]?.eventVenue || '',
          personnelName: payout.personnel_name,
          workName: payout.work_name || '',
          duration: payout.duration || '',
          amountPaid: payout.amount_paid.toString(),
          paymentDate: payout.payment_date || new Date().toISOString().split('T')[0],
          notes: payout.notes || ''
      });
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
          const payload = {
              event_id: payoutForm.eventId,
              personnel_name: payoutForm.personnelName,
              work_name: payoutForm.workName,
              duration: payoutForm.duration,
              amount_paid: Number(payoutForm.amountPaid),
              payment_date: payoutForm.paymentDate,
              notes: payoutForm.notes
          };
          if (editPayoutId) {
              await updatePayout(editPayoutId, payload);
              setSnackbar({ open: true, message: 'Payout updated successfully!', severity: 'success' });
          } else {
              await API.post('/personnelPayouts', payload);
              setSnackbar({ open: true, message: 'Payout logged successfully!', severity: 'success' });
          }
          setIsModalOpen(false);
          setEditPayoutId(null);
          fetchData(); 
      } catch (err) {
          console.error(err);
          const serverError = err.response?.data?.error || err.message;
          setSnackbar({ open: true, message: \`Failed to save: \${serverError}\`, severity: 'error' });
      } finally {
          setSaving(false);
      }
  };
  
  const openNewPayout = () => {
      setEditPayoutId(null);
      setPayoutForm({ eventId: null, entryNumber: '', eventName: '', eventVenue: '', personnelName: '', workName: '', duration: '', amountPaid: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
      setIsModalOpen(true);
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
                                        <Typography variant="caption" color="textSecondary">{eName}{eVenue ? \` - \${eVenue}\` : ''}</Typography>
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

      <Dialog open={isModalOpen} onClose={() => { setIsModalOpen(false); setEditPayoutId(null); }} maxWidth="sm" fullWidth>
          <DialogTitle>{editPayoutId ? 'Edit Personnel Payout' : 'Log Personnel Payout'}</DialogTitle>
          <DialogContent dividers>
              <Grid container spacing={2}>
                  {!editPayoutId && (
                  <Grid item xs={12}>
                      <Autocomplete
                          options={workOrders}
                          getOptionLabel={(option) => {
                              return \`Entry: \${option.entryNumber} | \${option.extracted?.eventName || 'N/A'} \${option.extracted?.personnelName ? \`| Person: \${option.extracted.personnelName}\` : ''}\`;
                          }}
                          onChange={handleEventSelection}
                          renderInput={(params) => <TextField {...params} label="Select Pending Event" fullWidth />}
                      />
                  </Grid>
                  )}
                  <Grid item xs={4}>
                      <TextField label="Entry Number" fullWidth value={payoutForm.entryNumber} disabled />
                  </Grid>
                  <Grid item xs={4}>
                      <TextField label="Event Name" fullWidth value={payoutForm.eventName} disabled />
                  </Grid>
                  <Grid item xs={4}>
                      <TextField label="Event Venue" fullWidth value={payoutForm.eventVenue} disabled />
                  </Grid>
                  <Grid item xs={12}>
                      <TextField
                          label="Personnel Name"
                          fullWidth
                          value={payoutForm.personnelName}
                          onChange={e => setPayoutForm({...payoutForm, personnelName: e.target.value})}
                          disabled={!!editPayoutId}
                      />
                  </Grid>
                  <Grid item xs={12}>
                      <TextField
                          label="Work Name"
                          fullWidth
                          value={payoutForm.workName}
                          onChange={e => setPayoutForm({...payoutForm, workName: e.target.value})}
                      />
                  </Grid>
                  <Grid item xs={6}>
                      <TextField
                          label="Duration / Subcategory"
                          fullWidth
                          value={payoutForm.duration}
                          onChange={e => setPayoutForm({...payoutForm, duration: e.target.value})}
                      />
                  </Grid>
                  <Grid item xs={6}>
                      <TextField
                          label="Amount Paid (Rs)"
                          type="number"
                          fullWidth
                          required
                          value={payoutForm.amountPaid}
                          onChange={e => setPayoutForm({...payoutForm, amountPaid: e.target.value})}
                      />
                  </Grid>
                  <Grid item xs={12}>
                      <TextField
                          label="Payment Date"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={payoutForm.paymentDate}
                          onChange={e => setPayoutForm({...payoutForm, paymentDate: e.target.value})}
                      />
                  </Grid>
                  <Grid item xs={12}>
                      <TextField
                          label="Notes (Optional)"
                          multiline
                          rows={2}
                          fullWidth
                          value={payoutForm.notes}
                          onChange={e => setPayoutForm({...payoutForm, notes: e.target.value})}
                      />
                  </Grid>
              </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => { setIsModalOpen(false); setEditPayoutId(null); }}>Cancel</Button>
              <Button variant="contained" color="secondary" onClick={handleSubmitPayout} disabled={!payoutForm.personnelName || !payoutForm.amountPaid || saving}>
                  {saving ? <CircularProgress size={24} /> : (editPayoutId ? 'Update Payout' : 'Save Payout')}
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
