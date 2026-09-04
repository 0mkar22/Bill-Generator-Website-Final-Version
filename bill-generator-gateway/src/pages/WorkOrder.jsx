import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Button, Grid, Paper, Box, IconButton,
  Select, MenuItem, FormControl, InputLabel, Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete, Switch, FormControlLabel, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import API, { getWorkOrders, createWorkOrder, getCompanies, getTeam, createCompany, updateCompany, upsertTeam } from '../services/api';
import { supabase } from '../supabase';
import { subWorks, venues, vendors, vidhanMandalWorks, noPersonnelWorks, bannerSubs } from '../constants/data';
import { calculateItemAmount, convertMarathiToEnglishNumbers } from '../utils/helpers';
import { useWorkOrderForm } from '../hooks/useWorkOrderForm';

import CompanyModal from '../components/CompanyModal';
import VenueModal from '../components/VenueModal';
import WorkOrderItem from '../components/WorkOrderItem';

const getRatesTemplateForCompany = (companyName = '') => {
  const isVidhan = companyName.includes('महाराष्ट्र विधान मंडळ सचिवालय');

  if (isVidhan) {
    const rates = {};
    Object.keys(vidhanMandalWorks).forEach(work => {
      rates[work] = {};
      vidhanMandalWorks[work].forEach(sub => {
        rates[work][sub] = '';
      });
    });
    return rates;
  }

  const baseLocations = ['Mumbai', 'Panvel', 'Uran', 'Nhava', 'Outstation'];
  const generateCategoryRates = (workMain) => {
    const rates = {};
    const rawSubWorks = subWorks[workMain] || [];
    const hasLocationPrefix = rawSubWorks.some(sub => 
      ['mumbai', 'panvel', 'uran', 'nhava', 'outstation'].some(loc => sub.toLowerCase().includes(loc))
    );

    if (hasLocationPrefix) {
      rawSubWorks.forEach(dur => { rates[dur] = ''; });
    } else {
      baseLocations.forEach(loc => {
        rawSubWorks.forEach(dur => {
          rates[`${loc}_${dur}`] = '';
        });
      });
    }
    return rates;
  };

  return {
    Still_Photography: generateCategoryRates('Still_Photography'),
    Videography: generateCategoryRates('Videography'),
    Two_Camera_Setup: generateCategoryRates('Two_Camera_Setup'),
    Three_Camera_Setup: generateCategoryRates('Three_Camera_Setup'),
    Live_Telecast: generateCategoryRates('Live_Telecast'),
    Storage: { '32GB': '', '64GB': '', '128GB': '', '256GB': '', '1TB': '', '2TB': '' }
  };
};

const WorkOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;
  const [latestEntry, setLatestEntry] = useState(null);
  const [existingEntryNumbers, setExistingEntryNumbers] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [historicalPersonnel, setHistoricalPersonnel] = useState([]);
    const [localVenues, setLocalVenues] = useState(() => {
        const saved = localStorage.getItem('customVenues');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return Array.from(new Set([...venues, ...parsed]));
            } catch(e) {}
        }
        return venues;
    });
    const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
    const [newVenueText, setNewVenueText] = useState('');
    const [editingVenueOldName, setEditingVenueOldName] = useState(null);
  const [historicalContacts, setHistoricalContacts] = useState([]);

  const {
      formData, setFormData, handleMainChange, handleWorkItemChange, handleDimensionChange,
      addDimensionRow, removeDimensionRow, handleAssemblyTypeChange, handleMemberNameChange,
      addMemberRow, removeMemberRow, addAssemblyGroup, removeAssemblyGroup, handlePersonnelChange,
      addWorkItem, removeWorkItem
  } = useWorkOrderForm({
    entryNumber: '',
    eventDate: '',
    vendor: 'ICOMP SYSTEMS',
    company_id: '',
    workItems: [
      { 
        eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', roomNumber: '',
        workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '', customRate: '',
        dimensions: [{ length: '', breadth: '', qty: 1 }],
        assemblyDetails: [{ assemblyType: '', members: [''] }],
        personnel: [{ name: '', number: '' }]
      }
    ]
  }, historicalContacts, historicalPersonnel);
  
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [expandedItem, setExpandedItem] = useState(0);
  const [newCompany, setNewCompany] = useState({ 
    company_name: '', 
    address: '', 
    gst_number: '', 
    is_govt_client: false,
    requires_po_number: false,
    uses_marathi_labels: false,
    work_rates: getRatesTemplateForCompany()
  });

  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!editingCompanyId && isCompanyModalOpen) {
      const isVidhan = newCompany.company_name.includes('महाराष्ट्र विधान मंडळ सचिवालय');
      const currentIsVidhan = Object.keys(newCompany.work_rates).includes('फोटोग्राफी');
      
      if (isVidhan && !currentIsVidhan) {
        setNewCompany(prev => ({ ...prev, work_rates: getRatesTemplateForCompany(prev.company_name) }));
      } else if (!isVidhan && currentIsVidhan) {
        setNewCompany(prev => ({ ...prev, work_rates: getRatesTemplateForCompany(prev.company_name) }));
      }
    }
  }, [newCompany.company_name, isCompanyModalOpen, editingCompanyId]);

  const fetchCompanies = async () => {
    try {
      const response = await getCompanies();
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchTeamData = async () => {
    try {
      const response = await getTeam();
      setHistoricalPersonnel(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
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
            setExistingEntryNumbers(workOrders.map(o => String(o.entryNumber)));

            const cMap = new Map();

            workOrders.forEach(order => {
                let wItems = [];
                if (typeof order.workItems === 'string') {
                    try { wItems = JSON.parse(order.workItems); } catch(e) {}
                } else if (Array.isArray(order.workItems)) {
                    wItems = order.workItems;
                }
                
                wItems.forEach(item => {
                    if (item.contactPerson && item.contactNumber) {
                        cMap.set(item.contactPerson.trim().toLowerCase(), { 
                            name: item.contactPerson.trim(), 
                            number: item.contactNumber.trim() 
                        });
                    }
                });
            });
            setHistoricalContacts(Array.from(cMap.values()));
        }
    } catch (error) {
        console.error("Failed to fetch latest entry & history:", error);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchLatestEntry();
    fetchTeamData(); 

    if (editData) {
      let parsedItems = [];
      if (Array.isArray(editData.workItems)) {
        parsedItems = editData.workItems;
      } else if (typeof editData.workItems === 'string') {
        try { parsedItems = JSON.parse(editData.workItems); } catch (e) {}
      }

      if (parsedItems.length === 0) {
        parsedItems = [{ 
          eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', roomNumber: '',
          workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '', customRate: '',
          dimensions: [{ length: '', breadth: '', qty: 1 }],
          assemblyDetails: [{ assemblyType: '', members: [''] }],
          personnel: [{ name: '', number: '' }]
        }];
      } else {
        parsedItems = parsedItems.map(item => {
          if (item.eventVenue === 'Others') {
              item.eventVenue = item.customVenue || 'Others';
          }
          if (item.eventVenue && !venues.includes(item.eventVenue)) {
              setLocalVenues(prev => prev.includes(item.eventVenue) ? prev : [...prev, item.eventVenue]);
          }
          const qty = Number(item.quantity) || 1;
          
          let targetPersonnelCount = qty;
          if (item.workMain === 'Two_Camera_Setup') targetPersonnelCount = 4;
          else if (item.workMain === 'Three_Camera_Setup') targetPersonnelCount = 5;
          else if (item.workMain === 'लाईव्ह व्हिडिओ मिक्सर') targetPersonnelCount = 2;
          else if (noPersonnelWorks.includes(item.workMain)) targetPersonnelCount = 0;

          let personnel = item.personnel || [];
          if (item.workMain === 'Two_Camera_Setup' && personnel.length === 0) {
              personnel = [
                  { role: 'Mixer Operator', name: '', number: '' },
                  { role: 'Camera Operator', name: '', number: '' },
                  { role: 'Camera Operator', name: '', number: '' },
                  { role: 'Assistant', name: '', number: '' }
              ];
          } else if (item.workMain === 'Three_Camera_Setup' && personnel.length === 0) {
              personnel = [
                  { role: 'Mixer Operator', name: '', number: '' },
                  { role: 'Camera Operator', name: '', number: '' },
                  { role: 'Camera Operator', name: '', number: '' },
                  { role: 'Camera Operator', name: '', number: '' },
                  { role: 'Assistant', name: '', number: '' }
              ];
          } else {
              if (personnel.length < targetPersonnelCount) {
                for (let i = personnel.length; i < targetPersonnelCount; i++) {
                  personnel.push({ name: '', number: '' });
                }
              } else if (personnel.length > targetPersonnelCount) {
                personnel = personnel.slice(0, targetPersonnelCount);
              }
              
              // Retroactively add roles for legacy edits
              if (item.workMain === 'Two_Camera_Setup' && personnel.length === 4 && !personnel[0].role) {
                  const roles = ['Mixer Operator', 'Camera Operator', 'Camera Operator', 'Assistant'];
                  personnel = personnel.map((p, i) => ({ ...p, role: roles[i] }));
              } else if (item.workMain === 'Three_Camera_Setup' && personnel.length === 5 && !personnel[0].role) {
                  const roles = ['Mixer Operator', 'Camera Operator', 'Camera Operator', 'Camera Operator', 'Assistant'];
                  personnel = personnel.map((p, i) => ({ ...p, role: roles[i] }));
              }
          }

          let dimensions = item.dimensions || [];
          if (dimensions.length === 0 && (item.length || item.breadth)) {
            dimensions = [{ length: item.length || '', breadth: item.breadth || '', qty: qty }];
          }

          let assemblyDetails = item.assemblyDetails || [];
          if (assemblyDetails.length > 0 && assemblyDetails[0].memberName !== undefined) {
             const grouped = {};
             assemblyDetails.forEach(ad => {
                 const type = ad.assemblyType || '';
                 if(!grouped[type]) grouped[type] = [];
                 if(ad.memberName) grouped[type].push(ad.memberName);
             });
             assemblyDetails = Object.keys(grouped).map(type => ({ assemblyType: type, members: grouped[type].length ? grouped[type] : [''] }));
          } else if (assemblyDetails.length === 0) {
             if (item.assemblyType || item.memberName) {
                 assemblyDetails = [{ assemblyType: item.assemblyType || '', members: [item.memberName || ''] }];
             } else {
                 assemblyDetails = [{ assemblyType: '', members: [''] }];
             }
          }

          return { 
              ...item, 
              dimensions,
              assemblyDetails,
              personnel 
          };
        });
      }

      let formattedDate = '';
      if (editData.eventDate) {
        try {
          const dateObj = new Date(editData.eventDate);
          if (!isNaN(dateObj)) {
            formattedDate = dateObj.toISOString().split('T')[0];
          }
        } catch (e) {}
      }

      setFormData({
        id: editData.id || editData._id || '',
        entryNumber: editData.entryNumber || '',
        eventDate: formattedDate,
        vendor: editData.vendor || '',
        company_id: editData.company_id || '',
        workItems: parsedItems
      });
    }
  }, [editData]);

  const getFilteredSubWorks = (workMain, company) => {
    const companyName = company?.company_name?.toUpperCase() || '';
    const isVidhan = company?.uses_marathi_labels === true || companyName.includes('महाराष्ट्र विधान मंडळ सचिवालय');

    if (isVidhan && vidhanMandalWorks[workMain]) {
        return vidhanMandalWorks[workMain];
    }

    if (workMain === 'Storage') {
        return subWorks['Storage'] || ['32GB', '64GB', '128GB', '256GB', '1TB', '2TB'];
    }

    const isONGC = company?.requires_po_number === true || companyName.includes('ONGC') || 
                   companyName.includes('OIL & NATURAL GAS') || 
                   companyName.includes('OIL AND NATURAL GAS');

    const allowedLocations = isONGC 
      ? ['Mumbai', 'Panvel', 'Uran', 'Nhava', 'Outstation'] 
      : ['Mumbai', 'Outstation'];

    const rawSubWorks = subWorks[workMain] || [];

    const hasLocationPrefix = rawSubWorks.some(sub => 
      ['mumbai', 'panvel', 'uran', 'nhava', 'outstation'].some(loc => sub.toLowerCase().includes(loc))
    );

    if (hasLocationPrefix) {
      return rawSubWorks.filter(sub => 
        allowedLocations.some(loc => sub.toLowerCase().includes(loc.toLowerCase()))
      );
    }

    if (rawSubWorks.length > 0) {
      const combinations = [];
      allowedLocations.forEach(loc => {
        rawSubWorks.forEach(dur => {
          combinations.push(`${loc}_${dur}`);
        });
      });
      return combinations;
    }

    return allowedLocations;
  };

  const handleOpenAddCompany = () => {
    setEditingCompanyId(null);
    setNewCompany({ 
      company_name: '', address: '', gst_number: '', 
      work_rates: getRatesTemplateForCompany() 
    });
    setIsCompanyModalOpen(true);
  };

  const handleEditCompanyClick = (e, company) => {
    e.preventDefault();
    e.stopPropagation(); 
    setEditingCompanyId(company.id);
    
    const existingRates = company.work_rates || {};
    const mergedRates = getRatesTemplateForCompany(company.company_name);
    
    for (const key in mergedRates) {
      if (typeof mergedRates[key] === 'object') {
        mergedRates[key] = { ...mergedRates[key], ...(existingRates[key] || {}) };
      } else {
        mergedRates[key] = existingRates[key] !== undefined ? existingRates[key] : '';
      }
    }

    setNewCompany({
      company_name: company.company_name || '',
      address: company.address || '',
      gst_number: company.gst_number || '',
      work_rates: mergedRates
    });
    setIsCompanyModalOpen(true);
  };

  const handleRateChange = (workType, subType, value) => {
    setNewCompany(prev => {
      const updatedRates = { ...prev.work_rates };
      if (subType) {
        updatedRates[workType] = {
          ...updatedRates[workType],
          [subType]: value === '' ? '' : Number(value)
        };
      } else {
        updatedRates[workType] = value === '' ? '' : Number(value);
      }
      return { ...prev, work_rates: updatedRates };
    });
  };

  const handleSaveCompany = async (e) => {
    if (e) e.preventDefault();
    try {
      const companyNameStr = newCompany.company_name?.toUpperCase() || '';
      const isONGC = newCompany.requires_po_number === true || companyNameStr.includes('ONGC') || 
                     companyNameStr.includes('OIL & NATURAL GAS') || 
                     companyNameStr.includes('OIL AND NATURAL GAS');
      const isModalVidhan = newCompany.uses_marathi_labels === true || companyNameStr.includes('महाराष्ट्र विधान मंडळ सचिवालय');

      const allowedLocations = isONGC 
          ? ['Mumbai', 'Panvel', 'Uran', 'Nhava', 'Outstation'] 
          : ['Mumbai', 'Outstation'];

      const cleanedRates = JSON.parse(JSON.stringify(newCompany.work_rates));

      if (!isModalVidhan) {
          Object.keys(cleanedRates).forEach(category => {
            if (typeof cleanedRates[category] === 'object' && cleanedRates[category] !== null && category !== 'Storage') {
              Object.keys(cleanedRates[category]).forEach(subKey => {
                const isAllowed = allowedLocations.some(loc => subKey.includes(loc));
                if (!isAllowed) {
                  delete cleanedRates[category][subKey];
                }
              });
            }
          });
      }

      const payloadToSave = { ...newCompany, work_rates: cleanedRates };

      if (editingCompanyId) {
        const response = await updateCompany(editingCompanyId, payloadToSave);
        const data = response.data.data;
        
        setCompanies(prev => prev.map(c => c.id === editingCompanyId ? data : c));
        setSnackbar({ open: true, message: 'Company updated successfully!', severity: 'success' });
      } else {
        const response = await createCompany(payloadToSave);
        const data = response.data.data;
        
        setCompanies(prev => [...prev, data]);
        setFormData(prev => ({ ...prev, company_id: data.id }));
        setSnackbar({ open: true, message: 'Company added successfully!', severity: 'success' });
      }
      
      setIsCompanyModalOpen(false);
    } catch (error) {
      console.error('Failed to save company:', error);
      setSnackbar({ open: true, message: 'Failed to save company data.', severity: 'error' });
    }
  };



  const selectedCompany = companies.find(c => c.id === formData.company_id) || null;
  const selectedCompanyNameStr = selectedCompany?.company_name?.toUpperCase() || '';
  const isONGCSelected = selectedCompany?.requires_po_number === true || selectedCompanyNameStr.includes('ONGC') || 
                         selectedCompanyNameStr.includes('OIL & NATURAL GAS') || 
                         selectedCompanyNameStr.includes('OIL AND NATURAL GAS');

  const isVidhanMandalSelected = selectedCompany?.uses_marathi_labels === true || selectedCompany?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      
      const payloadToSubmit = JSON.parse(JSON.stringify(formData));
      // Copy common fields to all items
      if (payloadToSubmit.workItems && payloadToSubmit.workItems.length > 0) {
          const commonFields = {
              eventName: payloadToSubmit.workItems[0].eventName,
              eventVenue: payloadToSubmit.workItems[0].eventVenue,
              eventTime: payloadToSubmit.workItems[0].eventTime,
              contactPerson: payloadToSubmit.workItems[0].contactPerson,
              contactNumber: payloadToSubmit.workItems[0].contactNumber,
              poNpo: payloadToSubmit.workItems[0].poNpo,
              customVenue: payloadToSubmit.workItems[0].customVenue,
              roomNumber: payloadToSubmit.workItems[0].roomNumber,
          };
          payloadToSubmit.workItems = payloadToSubmit.workItems.map(item => ({
              ...item,
              ...commonFields
          }));
      }

      if (!isONGCSelected) {
          payloadToSubmit.workItems = payloadToSubmit.workItems.map(item => ({
              ...item,
              poNpo: 'N/A' 
          }));
      }

      if (isVidhanMandalSelected) {
          payloadToSubmit.workItems = payloadToSubmit.workItems.map(item => ({
              ...item,
              contactPerson: '',
              contactNumber: ''
          }));
      } else {
          payloadToSubmit.workItems = payloadToSubmit.workItems.map(item => ({
              ...item,
              roomNumber: ''
          }));
      }

      const newTeamMembers = [];
      const seenNames = new Set(historicalPersonnel.map(p => p.name.toLowerCase()));

      payloadToSubmit.workItems.forEach(item => {
          (item.personnel || []).forEach(p => {
              const pName = p.name?.trim();
              const pNumber = p.number?.trim();
              
              if (pName && pNumber && !seenNames.has(pName.toLowerCase())) {
                  seenNames.add(pName.toLowerCase());
                  newTeamMembers.push({ name: pName, number: pNumber });
              }
          });
      });

      if (newTeamMembers.length > 0) {
          await upsertTeam(newTeamMembers);
          fetchTeamData(); 
      }

      if (editData) {
        await API.put(`/workOrders/${formData.id}`, payloadToSubmit);
        setSnackbar({ open: true, message: 'Work Order updated successfully!', severity: 'success' });
        setTimeout(() => navigate('/reports'), 1000);
      } else {
        await createWorkOrder(payloadToSubmit);
        setSnackbar({ open: true, message: 'Work Order created successfully!', severity: 'success' });
        setFormData({
          entryNumber: '', eventDate: '', vendor: 'ICOMP SYSTEMS', company_id: '',
          workItems: [{ eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', roomNumber: '', workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '', customRate: '', dimensions: [{ length: '', breadth: '', qty: 1 }], assemblyDetails: [{ assemblyType: '', members: [''] }], personnel: [{ name: '', number: '' }] }]
        });
        fetchLatestEntry();
      }
    } catch (error) {
      console.error('Failed to save work order:', error);
      const serverError = error.response?.data?.error;
      const msg = Array.isArray(serverError) ? serverError.join(', ') : (serverError || 'Failed to save work order. Please ensure all required fields are filled correctly.');
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };


  const isEntryNumberDuplicate = existingEntryNumbers.includes(String(formData.entryNumber)) && 
                                 (!editData || String(editData.entryNumber) !== String(formData.entryNumber));

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">{editData ? 'Edit Event Data' : 'Event Data Entry'}</Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth required>
              <InputLabel>Vendor</InputLabel>
              <Select name="vendor" value={formData.vendor} label="Vendor" onChange={handleMainChange}>
                {vendors.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Select Company</InputLabel>
              <Select 
                name="company_id" 
                value={formData.company_id} 
                label="Select Company" 
                onChange={handleMainChange}
                renderValue={(selectedId) => {
                  if (!selectedId) return '';
                  const selectedComp = companies.find(c => c.id === selectedId);
                  return selectedComp ? selectedComp.company_name : '';
                }}
              >
                <MenuItem value="" onClick={handleOpenAddCompany}>
                  <em>+ Add New Company</em>
                </MenuItem>
                
                {companies.map(c => (
                  <MenuItem key={c.id} value={c.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {c.company_name}
                    <IconButton 
                      type="button"
                      size="small" 
                      onClick={(e) => handleEditCompanyClick(e, c)}
                      sx={{ ml: 2, padding: '2px' }}
                    >
                      <EditIcon fontSize="small" color="action" />
                    </IconButton>
                  </MenuItem>
                ))}

              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField 
                name="entryNumber" 
                label="Entry Number" 
                required 
                fullWidth 
                error={isEntryNumberDuplicate}
                value={formData.entryNumber} 
                onChange={handleMainChange} 
                helperText={isEntryNumberDuplicate ? 'This entry number is already used!' : (latestEntry ? `Last entry was: ${latestEntry}` : 'Enter the first entry number.')} 
              />
          </Grid>
          

            {/* --- Common Fields --- */}
            <Grid item xs={12} sm={6}><TextField name="eventName" label={isVidhanMandalSelected ? 'कामाचे नांव' : 'Event Name'} required fullWidth value={formData.workItems[0].eventName} onChange={(e) => handleWorkItemChange(0, e)} /></Grid>
                    <Grid item xs={12} sm={6}><FormControl fullWidth required><InputLabel>{isVidhanMandalSelected ? 'कामाचे स्थळ' : 'Event Venue'}</InputLabel><Select name="eventVenue" 
value={formData.workItems[0].eventVenue} label={isVidhanMandalSelected ? 'ठिकाण निवडा' : 'Event Venue'} 
onChange={(e) => {
    if (e.target.value === '__add_venue__') {
        handleWorkItemChange(0, { target: { name: 'eventVenue', value: '' } });
    } else {
        handleWorkItemChange(0, e);
    }
}}
renderValue={(selected) => selected}
>
    <MenuItem value="__add_venue__" onClick={() => {
        setEditingVenueOldName(null);
        setNewVenueText('');
        setIsVenueModalOpen(true);
    }}>
        <em>+ Add Venue</em>
    </MenuItem>
    {localVenues.map(v => (
        <MenuItem key={v} value={v} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {v}
            <IconButton 
                type="button"
                size="small" 
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setEditingVenueOldName(v);
                    setNewVenueText(v);
                    setIsVenueModalOpen(true);
                }}
                sx={{ ml: 2, padding: '2px' }}
            >
                <EditIcon fontSize="small" color="action" />
            </IconButton>
        </MenuItem>
    ))}
</Select></FormControl></Grid>
                    <Grid item xs={12} sm={6}><TextField name="eventDate" label={isVidhanMandalSelected ? 'कामाचा दिनांक' : 'Event Date'} type="date" required fullWidth InputLabelProps={{ shrink: true }} value={formData.eventDate} onChange={handleMainChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="eventTime" label="Event Time" type="time" required fullWidth InputLabelProps={{ shrink: true }} value={formData.workItems[0].eventTime} onChange={(e) => handleWorkItemChange(0, e)} /></Grid>
                    
                    
                    {isVidhanMandalSelected ? (
                      <Grid item xs={12} sm={12}>
                        <TextField 
                          name="roomNumber" 
                          label="कक्ष क्रमांक" 
                          required 
                          fullWidth 
                          value={formData.workItems[0].roomNumber || ''} 
                          onChange={(e) => handleWorkItemChange(0, e)} 
                        />
                      </Grid>
                    ) : (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            freeSolo
                            options={Array.from(new Set([
                                ...historicalContacts.map(c => c.name),
                                ...formData.workItems.map(wi => wi.contactPerson).filter(Boolean)
                            ]))}
                            inputValue={formData.workItems[0].contactPerson || ''}
                            onInputChange={(e, newValue) => handleWorkItemChange(0, { target: { name: 'contactPerson', value: newValue || '' } })}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Contact Person"
                                required
                                fullWidth
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField 
                            name="contactNumber" 
                            label="Contact Number" 
                            required 
                            fullWidth 
                            type="text"
                            inputProps={{ inputMode: 'numeric' }}
                            value={formData.workItems[0].contactNumber} 
                            onChange={(e) => handleWorkItemChange(0, e)} 
                          />
                        </Grid>
                      </>
                    )}
                    
                    {isONGCSelected && (
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <InputLabel>PO/NPO</InputLabel>
                            <Select name="poNpo" value={formData.workItems[0].poNpo} label="PO/NPO" onChange={(e) => handleWorkItemChange(0, e)}>
                              <MenuItem value="PO">PO</MenuItem>
                              <MenuItem value="NPO">NPO</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                    )}
                    
        </Grid>

        {formData.workItems.map((item, index) => {
          return (
            <WorkOrderItem 
                key={index}
                item={item} 
                index={index} 
                expandedItem={expandedItem} 
                setExpandedItem={setExpandedItem} 
                formData={formData}
                handleWorkItemChange={handleWorkItemChange} 
                handleMainChange={handleMainChange} 
                removeWorkItem={removeWorkItem}
                isVidhanMandalSelected={isVidhanMandalSelected} 
                selectedCompany={selectedCompany} 
                getFilteredSubWorks={getFilteredSubWorks}
                handleDimensionChange={handleDimensionChange} 
                addDimensionRow={addDimensionRow} 
                removeDimensionRow={removeDimensionRow}
                handleAssemblyTypeChange={handleAssemblyTypeChange} 
                handleMemberNameChange={handleMemberNameChange}
                addMemberRow={addMemberRow} 
                removeMemberRow={removeMemberRow} 
                addAssemblyGroup={addAssemblyGroup} 
                removeAssemblyGroup={removeAssemblyGroup}
                handlePersonnelChange={handlePersonnelChange} 
                vendors={vendors} 
                localVenues={localVenues}
                setIsVenueModalOpen={setIsVenueModalOpen} 
                setNewVenueText={setNewVenueText} 
                setEditingVenueOldName={setEditingVenueOldName}
                historicalContacts={historicalContacts} 
                historicalPersonnel={historicalPersonnel}
            />
          );
        })}

        <Button type="button" startIcon={<AddCircleOutlineIcon />} onClick={() => { addWorkItem(); setExpandedItem(formData.workItems.length); }} sx={{ mt: 2 }}>
          Add Another Item
        </Button>

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={submitting || isEntryNumberDuplicate}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : (editData ? 'Update The Data' : 'Save The Data')}
        </Button>
      </Box>

      <CompanyModal
        isCompanyModalOpen={isCompanyModalOpen}
        setIsCompanyModalOpen={setIsCompanyModalOpen}
        editingCompanyId={editingCompanyId}
        newCompany={newCompany}
        setNewCompany={setNewCompany}
        handleSaveCompany={handleSaveCompany}
        getFilteredSubWorks={getFilteredSubWorks}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    
        <VenueModal
          isVenueModalOpen={isVenueModalOpen}
          setIsVenueModalOpen={setIsVenueModalOpen}
          editingVenueOldName={editingVenueOldName}
          newVenueText={newVenueText}
          setNewVenueText={setNewVenueText}
          setLocalVenues={setLocalVenues}
          venues={venues}
          formData={formData}
          handleWorkItemChange={handleWorkItemChange}
          setEditingVenueOldName={setEditingVenueOldName}
        />

      </Container>
  );
};

export default WorkOrder;