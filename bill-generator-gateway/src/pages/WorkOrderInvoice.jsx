import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Container, CircularProgress, Alert, TextField, Snackbar
} from '@mui/material';

import './WorkOrderInvoice.css';
import API from '../services/api';
import { supabase } from '../supabase';
import { calculateItemAmount, numberToWords } from '../utils/helpers';
import { bannerSubs } from '../constants/data';

const EditableField = ({
  value,
  onChange,
  onBlur,
  isEditing,
  setEditing,
  isReadOnly,
  multiline = false,
  minRows = 1,
  sx = {},
  textSx = {},
  fallback = 'N/A'
}) => {
  if (isEditing) {
    return (
      <TextField
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => { setEditing(false); if (onBlur) onBlur(); }}
        autoFocus
        size="small"
        multiline={multiline}
        minRows={minRows}
        variant="standard"
        InputProps={{
            disableUnderline: true,
            style: { fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }
        }}
        sx={{ ...sx, p: 0, '& .MuiInputBase-root': { p: 0 }, '& .MuiInputBase-input': { p: 0 } }}
      />
    );
  }

  return (
    <Box
        component="span"
        onClick={() => !isReadOnly && setEditing(true)}
        sx={{
            cursor: isReadOnly ? 'default' : 'pointer',
            borderBottom: isReadOnly ? 'none' : '1px dashed transparent',
            '&:hover': {
                borderBottom: isReadOnly ? 'none' : '1px dashed #aaa'
            },
            ...sx
        }}
    >
      <Typography component="span" variant="body2" sx={textSx}>
        {value || fallback}
      </Typography>
    </Box>
  );
};

const WorkOrderInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const invoiceRef = useRef();

  const { items: selectedItems, invoiceType, savedInvoice, isEditing, invoiceId, invoiceNumber: passedInvoiceNumber, invoiceDate: passedInvoiceDate, poNumber: passedPoNumber } = location.state || { items: [] };

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState(false);

  const [invoiceDate, setInvoiceDate] = useState(passedInvoiceDate ? new Date(passedInvoiceDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));
  const [editingInvoiceDate, setEditingInvoiceDate] = useState(false);

  const parentOrderPoNumber = selectedItems[0]?.parent?.poNumber || '';
  const [poNumber, setPoNumber] = useState(passedPoNumber || parentOrderPoNumber || '');
  const [editingPoNumber, setEditingPoNumber] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState((savedInvoice && !isEditing) || false);
  const isReadOnly = (savedInvoice && !isEditing) || saveSuccess;
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [companyDetails, setCompanyDetails] = useState(null);

  useEffect(() => {
    setInvoiceNumber(passedInvoiceNumber || selectedItems[0]?.parent?.entryNumber || '');
    if (passedPoNumber) setPoNumber(passedPoNumber);
    if (passedInvoiceDate) setInvoiceDate(new Date(passedInvoiceDate).toLocaleDateString('en-GB'));
  }, [passedInvoiceNumber, passedPoNumber, passedInvoiceDate, selectedItems]);

  const handleDownload = () => {
    const invoiceElement = document.getElementById('generated-invoice');
    if (!invoiceElement) return;

    // Sanitize invoice number for filename (remove illegal characters)
    const safeInvoiceNumber = (invoiceNumber || 'preview').toString().replace(/[\/\\?%*:|"<>]/g, '-');
    const filename = `WorkOrder_${safeInvoiceNumber}.pdf`;

    import('html2pdf.js').then((html2pdf) => {
      const opt = {
        margin: [5, 5, 5, 5],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          windowWidth: 1200
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      invoiceElement.classList.add('pdf-bill-large');
      html2pdf.default().from(invoiceElement).set(opt).save().then(() => {
        invoiceElement.classList.remove('pdf-bill-large');
      });
    });
  };

  const handleDownloadWord = () => {
    const invoiceElement = document.getElementById('generated-invoice');
    if (!invoiceElement) return;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Work Order Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 4px 8px; text-align: left; }
          .word-flex-fallback { display: block; width: 100%; clear: both; }
          .word-float-left { float: left; width: 50%; }
          .word-float-right { float: right; width: 50%; text-align: right; }
        </style>
      </head>
      <body>
        ${invoiceElement.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `WorkOrder_${invoiceNumber || 'preview'}.doc`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
        const invoicePayload = {
            invoiceNumber,
            invoiceType: invoiceType || 'WorkOrder',
            workItems: selectedItems.map(item => item.id),
            parentOrderInfo: {
                entryNumber: selectedItems[0]?.parent?.entryNumber,
                vendor: selectedItems[0]?.parent?.vendor
            },
            poNumber: poNumber,
            company_id: parentOrder.company_id || null,
            company_address: companyDetails ? companyDetails.address : '',
            gstNo: companyDetails ? companyDetails.gst_number : '',
            recipient: companyDetails ? companyDetails.company_name : parentOrder.vendor
        };
        if (isEditing && invoiceId) {
            await API.put(`/invoices/${invoiceId}`, invoicePayload);
            setSnackbar({ open: true, message: 'Invoice updated successfully!', severity: 'success' });
        } else {
            await API.post('/invoices', invoicePayload);
            setSnackbar({ open: true, message: 'Invoice saved successfully!', severity: 'success' });
        }
        setSaveSuccess(true);
    } catch (error) {
        console.error("Failed to save invoice:", error);
        const serverError = error.response?.data?.error;
        const msg = Array.isArray(serverError) ? serverError.join(', ') : (typeof serverError === 'string' ? serverError : 'Could not save the invoice. Please try again.');
        setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  if (selectedItems.length === 0) {
    return (
        <Container sx={{ textAlign: 'center', mt: 5 }}>
            <Typography variant="h6">No items to display.</Typography>
            <Button sx={{mt: 2}} variant="contained" onClick={() => navigate('/invoices')}>Back to Invoices</Button>
        </Container>
    );
  }

  const parentOrder = selectedItems[0]?.parent || {};

  useEffect(() => {
    if (parentOrder && parentOrder.company_id) {
      API.get('/companies/' + parentOrder.company_id)
        .then(response => {
          if (response.data.data) setCompanyDetails(response.data.data);
        })
        .catch(console.error);
    }
  }, [parentOrder]);

  const totalAmount = selectedItems.reduce((sum, item) => sum + calculateItemAmount(item, companyDetails), 0);
  const totalWithGst = totalAmount * 1.18;
  const roundedTotal = Math.round(totalWithGst);

  const uniqueEvents = selectedItems.reduce((acc, item) => {
      const key = `${item.eventName}-${item.parent?.eventDate}`;
      if (!acc.has(key)) {
          acc.set(key, {
              name: `For ${item.eventName} at ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}`,
              date: item.parent?.eventDate ? new Date(item.parent.eventDate).toLocaleDateString('en-GB') : ''
          });
      }
      return acc;
  }, new Map());

  const eventDateDetails = Array.from(uniqueEvents.values());
  const uniqueDates = [...new Set(eventDateDetails.map(detail => detail.date))];

  const isPO = selectedItems[0]?.poNpo === 'PO';
  const isVidhanMandal = companyDetails?.uses_marathi_labels === true || parentOrder?.companyDetails?.uses_marathi_labels === true || companyDetails?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || parentOrder?.companyDetails?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || false;

  return (
    <Container>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate('/invoices')}>Back</Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
            {(!savedInvoice || isEditing) && !saveSuccess && (
                <Button variant="contained" color="success" onClick={handleSaveToDatabase} disabled={isSaving || saveSuccess}>
                    {isSaving ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Update Invoice' : 'Save to Database')}
                </Button>
            )}
            {saveSuccess && (
                <>
                    <Button variant="contained" onClick={handleDownload}>Download PDF</Button>
                    <Button variant="contained" color="info" onClick={handleDownloadWord}>Download Word</Button>
                </>
            )}
        </Box>
      </Box>
      {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>{isEditing ? 'Invoice updated successfully!' : 'Invoice saved successfully!'}</Alert>}

      <Paper ref={invoiceRef} id="generated-invoice" className="invoice-container" sx={{ p: 0, border: '2px solid #000' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid #000', p: 1 }}>
          <img src="/ONGC logo.png" alt="ONGC Logo" style={{ height: 100, marginBottom: 8 }} />
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>निगमित संचार विभाग</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>पहिली मंजिल, एनबीपी ग्रीन हाईट्स,</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>क्षेत्रीय कार्यालय, ओएनजीसी बांद्रा कुर्ला कॉम्प्लेक्स</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>बांद्रा (ईस्ट) , मुंबई - ४०००५१</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>दूरभाष: 022-26274105 /4134  email : ongcmumbaice@ongc.co.in</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, pb: 0 }}>
             <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                सं. प.अ.क्षे.का./नि.सं./
                {editingInvoiceNumber ? (
                    <TextField
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        onBlur={() => setEditingInvoiceNumber(false)}
                        autoFocus
                        size="small"
                        variant="standard"
                        sx={{ ml: 1, width: '100px' }}
                        disabled={isReadOnly}
                    />
                ) : (
                    <Box component="span" onClick={() => !isReadOnly && setEditingInvoiceNumber(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}>
                        {invoiceNumber || 'Click to set'}
                    </Box>
                )}
             </Typography>
             <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 0.5 }}>DT:</Typography>
                <EditableField
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  isEditing={editingInvoiceDate}
                  setEditing={setEditingInvoiceDate}
                  isReadOnly={isReadOnly}
                  sx={{ ml: 0.5 }}
                  textSx={{ fontSize: '0.875rem' }}
                />
             </Box>
        </Box>
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
            To,{'\n'}{`${parentOrder.vendor}\n21, Nilkanth Apartment, Samata Nagar,\nPokharan Road No. 1, Thane (W) 400606`}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 3 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', borderBottom: '1.5px solid #000', pb: 0.2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', m: 0 }}>
                Work Order{isPO ? ' PO No.\u00A0' : ''}
              </Typography>
              {isPO && (
                <EditableField
                  value={poNumber}
                  onChange={setPoNumber}
                  isEditing={editingPoNumber}
                  setEditing={setEditingPoNumber}
                  isReadOnly={isReadOnly}
                  sx={{ '&:hover': { borderBottom: 'none' } }}
                  textSx={{ fontSize: '1.25rem', fontWeight: 'bold' }}
                  fallback="Click to set"
                />
              )}
            </Box>
          </Box>

          <Typography variant="body2" sx={{ mb: 1 }} fontSize="0.9rem">
            The Following Photography Assignment Is Assigned To Your Agency.
          </Typography>
        </Box>
        <TableContainer sx={{ p: 2, pt: 0 }}>
          <Table size="small" sx={{ border: '1px solid #000' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>Sr.<br />No.</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>{isVidhanMandal ? 'कामाचे स्वरूप' : 'Work'}</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>{isVidhanMandal ? 'नग' : 'Qty.'}</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>Rate</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>{isVidhanMandal ? 'रकम' : 'Amount'}<br />(Rs.)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedItems.map((item, idx) => {
              const amount = calculateItemAmount(item, companyDetails);
              
              let companyCustomRate = null;
              if (companyDetails?.work_rates) {
                  if (item.workMain === '32_GB_Pendrive' || item.workMain === 'Others') {
                      companyCustomRate = companyDetails.work_rates[item.workMain];
                  } else {
                      companyCustomRate = companyDetails.work_rates[item.workMain]?.[item.workSub];
                  }
              }
              
              const rate = (companyCustomRate !== undefined && companyCustomRate !== '' && companyCustomRate !== null) 
                            ? Number(companyCustomRate) 
                            : 0;

              const quantity = item.quantity || 1;

              let dimensionsText = '';
              if (item.workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच' || bannerSubs.includes(item.workSub)) {
                  const isLamination = item.workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच';
                  const unit = isLamination ? 'इंच' : 'फूट';
                  const sqUnit = isLamination ? 'sq.in' : 'sq.ft';
                  
                  if (item.dimensions && item.dimensions.length > 0) {
                      let totalArea = 0;
                      const dimsStr = item.dimensions.map(d => {
                          const l = Number(d.length) || 0; 
                          const b = Number(d.breadth) || 0;
                          const q = Number(d.qty) || 1;
                          totalArea += (l * b * q);
                          return `${l}x${b} (${q} नग)`;
                      }).join(', ');
                      dimensionsText = ` (आकार: ${dimsStr} ${unit} = ${totalArea} ${sqUnit})`;
                  } else if (item.length && item.breadth) {
                      dimensionsText = ` (आकार: ${item.length} x ${item.breadth} ${unit} = ${item.length * item.breadth * quantity} ${sqUnit})`;
                  }
              }
                
              return (
                <TableRow key={item.id || idx}>
                  <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>{idx + 1}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    <Typography variant="body2" component="div">{item.workMain ? item.workMain.replaceAll('_',' ') : 'N/A'}</Typography>
                    <>
                        <Typography variant="body2" component="div">
                            {item.workSub && (isVidhanMandal ? `कामाचे प्रकार : ${item.workSub.replaceAll('_', ' ')}` : `Duration : ${item.workSub.replaceAll('_', ' ')}`)}
                            {dimensionsText}
                        </Typography>
                        <Typography variant="body2" component="div">{isVidhanMandal ? `कामाचा दिनांक: ${item.parent?.eventDate ? new Date(item.parent.eventDate).toLocaleDateString('en-GB') : ''}` : `dt. ${item.parent?.eventDate ? new Date(item.parent.eventDate).toLocaleDateString('en-GB') : ''}`}</Typography>
                        <Typography variant="body2" component="div">{isVidhanMandal ? `कामाचे नांव: ${item.eventName}` : `For ${item.eventName}`}</Typography>
                        <Typography variant="body2" component="div">{isVidhanMandal ? `कामाचे स्थळ: ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}` : `at ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}`}</Typography>
                    </>
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>{quantity}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{rate.toLocaleString('en-IN')}</TableCell>
                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{amount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, pt: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableBody>
                  <TableRow>
                      <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right'}}>Total Cost</TableCell>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: '25%' }}>{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>CGST 9%</TableCell>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{(totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>SGST 9%</TableCell>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>{(totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                      <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>Total</TableCell>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>{totalWithGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow>
                      <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>{`Round Up Rs. (${numberToWords(roundedTotal)})`}</TableCell>
                      <TableCell sx={{ border: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>{roundedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box sx={{ p: 2, pt: 0 }}>
          <TableContainer>
            <Table size="small" sx={{ border: '1px solid #000' }}>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #000', width: 100, fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचे नांव' : 'Event'}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    {selectedItems.every(item => 
                        item.eventName === selectedItems[0].eventName && 
                        item.eventVenue === selectedItems[0].eventVenue && 
                        item.customVenue === selectedItems[0].customVenue
                    ) 
                      ? (isVidhanMandal ? `कामाचे नांव ${selectedItems[0].eventName} कामाचे स्थळ ${selectedItems[0].eventVenue === 'Others' ? selectedItems[0].customVenue : selectedItems[0].eventVenue}` : `For ${selectedItems[0].eventName} at ${selectedItems[0].eventVenue === 'Others' ? selectedItems[0].customVenue : selectedItems[0].eventVenue}`) 
                      : (isVidhanMandal ? 'विविध ठिकाणी विविध कार्यक्रमांसाठी.' : 'For Various events at various places.')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचा दिनांक' : 'Date'}</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    {uniqueDates.join(', ')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        <Box sx={{ p: 2, pt: 0, mt: 4, mb: 4, pr: 4, textAlign: 'center', paddingLeft: '60%', paddingTop : '10%' }}>
          <Typography variant="body2" sx={{ fontFamily: 'Mangal, Arial, sans-serif', fontSize: '1.1rem', lineHeight: 1.7 }}>
            केलिए<br/>निगमित संचार विभाग<br/>पहिली मंजिल, एनबीपी ग्रीन हाइट्स,<br/>बीकेसी-बांद्रा-ईस्ट-मुंबई
          </Typography>
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WorkOrderInvoice;