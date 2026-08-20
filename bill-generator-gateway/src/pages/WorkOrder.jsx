import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Button, Grid, Paper, Box, IconButton,
  Select, MenuItem, FormControl, InputLabel, Divider, CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import API, { getWorkOrders, createWorkOrder } from '../services/api';
import { supabase } from '../supabase';
import { subWorks, venues, vendors } from '../constants/data';
import { calculateItemAmount } from '../utils/helpers';

// --- NEW: Vidhan Mandal Specific Works from Excel ---
const vidhanMandalWorks = {
  "पासपोर्ट फोटो एक्सपोझिंग चार्जेस सह": [
    "फोटो काढून ४ नग स्टॅम्प साईज फोटो प्रिंटीगसह",
    "फोटो काढून ४ नग पासपोर्ट साईज फोटो प्रिंटीगसह",
    "फोटो काढून ४ नग व्‍हीसा साईज फोटो प्रिंटींगसह"
  ],
  "फोटोग्राफी": [
    "४ तासापर्यंत डाटा डीव्हीडी, सॉफट कॉपी ई-मेलवर अपलोड करणेसह",
    "८ तासापर्यंत डाटा डीव्हीडी, सॉफट कॉपी ई-मेलवर अपलोड करणेसह",
    "१२ तासापर्यंत डाटा डीव्हीडी, सॉफट कॉपी ई-मेलवर अपलोड करणेसह",
    "मुंबई बाहेर ४ तासापर्यंत डाटा डीव्हीडी, सॉफट कॉपी ई-मेलवर अपलोड करणेसह",
    "मुंबई बाहेर ८ तासापर्यंत डाटा डीव्हीडी, सॉफट कॉपी ई-मेलवर अपलोड करणेसह",
    "मुंबई बाहेर १२ तासापर्यंत डाटा डीव्हीडी, सॉफट कॉपी ई-मेलवर अपलोड करणेसह"
  ],
  "फोटो प्रिंटिंग": [
    "५ X १० मेट कॉपी",
    "५ X १० मेट कॉपी अतिरिक्त फोटो",
    "६ X 8 मेट कॉपी",
    "८ X १० मेट कॉपी",
    "८ X १२ मेट कॉपी",
    "१० X १२ मेट कॉपी",
    "१२ X १५ मेट कॉपी",
    "१२ X १८ मेट कॉपी",
    "१६ X २० मेट कॉपी",
    "२० X २४ मेट कॉपी",
    "२४ X ३० मेट कॉपी"
  ],
  "फोटो अल्बम ( रिकामे )": [
    "५ X ७ साईज अल्बम चार्ज १ X १ ( ४० फोटो )",
    "५ X ७ साईज अल्बम चार्ज १ X १ ( ६० फोटो )",
    "५ X ७ साईज अल्बम चार्ज १ X १ ( ८० फोटो )",
    "५ X ७ साईज अल्बम चार्ज १ X १ ( १०० फोटो )",
    "५ X ७ साईज अल्बम चार्ज १ X १ (२०० फोटो )",
    "१२ X ३६ कव्हर पेज सह कारीजम अल्बम",
    "२५ पाने २०० फोटो  (डिझाईन प्रिंटिंग)",
    "१२ X ३६ कारीजम अल्बम १ पाने (डिझाईन प्रिंटिंग)",
    "१२ X ३६ कव्हर पेज सह कारीजम अल्बम २५ पाने फक्त प्रिंटिंग)",
    "१२ X ३६ कारीजम अल्बम १ पाने फक्त प्रिंटिंग)"
  ],
  "व्हिडिओ शुटींग एक्सपोझिंग चार्जेस सह": [
    "४ तासपर्यंत (एडिटिंग व डेटा डीव्हीडी सह)",
    "८ तासपर्यंत (एडिटिंग व डेटा डीव्हीडी सह)",
    "१२ तासपर्यंत (एडिटिंग व डेटा डीव्हीडी सह)",
    "मुंबई बाहेर ४ तासपर्यंत (एडिटिंग व डेटा डीव्हीडी सह)",
    "मुंबई बाहेर ८ तासपर्यंत (एडिटिंग व डेटा डीव्हीडी सह)",
    "मुंबई बाहेर १२ तासपर्यंत (एडिटिंग व डेटा डीव्हीडी सह)"
  ],
  "अतिरिक्त डीव्हीडी कॉपी": [
    "सिंगल डीव्हीडी सेट",
    "दोन डीव्हीडी सेट",
    "तीन डीव्हीडी सेट",
    "चार डीव्हीडी सेट",
    "पाच डीव्हीडी सेट",
    "आठ डीव्हीडी सेट",
    "दहा डीव्हीडी सेट"
  ],
  "पेनड्राईव ३.०": [
    "१६ जी बी",
    "३२ जी बी",
    "६४ जी बी",
    "१२८ जी बी"
  ],
  "हार्डडिस्क": [
    "१ टि. बी.",
    "२ टि. बी."
  ],
  "लाईव्ह व्हिडिओ मिक्सर": [
    "लाईव्ह व्हिडिओ मिक्सर",
    "मुंबई बाहेर लाईव्ह व्हिडिओ मिक्सर"
  ],
  "स्टुडिओ सेटअप चार्जेस": [
    "स्टुडिओ सेटअप चार्जेस  (दोन लाईट)",
    "मुंबई बाहेर स्टुडिओ सेटअप चार्जेस (दोन लाईट)"
  ],
  "सन्माननीय सदस्यांचे एकत्रित छायाचित्र पाकीटासाहित": [
    "सन्माननीय विधानपरिषद सदस्यांचे एकत्रित छायाचित्र (१२ क्ष १५ फोटो साईज व १५ क्ष १८ माउटीग साईज",
    "सन्माननीय विधानसभा सदस्यांचे एकत्रित छायाचित्र (१८ क्ष २० फोटो साईज व २१ क्ष २४ माउटीग साईज",
    "सन्माननीय सदस्यांचे एकत्रित छायाचित्र माउटीग सहित (२१  क्ष २४  आकाराचे  माउटीग सहित लाकडी फ्रेम तयार करणे)",
    "सनबोर्ड फोटो / लमीनेशन प्रिंटिंगसह ( प्रती चौरस फुट)"
  ],
  "दिवंगत विधानपरिषद व विधानसभा सदस्य यांच्याकरीत स्मृतिपत्र": [
    "स्मृतिपत्र (गोल्डन एम्बॉस सहित) १२\" क्ष १८\"",
    "आकर्षक फ्रेम माऊंटीग सहित १७\" क्ष २३\"",
    "बंद बॉक्स ( १८\" क्ष २४\" या आकाराचा ) पुरवणे"
  ],
  "फोटो लेमिनेशन": [
    "फोटो सहित लेमिनेशन (लाकडी) प्रती इंच"
  ],
  "फोटो फ्रेम": [
    "१ इंच लाकडी फ्रेम साईज १०\" क्ष १४\"",
    "१ इंच लाकडी फ्रेम साईज १२\" क्ष १४\"",
    "१ इंच लाकडी फ्रेम साईज १४\" क्ष १६\"",
    "२ इंच लाकडी फ्रेम साईज १४\" क्ष २०\"",
    "२ इंच लाकडी फ्रेम साईज १८\" क्ष २२\"",
    "२.५ इंच लाकडी फ्रेम साईज २२\" क्ष २६\"",
    "२.५ इंच लाकडी फ्रेम साईज २७\" क्ष ३३\""
  ],
  "बॅनर": [
    "डिजिटल फ्लेक्स बॅनर डिझाईन करणे. (प्रती चो. फुट)",
    "डिजिटल फ्लेक्स बॅनर डिझाईन प्रिंटिंग सहित (प्रती चो. फुट)",
    "डिजिटल फ्लेक्स बॅनर डिझाईन प्रिंटिंग/लकडी फ्रेम तयार करणे",
    "स्टँडीज बॅनर सहित उपलब्घ करून देणे.",
    "स्टँडीज लिनेल सहित उपलब्घ करून देणे."
  ]
};

// Dynamic Template Generator
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

  // Standard Template
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
  const [formData, setFormData] = useState({
    entryNumber: '',
    eventDate: '',
    vendor: '',
    company_id: '',
    workItems: [
      { 
        eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', roomNumber: '',
        workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '', customRate: '',
        personnel: [{ name: '', number: '' }]
      }
    ]
  });
  const [latestEntry, setLatestEntry] = useState(null);
  const [companies, setCompanies] = useState([]);
  
  const [historicalPersonnel, setHistoricalPersonnel] = useState([]);
  const [historicalContacts, setHistoricalContacts] = useState([]);
  
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [newCompany, setNewCompany] = useState({ 
    company_name: '', 
    address: '', 
    gst_number: '',
    work_rates: getRatesTemplateForCompany()
  });

  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Auto-switch modal template if Vidhan Mandal is typed
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
      const { data, error } = await supabase.from('companies').select('*');
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchTeamData = async () => {
    try {
      const { data, error } = await supabase.from('team').select('*');
      if (error) throw error;
      setHistoricalPersonnel(data || []);
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
          personnel: [{ name: '', number: '' }]
        }];
      } else {
        parsedItems = parsedItems.map(item => {
          const qty = Number(item.quantity) || 1;
          
          let targetPersonnelCount = qty;
          if (item.workMain === 'Two_Camera_Setup') targetPersonnelCount = 4;
          else if (item.workMain === 'Three_Camera_Setup') targetPersonnelCount = 5;
          else if (item.workMain === 'Storage' || item.workMain === '32_GB_Pendrive') targetPersonnelCount = 0;

          let personnel = item.personnel || [];
          if (personnel.length < targetPersonnelCount) {
            for (let i = personnel.length; i < targetPersonnelCount; i++) {
              personnel.push({ name: '', number: '' });
            }
          } else if (personnel.length > targetPersonnelCount) {
            personnel = personnel.slice(0, targetPersonnelCount);
          }
          return { ...item, personnel };
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
    const isVidhan = companyName.includes('महाराष्ट्र विधान मंडळ सचिवालय');

    if (isVidhan && vidhanMandalWorks[workMain]) {
        return vidhanMandalWorks[workMain];
    }

    if (workMain === 'Storage') {
        return subWorks['Storage'] || ['32GB', '64GB', '128GB', '256GB', '1TB', '2TB'];
    }

    const isONGC = companyName.includes('ONGC') || 
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
      const isONGC = companyNameStr.includes('ONGC') || 
                     companyNameStr.includes('OIL & NATURAL GAS') || 
                     companyNameStr.includes('OIL AND NATURAL GAS');
      const isModalVidhan = companyNameStr.includes('महाराष्ट्र विधान मंडळ सचिवालय');

      const allowedLocations = isONGC 
          ? ['Mumbai', 'Panvel', 'Uran', 'Nhava', 'Outstation'] 
          : ['Mumbai', 'Outstation'];

      const cleanedRates = JSON.parse(JSON.stringify(newCompany.work_rates));

      // Only filter out locations if it's the standard template
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
        const { data, error } = await supabase
          .from('companies')
          .update(payloadToSave)
          .eq('id', editingCompanyId)
          .select();
        
        if (error) throw error;
        
        setCompanies(prev => prev.map(c => c.id === editingCompanyId ? data[0] : c));
        setSnackbar({ open: true, message: 'Company updated successfully!', severity: 'success' });
      } else {
        const { data, error } = await supabase.from('companies').insert([payloadToSave]).select();
        if (error) throw error;
        
        setCompanies(prev => [...prev, data[0]]);
        setFormData(prev => ({ ...prev, company_id: data[0].id }));
        setSnackbar({ open: true, message: 'Company added successfully!', severity: 'success' });
      }
      
      setIsCompanyModalOpen(false);
    } catch (error) {
      console.error('Failed to save company:', error);
      setSnackbar({ open: true, message: 'Failed to save company data.', severity: 'error' });
    }
  };

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkItemChange = (index, e) => {
    const { name, value } = e.target;
    const newWorkItems = [...formData.workItems];
    
    let finalValue = value;
    if (name === 'contactNumber') {
        finalValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    }
    
    newWorkItems[index][name] = finalValue;

    if (index === 0 && ['eventName', 'poNpo', 'eventTime', 'eventVenue', 'contactPerson', 'contactNumber', 'customVenue', 'roomNumber'].includes(name)) {
        for (let i = 1; i < newWorkItems.length; i++) {
            newWorkItems[i][name] = finalValue;
        }
    }

    if (name === 'contactPerson') {
      let matchedNumber = '';
      const cleanedValue = finalValue.trim().toLowerCase();

      if (cleanedValue !== '') {
          const foundDb = historicalContacts.find(c => c.name.toLowerCase() === cleanedValue);
          if (foundDb) {
              matchedNumber = foundDb.number.replace(/[^0-9]/g, '').slice(0, 10);
          } else {
              for (const workItem of formData.workItems) {
                  if (workItem.contactPerson?.toLowerCase().trim() === cleanedValue && workItem.contactNumber) {
                      matchedNumber = workItem.contactNumber.replace(/[^0-9]/g, '').slice(0, 10);
                      break;
                  }
              }
          }
      }
      
      newWorkItems[index]['contactNumber'] = matchedNumber;
      if (index === 0) {
          for (let i = 1; i < newWorkItems.length; i++) {
              newWorkItems[i]['contactNumber'] = matchedNumber;
          }
      }
    }

    if (name === 'quantity') {
      const qty = Number(finalValue) || 1;
      let personnel = newWorkItems[index].personnel || [];
      
      if (personnel.length < qty) {
        for (let i = personnel.length; i < qty; i++) {
          personnel.push({ name: '', number: '' });
        }
      } else if (personnel.length > qty) {
        personnel = personnel.slice(0, qty);
      }
      newWorkItems[index].personnel = personnel;
    }

    if (name === 'workMain') {
        newWorkItems[index]['workSub'] = '';
        newWorkItems[index]['customRate'] = '';
        newWorkItems[index]['quantity'] = 1; 

        if (finalValue === 'Two_Camera_Setup') {
            newWorkItems[index]['personnel'] = Array(4).fill(null).map(() => ({ name: '', number: '' }));
        } else if (finalValue === 'Three_Camera_Setup') {
            newWorkItems[index]['personnel'] = Array(5).fill(null).map(() => ({ name: '', number: '' }));
        } else if (finalValue === 'Storage' || finalValue === '32_GB_Pendrive' || Object.keys(vidhanMandalWorks).includes(finalValue)) {
            // Mostly disable personnel for standard item types or generic requests 
            newWorkItems[index]['personnel'] = []; 
        } else {
            newWorkItems[index]['personnel'] = [{ name: '', number: '' }];
        }
    }
    setFormData(prev => ({ ...prev, workItems: newWorkItems }));
  };

  const handlePersonnelChange = (itemIndex, personIndex, field, value) => {
    setFormData(prev => {
      const newWorkItems = [...prev.workItems];
      const updatedPersonnel = [...(newWorkItems[itemIndex].personnel || [])];
      
      let finalValue = value;
      if (field === 'number') {
          finalValue = value.replace(/[^0-9]/g, '').slice(0, 10);
      }
      
      if (!updatedPersonnel[personIndex]) {
        updatedPersonnel[personIndex] = { name: '', number: '' };
      }
      
      updatedPersonnel[personIndex] = { ...updatedPersonnel[personIndex], [field]: finalValue };

      if (field === 'name') {
          let matchedNumber = '';
          const cleanedValue = finalValue.trim().toLowerCase();

          if (cleanedValue !== '') {
              const foundDb = historicalPersonnel.find(p => p.name.toLowerCase() === cleanedValue);
              if (foundDb) {
                  matchedNumber = foundDb.number.replace(/[^0-9]/g, '').slice(0, 10);
              } else {
                  for (const workItem of prev.workItems) {
                      for (const p of (workItem.personnel || [])) {
                          if (p.name?.toLowerCase().trim() === cleanedValue && p.number) {
                              matchedNumber = p.number.replace(/[^0-9]/g, '').slice(0, 10);
                              break;
                          }
                      }
                      if (matchedNumber) break;
                  }
              }
          }
          
          updatedPersonnel[personIndex].number = matchedNumber;
      }

      newWorkItems[itemIndex].personnel = updatedPersonnel;
      return { ...prev, workItems: newWorkItems };
    });
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
              roomNumber: firstItem.roomNumber || '',
              customVenue: firstItem.customVenue,
              workMain: '',
              workSub: '',
              quantity: 1,
              customWorkMain: '',
              customRate: '',
              personnel: [{ name: '', number: '' }] 
          }
      ]
    }));
  };

  const removeWorkItem = (index) => {
    const newWorkItems = formData.workItems.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, workItems: newWorkItems }));
  };

  const selectedCompany = companies.find(c => c.id === formData.company_id) || null;
  const selectedCompanyNameStr = selectedCompany?.company_name?.toUpperCase() || '';
  const isONGCSelected = selectedCompanyNameStr.includes('ONGC') || 
                         selectedCompanyNameStr.includes('OIL & NATURAL GAS') || 
                         selectedCompanyNameStr.includes('OIL AND NATURAL GAS');

  const isVidhanMandalSelected = selectedCompany?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      
      const payloadToSubmit = JSON.parse(JSON.stringify(formData));
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
          await supabase.from('team').upsert(newTeamMembers, { onConflict: 'name' });
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
          entryNumber: '', eventDate: '', vendor: '', company_id: '',
          workItems: [{ eventName: '', poNpo: '', eventTime: '', eventVenue: '', contactPerson: '', contactNumber: '', roomNumber: '', workMain: '', workSub: '', quantity: 1, customVenue: '', customWorkMain: '', customRate: '', personnel: [{ name: '', number: '' }] }]
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

  return (
    <Container component={Paper} sx={{ p: 4, mt: 4, bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
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
            <TextField name="entryNumber" label="Entry Number" required fullWidth value={formData.entryNumber} onChange={handleMainChange} helperText={latestEntry ? `Last entry was: ${latestEntry}` : 'Enter the first entry number.'} />
          </Grid>
          
        </Grid>

        {formData.workItems.map((item, index) => {
          const hidePersonnel = ['Storage', '32_GB_Pendrive', 'पेनड्राईव ३.०', 'हार्डडिस्क', 'अतिरिक्त डीव्हीडी कॉपी', 'फोटो फ्रेम', 'फोटो लेमिनेशन', 'बॅनर', 'अतिरिक्त डीव्हीडी कॉपी', 'सन्माननीय सदस्यांचे एकत्रित छायाचित्र पाकीटासाहित', 'दिवंगत विधानपरिषद व विधानसभा सदस्य यांच्याकरीत स्मृतिपत्र'].includes(item.workMain);
          
          return (
          <Paper key={index} sx={{ p: 2, mt: 3, bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Work Item #{index + 1}</Typography>
              {formData.workItems.length > 1 && (
                <IconButton type="button" onClick={() => removeWorkItem(index)} color="error">
                  <RemoveCircleOutlineIcon />
                </IconButton>
              )}
            </Box>

            {index === 0 && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}><TextField name="eventName" label={isVidhanMandalSelected ? 'कामाचे नांव' : 'Event Name'} required fullWidth value={item.eventName} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>
                    <Grid item xs={12} sm={6}><FormControl fullWidth required><InputLabel>{isVidhanMandalSelected ? 'कामाचे स्थळ' : 'Event Venue'}</InputLabel><Select name="eventVenue" value={item.eventVenue} label={isVidhanMandalSelected ? 'कामाचे स्थळ' : 'Event Venue'} onChange={(e) => handleWorkItemChange(index, e)}>{venues.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={6}><TextField name="eventDate" label={isVidhanMandalSelected ? 'कामाचा दिनांक' : 'Event Date'} type="date" required fullWidth InputLabelProps={{ shrink: true }} value={formData.eventDate} onChange={handleMainChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="eventTime" label="Event Time" type="time" required fullWidth InputLabelProps={{ shrink: true }} value={item.eventTime} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>
                    {item.eventVenue === 'Others' && <Grid item xs={12}><TextField name="customVenue" label="Custom Venue" required fullWidth value={item.customVenue} onChange={(e) => handleWorkItemChange(index, e)} /></Grid>}
                    
                    {isVidhanMandalSelected ? (
                      <Grid item xs={12} sm={12}>
                        <TextField 
                          name="roomNumber" 
                          label="कक्ष क्रमांक" 
                          required 
                          fullWidth 
                          value={item.roomNumber || ''} 
                          onChange={(e) => handleWorkItemChange(index, e)} 
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
                            inputValue={item.contactPerson || ''}
                            onInputChange={(e, newValue) => handleWorkItemChange(index, { target: { name: 'contactPerson', value: newValue || '' } })}
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
                            value={item.contactNumber} 
                            onChange={(e) => handleWorkItemChange(index, e)} 
                            inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
                          />
                        </Grid>
                      </>
                    )}
                    
                    {isONGCSelected && (
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth required>
                            <InputLabel>PO/NPO</InputLabel>
                            <Select name="poNpo" value={item.poNpo} label="PO/NPO" onChange={(e) => handleWorkItemChange(index, e)}>
                              <MenuItem value="PO">PO</MenuItem>
                              <MenuItem value="NPO">NPO</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                    )}
                    <Grid item xs={12}><Divider>Work Details</Divider></Grid>
                </Grid>
            )}

            <Grid container spacing={2} sx={{ mt: index === 0 ? 1 : 0 }}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                        <InputLabel>{isVidhanMandalSelected ? 'कामाचे स्वरूप' : 'Work Name'}</InputLabel>
                        <Select name="workMain" value={item.workMain} label={isVidhanMandalSelected ? 'कामाचे स्वरूप' : 'Work Name'} onChange={(e) => handleWorkItemChange(index, e)}>
                            {isVidhanMandalSelected ? (
                                Object.keys(vidhanMandalWorks).map(work => (
                                    <MenuItem key={work} value={work}>{work}</MenuItem>
                                ))
                            ) : (
                                <>
                                  <MenuItem value="Still_Photography">Still Photography</MenuItem>
                                  <MenuItem value="Videography">Videography</MenuItem>
                                  <MenuItem value="Two_Camera_Setup">Two Video Cameras Live Setup</MenuItem>
                                  <MenuItem value="Three_Camera_Setup">Three Video Cameras Live Setup</MenuItem>
                                  <MenuItem value="Live_Telecast">Live Telecast Setup</MenuItem>
                                  <MenuItem value="Storage">Storage</MenuItem>
                                </>
                            )}
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
                            <InputLabel>{isVidhanMandalSelected ? 'कामाचे प्रकार' : 'Work Subcategory'}</InputLabel>
                            <Select name="workSub" value={item.workSub} label={isVidhanMandalSelected ? 'कामाचे प्रकार' : 'Work Subcategory'} onChange={(e) => handleWorkItemChange(index, e)}>
                                {getFilteredSubWorks(item.workMain, selectedCompany).map(sub => (
                                    <MenuItem key={sub} value={sub}>{sub.replaceAll('_', ' ')}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}
                <Grid item xs={12} sm={6}>
                    <TextField 
                        name="quantity" 
                        label={isVidhanMandalSelected ? 'नग' : 'Quantity'} 
                        type="number" 
                        required 
                        fullWidth 
                        value={item.quantity} 
                        onChange={(e) => handleWorkItemChange(index, e)} 
                        InputProps={{ inputProps: { min: 1 } }} 
                        disabled={item.workMain === 'Two_Camera_Setup' || item.workMain === 'Three_Camera_Setup'}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    {item.workMain === 'Others' ? (
                        <TextField 
                            name="customRate" 
                            label="Custom Rate / Amount (Rs.)" 
                            type="number" 
                            fullWidth 
                            value={item.customRate || ''} 
                            onChange={(e) => handleWorkItemChange(index, e)} 
                        />
                    ) : (
                        <TextField 
                            label={isVidhanMandalSelected ? 'रकम' : 'Amount'} 
                            type="text" 
                            fullWidth 
                            value={calculateItemAmount(item, selectedCompany).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                            InputProps={{ readOnly: true, sx: { backgroundColor: '#f5f5f5' } }} 
                        />
                    )}
                </Grid>

                {!hidePersonnel && (
                  <React.Fragment>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>Assigned Personnel</Typography>
                    </Grid>
                    {(item.personnel || [{ name: '', number: '' }]).map((person, pIdx) => (
                      <React.Fragment key={pIdx}>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            freeSolo
                            options={Array.from(new Set([
                                ...historicalPersonnel.map(p => p.name),
                                ...formData.workItems.flatMap(wi => (wi.personnel || []).map(p => p.name).filter(Boolean))
                            ]))}
                            inputValue={person.name || ''}
                            onInputChange={(e, newValue) => handlePersonnelChange(index, pIdx, 'name', newValue || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={`Photographer/Videographer ${pIdx + 1} Name`}
                                fullWidth
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={`Contact Number`}
                            fullWidth
                            size="small"
                            value={person.number || ''}
                            onChange={(e) => handlePersonnelChange(index, pIdx, 'number', e.target.value)}
                            inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
                          />
                        </Grid>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                )}
            </Grid>
          </Paper>
        )})}

        <Button type="button" startIcon={<AddCircleOutlineIcon />} onClick={addWorkItem} sx={{ mt: 2 }}>
          Add Another Item
        </Button>

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={submitting}>
          {submitting ? <CircularProgress size={24} color="inherit" /> : (editData ? 'Update The Data' : 'Save The Data')}
        </Button>
      </Box>

      <Dialog 
        open={isCompanyModalOpen} 
        onClose={() => setIsCompanyModalOpen(false)} 
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.1)' } }
        }}
        PaperProps={{ 
          sx: { 
            bgcolor: 'rgba(255, 255, 255, 0.4)', 
            backdropFilter: 'blur(16px)', 
            border: '1px solid rgba(255, 255, 255, 0.6)', 
            minWidth: '400px',
            maxWidth: '600px',
            maxHeight: '90vh',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' 
          } 
        }}
      >
        <DialogTitle>{editingCompanyId ? 'Edit Company Rates' : 'Add New Company'}</DialogTitle>
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
          
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Custom Work Rates</Typography>
          
          {Object.keys(newCompany.work_rates).map(key => {
            const rateData = newCompany.work_rates[key];
            
            if (typeof rateData === 'object' && rateData !== null) {
              const subKeys = getFilteredSubWorks(key, newCompany);

              return (
                <Box key={key} sx={{ mb: 3, p: 2, borderLeft: '4px solid #1976d2', bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: '0 8px 8px 0' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', textTransform: 'uppercase' }}>
                    {key.replaceAll('_', ' ')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {subKeys.map(subKey => (
                      <Grid item xs={12} sm={6} key={subKey}>
                        <TextField
                          label={`${subKey.replaceAll('_', ' ')} Rate`}
                          type="number"
                          fullWidth
                          variant="outlined"
                          size="small"
                          value={rateData[subKey] || ''}
                          onChange={(e) => handleRateChange(key, subKey, e.target.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            } else {
              return (
                <TextField
                  key={key}
                  margin="dense"
                  label={`${key.replaceAll('_', ' ')} Rate`}
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={rateData || ''}
                  onChange={(e) => handleRateChange(key, null, e.target.value)}
                  sx={{ mb: 2 }}
                />
              );
            }
          })}

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button type="button" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleSaveCompany} variant="contained" disabled={!newCompany.company_name}>
            {editingCompanyId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WorkOrder;