import React, { useState, useEffect } from 'react';
import {
  Container, Typography, TextField, Button, Grid, Paper, Box, IconButton,
  Select, MenuItem, FormControl, InputLabel, Divider
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { getWorkOrders, createWorkOrder } from '../services/api';

// --- DATA CONSTANTS ---
const subWorks = {
  "Still_Photography": ["Mumbai_Upto_4_Hrs", "Mumbai_Above_4_and_upto_8_Hrs", "Panvel_Upto_4_Hrs", "Panvel_Above_4_and_upto_8_Hrs", "Uran_Upto_4_Hrs", "Uran_Above_4_and_upto_8_Hrs", "Nhava_Upto_4_Hrs", "Nhava_Above_4_and_upto_8_Hrs", "Outstation_Upto_4_Hrs", "Outstation_Above_4_and_upto_8_Hrs"],
  "Videography": ["Mumbai_Upto_4_Hrs", "Mumbai_Above_4_and_upto_8_Hrs", "Panvel_Upto_4_Hrs", "Panvel_Above_4_and_upto_8_Hrs", "Uran_Upto_4_Hrs", "Uran_Above_4_and_upto_8_Hrs", "Nhava_Upto_4_Hrs", "Nhava_Above_4_and_upto_8_Hrs", "Outstation_Upto_4_Hrs", "Outstation_Above_4_and_upto_8_Hrs"],
  "Two_Camera_Setup": ["Mumbai_Upto_4_Hrs", "Mumbai_Above_4_and_upto_8_Hrs", "Panvel_Upto_4_Hrs", "Panvel_Above_4_and_upto_8_Hrs", "Uran_Upto_4_Hrs", "Uran_Above_4_and_upto_8_Hrs", "Nhava_Upto_4_Hrs", "Nhava_Above_4_and_upto_8_Hrs", "Outstation_Upto_4_Hrs", "Outstation_Above_4_and_upto_8_Hrs"],
  "Three_Camera_Setup": ["Mumbai_Upto_4_Hrs", "Mumbai_Above_4_and_upto_8_Hrs", "Panvel_Upto_4_Hrs", "Panvel_Above_4_and_upto_8_Hrs", "Uran_Upto_4_Hrs", "Uran_Above_4_and_upto_8_Hrs", "Nhava_Upto_4_Hrs", "Nhava_Above_4_and_upto_8_Hrs", "Outstation_Upto_4_Hrs", "Outstation_Above_4_and_upto_8_Hrs"],
  "Live_Telecast": ["Mumbai_Upto_4_Hrs", "Mumbai_Above_4_and_upto_8_Hrs", "Panvel_Upto_4_Hrs", "Panvel_Above_4_and_upto_8_Hrs", "Uran_Upto_4_Hrs", "Uran_Above_4_and_upto_8_Hrs", "Nhava_Upto_4_Hrs", "Nhava_Above_4_and_upto_8_Hrs", "Outstation_Upto_4_Hrs", "Outstation_Above_4_and_upto_8_Hrs"],
  "Others": []
};

const venues = [
  'NBP Green Heights, BKC, Bandra (East), Mumbai - 400051',
  'Vasudhara Bhavan, Western Express Highway, Bandra (East), Mumbai – 400051',
  '11 High, Sion-Bandra Link Rd, Sion West, Mumbai - 400017',
  'Helibase, Airport area, Juhu, Mumbai - 400049',
  "Maker Tower 'E', Chamundeshwari Nagar, Cuffe Parade, Mumbai - 400005",
  'Phase-I, Panvel, Navi Mumbai – 410221',
  'Phase-II, Panvel, Navi Mumbai – 410221',
  'Uran Plant, Dronagiri Bhavan, Uran, Distt Raigad 400702',
  'Nhava Supply Base, Navi Mumbai - 410206',
  'Hotel Novotel, Juhu Beach, Mumbai - 400 049',
  'JW Marriott,  Juhu, Mumbai - 400 049',
  'Hotel Taj Lands End, Bandstand, Bandra (w) Mumbai 400050',
  'Aurika Hotel, Near T2 Terminal, Mumbai',
  'Others'
];

const WorkOrder = () => {
  const [formData, setFormData] = useState({
    entryNumber: '',
    eventDate: '',
    vendor: '',
    workItems: [
      { eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '' }
    ]
  });
  const [latestEntry, setLatestEntry] = useState(null);

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
  }, []);

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkItemChange = (index, e) => {
    const { name, value } = e.target;
    const newWorkItems = [...formData.workItems];
    newWorkItems[index][name] = value;

    // If the main item's details change, propagate them to all other items
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
              // Inherit all details from the first item
              eventName: firstItem.eventName,
              poNpo: firstItem.poNpo,
              eventTime: firstItem.eventTime,
              eventVenue: firstItem.eventVenue,
              contactPerson: firstItem.contactPerson,
              contactNumber: firstItem.contactNumber,
              customVenue: firstItem.customVenue,
              // Clear only the fields for the new item's specific work
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
    try {
      await createWorkOrder(formData);
      alert('Work Order created successfully!');
      setFormData({
        entryNumber: '', eventDate: '', vendor: '',
        workItems: [{ eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '' }]
      });
      fetchLatestEntry();
    } catch (error) {
      console.error('Failed to create work order:', error);
      if (error.response?.data?.error) {
        alert(`Failed to create work order:\n- ${error.response.data.error.join('\n- ')}`);
      } else {
        alert('Failed to create work order. Please ensure all required fields are filled correctly.');
      }
    }
  };

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">Event Data Entry</Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField name="entryNumber" label="Entry Number" required fullWidth value={formData.entryNumber} onChange={handleMainChange} helperText={latestEntry ? `Last entry was: ${latestEntry}` : 'Enter the first entry number.'} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField name="eventDate" label="Event Date" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={formData.eventDate} onChange={handleMainChange} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel>Vendor</InputLabel>
              <Select name="vendor" value={formData.vendor} label="Vendor" onChange={handleMainChange}>
                <MenuItem value="ICOMP SYSTEMS">ICOMP SYSTEMS</MenuItem>
                <MenuItem value="STUDIO VISION">STUDIO VISION</MenuItem>
                <MenuItem value="WAGHSONS PHOTO VISION">WAGHSONS PHOTO VISION</MenuItem>
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

            {/* --- THIS IS THE NEW CONDITIONAL RENDERING LOGIC --- */}
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
                {item.workMain === '32_GB_Pendrive' ? (
                    <Grid item xs={12} sm={6}>
                        <TextField name="quantity" label="Quantity" type="number" required fullWidth value={item.quantity} onChange={(e) => handleWorkItemChange(index, e)} InputProps={{ inputProps: { min: 1 } }} />
                    </Grid>
                ) : item.workMain === 'Others' ? (
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
            </Grid>
          </Paper>
        ))}

        <Button startIcon={<AddCircleOutlineIcon />} onClick={addWorkItem} sx={{ mt: 2 }}>
          Add Another Item
        </Button>

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }}>
          Save The Data
        </Button>
      </Box>
    </Container>
  );
};

export default WorkOrder;