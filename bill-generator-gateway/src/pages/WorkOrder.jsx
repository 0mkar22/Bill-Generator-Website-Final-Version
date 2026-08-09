import React, { useState, useEffect } from 'react';
import {
  Container, Typography, TextField, Button, Grid, Paper, Box, IconButton,
  Select, MenuItem, FormControl, InputLabel, Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getWorkOrders, createWorkOrder } from '../services/api';
import { supabase } from '../supabase';
import { subWorks, venues, vendors } from '../constants/data';

const WorkOrder = () => {
  const [formData, setFormData] = useState({
    entryNumber: '',
    eventDate: '',
    vendor: '',
    company_id: '',
    workItems: [
      { eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '' }
    ]
  });
  const [latestEntry, setLatestEntry] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ company_name: '', address: '', gst_number: '' });

  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from('companies').select('*');
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };
  const fetchLatestEntry = async () => {
    try {
        const response = await getWorkOrders();
        const workOrders = response.data.data || [];
        if (workOrders.length > 0) {
            const latest = workOrders.reduce((max, order) =>
                parseInt(order.entryNumber, 10) > parseInt(max.entryNumber, 10) ? order : max,
                { entryNumber: '0' }
            );
            setLatestEntry(latest.entryNumber);
        }
    } catch (error) {
        console.error("Failed to fetch latest entry number:", error);
    }
  };

  useEffect(() => {
    fetchLatestEntry();
    fetchCompanies();
  }, []);

  const handleSaveCompany = async () => {
    try {
      const { data, error } = await supabase.from('companies').insert([newCompany]).select();
      if (error) throw error;
      setCompanies(prev => [...prev, data[0]]);
      setFormData(prev => ({ ...prev, company_id: data[0].id }));
      setIsCompanyModalOpen(false);
      setNewCompany({ company_name: '', address: '', gst_number: '' });
      setSnackbar({ open: true, message: 'Company added successfully!', severity: 'success' });
    } catch (error) {
      console.error('Failed to add company:', error);
      setSnackbar({ open: true, message: 'Failed to add company.', severity: 'error' });
    }
  };

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkItemChange = (index, e) => {
    const { name, value } = e.target;
    const newWorkItems = [...formData.workItems];
    newWorkItems[index][name] = value;

    if (index === 0 && ['eventName', 'poNpo', 'eventTime', 'eventVenue', 'contactPerson', 'contactNumber', 'customVenue'].includes(name)) {
        for (let i = 1; i < newWorkItems.length; i++) {
            newWorkItems[i][name] = value;
        }
    }

    if (name === 'workMain') {
        newWorkItems[index]['workSub'] = '';
        newWorkItems[index]['quantity'] = 1;
    }
    setFormData(prev => ({ ...prev, workItems: newWorkItems }));
  };

  const addWorkItem = () => {
    const firstItem = formData.workItems[0];
    setFormData(prev => ({
      ...prev,
      workItems: [
          ...prev.workItems,
          {
              eventName: firstItem.eventName,
              poNpo: firstItem.poNpo,
              eventTime: firstItem.eventTime,
              eventVenue: firstItem.eventVenue,
              contactPerson: firstItem.contactPerson,
              contactNumber: firstItem.contactNumber,
              customVenue: firstItem.customVenue,
              workMain: '',
              workSub: '',
              quantity: 1,
              customWorkMain: ''
          }
      ]
    }));
  };

  const removeWorkItem = (index) => {
    const newWorkItems = formData.workItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, workItems: newWorkItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWorkOrder(formData);
      setSnackbar({ open: true, message: 'Work Order created successfully!', severity: 'success' });
      setFormData({
        entryNumber: '', eventDate: '', vendor: '', company_id: '',
        workItems: [{ eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '' }]
      });
      fetchLatestEntry();
    } catch (error) {
      console.error('Failed to create work order:', error);
      const serverError = error.response?.data?.error;
      const msg = Array.isArray(serverError) ? serverError.join(', ') : (serverError || 'Failed to create work order. Please ensure all required fields are filled correctly.');
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">Event Data Entry</Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Select Company</InputLabel>
              <Select name="company_id" value={formData.company_id} label="Select Company" onChange={handleMainChange}>
                <MenuItem value="" onClick={() => setIsCompanyModalOpen(true)}>
                  <em>+ Add New Company</em>
                </MenuItem>
                {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.company_name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField name="entryNumber" label="Entry Number" required fullWidth value={formData.entryNumber} onChange={handleMainChange} helperText={latestEntry ? `Last entry was: ${latestEntry}` : 'Enter the first entry number.'} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField name="eventDate" label="Event Date" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={formData.eventDate} onChange={handleMainChange} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth required>
              <InputLabel>Vendor</InputLabel>
              <Select name="vendor" value={formData.vendor} label="Vendor" onChange={handleMainChange}>
                {vendors.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {formData.workItems.map((item, index) => (
          <Paper key={index} sx={{ p: 2, mt: 3, border: '1px solid #ddd' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Work Item #{index + 1}</Typography>
              {formData.workItems.length > 1 && (
                <IconButton onClick={() => removeWorkItem(index)} color="error">
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </Box>

            {index === 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}><TextField name="eventName" label="Event Name" required fullWidth value={item.eventName} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>
                    <Grid item xs={12} sm={6}><FormControl fullWidth required><InputLabel>PO/NPO</InputLabel><Select name="poNpo" value={item.poNpo} label="PO/NPO" onChange={(e) => handleWorkItemChange(index, e)}><MenuItem value="PO">PO</MenuItem><MenuItem value="NPO">NPO</MenuItem></Select></FormControl></Grid>
                    <Grid item xs={12} sm={6}><TextField name="eventTime" label="Event Time" type="time" required fullWidth InputLabelProps={{ shrink: true }} value={item.eventTime} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>
                    <Grid item xs={12} sm={6}><FormControl fullWidth required><InputLabel>Event Venue</InputLabel><Select name="eventVenue" value={item.eventVenue} label="Event Venue" onChange={(e) => handleWorkItemChange(index, e)}>{venues.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</Select></FormControl></Grid>
                    {item.eventVenue === 'Others' && <Grid item xs={12}><TextField name="customVenue" label="Custom Venue" required fullWidth value={item.customVenue} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>}
                    <Grid item xs={12} sm={6}><TextField name="contactPerson" label="Contact Person" required fullWidth value={item.contactPerson} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="contactNumber" label="Contact Number" required fullWidth value={item.contactNumber} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>
                    <Grid item xs={12}><Divider>Work Details</Divider></Grid>
                </Grid>
            )}

            <Grid container spacing={2} sx={{ mt: index === 0 ? 1 : 0 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                        <InputLabel>Work Name</InputLabel>
                        <Select name="workMain" value={item.workMain} label="Work Name" onChange={(e) => handleWorkItemChange(index, e)}>
                            <MenuItem value="Still_Photography">Still Photography</MenuItem>
                            <MenuItem value="Videography">Videography</MenuItem>
                            <MenuItem value="Two_Camera_Setup">Two Video Cameras Live Setup</MenuItem>
                            <MenuItem value="Three_Camera_Setup">Three Video Cameras Live Setup</MenuItem>
                            <MenuItem value="Live_Telecast">Live Telecast Setup</MenuItem>
                            <MenuItem value="32_GB_Pendrive">32 GB Pendrive</MenuItem>
                            <MenuItem value="Others">Others</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {item.workMain === 'Others' ? (
                    <Grid item xs={12} sm={6}>
                        <TextField name="customWorkMain" label="Custom Work Name" required fullWidth value={item.customWorkMain} onChange={(e) => handleWorkItemChange(index, e)} />
                    </Grid>
                ) : (
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required={!!item.workMain} disabled={!item.workMain}>
                            <InputLabel>Work Subcategory</InputLabel>
                            <Select name="workSub" value={item.workSub} label="Work Subcategory" onChange={(e) => handleWorkItemChange(index, e)}>
                                {(subWorks[item.workMain] || []).map(sub => (
                                    <MenuItem key={sub} value={sub}>{sub.replaceAll('_', ' ')}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
                {item.workMain !== '32_GB_Pendrive' && (
                    <Grid item xs={12} sm={6}>
                        <TextField name="quantity" label="Quantity" type="number" required fullWidth value={item.quantity} onChange={(e) => handleWorkItemChange(index, e)} InputProps={{ inputProps: { min: 1 } }} />
                    </Grid>
                )}
            </Grid>
          </Paper>
        ))}

        <Button startIcon={<AddCircleOutlineIcon />} onClick={addWorkItem} sx={{ mt: 2 }}>
          Add Another Item
        </Button>

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={submitting}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save The Data'}
        </Button>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Dialog open={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)}>
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Company Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCompany.company_name}
            onChange={(e) => setNewCompany({...newCompany, company_name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Address"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newCompany.address}
            onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
          />
          <TextField
            margin="dense"
            label="GST Number"
            type="text"
            fullWidth
            variant="outlined"
            value={newCompany.gst_number}
            onChange={(e) => setNewCompany({...newCompany, gst_number: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCompany} variant="contained" disabled={!newCompany.company_name}>Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkOrder;
