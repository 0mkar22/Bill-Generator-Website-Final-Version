import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Button, TextField, Container, CircularProgress, Alert, Snackbar, Backdrop
} from '@mui/material';

import './VendorInvoice.css';
import API from '../services/api';
import { supabase } from '../supabase';
import { calculateItemAmount, numberToWords, numberToMarathiWords, convertEnglishToMarathiNumbers } from '../utils/helpers';
import { bannerSubs } from '../constants/data';

const tableCellStyle = { border: '1px solid #000', p: '4px 8px' };
const boldHeaderCellStyle = { ...tableCellStyle, fontWeight: 'bold' };
const boldRightAlignedCellStyle = { ...boldHeaderCellStyle, textAlign: 'right' };
const flexEndColumnStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' };
const borderBottomStyle = { borderBottom: '1px solid #000' };
const borderRightStyle = { borderRight: '1px solid #000' };

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

function VendorInvoice() {

  const navigate = useNavigate();
  const location = useLocation();
  const invoiceRef = useRef();
  const { items: selectedItems, invoiceType, savedInvoice, isEditing, invoiceId, invoiceNumber: passedInvoiceNumber, invoiceDate: passedInvoiceDate, recipient: passedRecipient, dealingOfficer: passedDealingOfficer, emailId: passedEmailId, vendorCode: passedVendorCode, poNumber: passedPoNumber, poDate: passedPoDate, serviceDescription: passedServiceDescription, gstNo: passedGstNo } = location.state || { items: [] };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState((savedInvoice && !isEditing) || false);
  const isReadOnly = (savedInvoice && !isEditing) || saveSuccess;
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);

  const [recipient, setRecipient] = useState('');
  const [editingRecipient, setEditingRecipient] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState(false);
  
  const [invoiceDate, setInvoiceDate] = useState(passedInvoiceDate ? new Date(passedInvoiceDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));
  const [editingInvoiceDate, setEditingInvoiceDate] = useState(false);

  const [dealingOfficer, setDealingOfficer] = useState('Bagmishree');
  const [editingDealingOfficer, setEditingDealingOfficer] = useState(false);
  const [emailId, setEmailId] = useState('bagmishree@ongc.co.in');
  const [editingEmailId, setEditingEmailId] = useState(false);
  const [vendorCode, setVendorCode] = useState('896180');
  const [editingVendorCode, setEditingVendorCode] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [editingPoNumber, setEditingPoNumber] = useState(false);
  const [poDate, setPoDate] = useState('');
  const [editingPoDate, setEditingPoDate] = useState(false);
  const [serviceDescription, setServiceDescription] = useState('Photography, Videography');
  const [editingServiceDescription, setEditingServiceDescription] = useState(false);
  const [gstNo, setGstNo] = useState('27AAAOC1598A1ZN');
  const [editingGstNo, setEditingGstNo] = useState(false);

  useEffect(() => {
    if (passedInvoiceNumber) setInvoiceNumber(passedInvoiceNumber);
    if (passedInvoiceDate) setInvoiceDate(new Date(passedInvoiceDate).toLocaleDateString('en-GB'));
  }, [passedInvoiceNumber, passedInvoiceDate]);

  useEffect(() => {
    if (passedRecipient !== undefined) setRecipient(passedRecipient);
    if (passedDealingOfficer !== undefined) setDealingOfficer(passedDealingOfficer);
    if (passedEmailId !== undefined) setEmailId(passedEmailId);
    if (passedVendorCode !== undefined) setVendorCode(passedVendorCode);
    if (passedPoNumber !== undefined) setPoNumber(passedPoNumber);
    if (passedPoDate !== undefined) setPoDate(passedPoDate);
    if (passedServiceDescription !== undefined) setServiceDescription(passedServiceDescription);
    if (passedGstNo !== undefined) setGstNo(passedGstNo);
  }, [passedRecipient, passedDealingOfficer, passedEmailId, passedVendorCode, passedPoNumber, passedPoDate, passedServiceDescription, passedGstNo]);

  const handleDownloadBill = () => {
    const originalElement = document.getElementById('generated-bill');
    if (!originalElement) return;
    
    setIsGenerating(true);
    const safeInvoiceNumber = (invoiceNumber || 'preview').toString().replace(/[\/\\?%*:|"<>]/g, '-');
    const filename = `IcompSystemInvoice_${safeInvoiceNumber}.pdf`;

    import('html2canvas').then(({ default: html2canvas }) => {
      import('jspdf').then(({ jsPDF }) => {
        html2canvas(originalElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 1000, 
          width: 900,
          scrollY: -window.scrollY 
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(filename);
          setIsGenerating(false);
        }).catch(err => {
          console.error(err);
          setIsGenerating(false);
        });
      });
    });
  };

  const handleDownloadWord = () => {
    const billElement = document.getElementById('generated-bill');
    if (!billElement) return;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>IcompSystem Invoice</title>
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
        ${billElement.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `IcompSystemInvoice_${invoiceNumber || 'preview'}.doc`;
    
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
              invoiceType: invoiceType || 'Vendor',
              workItems: selectedItems.map(item => item.id),
              parentOrderInfo: {
                  entryNumber: selectedItems[0]?.parent?.entryNumber,
                  vendor: selectedItems[0]?.parent?.vendor
              },
              recipient: companyDetails?.company_name || parentOrder?.companyDetails?.company_name || recipient,
              company_id: companyDetails?.id || parentOrder?.company_id || null,
              company_address: companyDetails?.address || parentOrder?.companyDetails?.address || '',
              dealingOfficer,
              emailId,
              vendorCode,
              poNumber,
              poDate,
              serviceDescription,
              gstno: gstNo || companyDetails?.gst_number || parentOrder?.companyDetails?.gst_number || ''
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

  const handleGenerateWorkOrderInvoice = () => {
      navigate('/workorder-invoice', { state: { items: selectedItems, invoiceType: 'WorkOrder' } });
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
          const data = response.data.data;
          if (data) {
            setCompanyDetails(data);
            if (passedRecipient === undefined) {
              setRecipient(data.company_name + '\n' + data.address);
            }
            if (data.gst_number && passedGstNo === undefined) setGstNo(data.gst_number);
          }
        })
        .catch(console.error);
    }
  }, [parentOrder, passedRecipient, passedGstNo]);

  const amountBeforeTax = selectedItems.reduce((sum, item) => sum + calculateItemAmount(item, companyDetails), 0);
  
  const addressString = (companyDetails?.address || parentOrder?.companyDetails?.address || recipient || '').toLowerCase();
  const pincodeMatch = addressString.match(/\b\d{6}\b/);
  const isIGST = pincodeMatch && !pincodeMatch[0].startsWith('4') && !addressString.includes('maharashtra');

  const cgst = amountBeforeTax * 0.09;
  const sgst = amountBeforeTax * 0.09;
  const igst = amountBeforeTax * 0.18;
  
  const total = isIGST ? (amountBeforeTax + igst) : (amountBeforeTax + cgst + sgst);
  const rounded = Math.round(total);

  const isVidhanMandal = companyDetails?.uses_marathi_labels === true || parentOrder?.companyDetails?.uses_marathi_labels === true || companyDetails?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || parentOrder?.companyDetails?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || recipient?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || false;

  const companyNameStr = (companyDetails?.company_name || parentOrder?.companyDetails?.company_name || recipient || '').toUpperCase();
  const isONGC = companyDetails?.requires_po_number === true || parentOrder?.companyDetails?.requires_po_number === true || companyNameStr.includes('ONGC') || 
                 companyNameStr.includes('OIL & NATURAL GAS') || 
                 companyNameStr.includes('OIL AND NATURAL GAS');



  return (
    <Container>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => navigate('/invoices')}>Back</Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
              {(!savedInvoice || isEditing) && !saveSuccess && (
                  <Button variant="contained" color="success" onClick={handleSaveToDatabase} disabled={isSaving}>
                      {isSaving ? <CircularProgress size={24} color="inherit" /> : (isEditing ? 'Update Invoice' : 'Save to Database')}
                  </Button>
              )}
          </Box>
        </Box>

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
              {isEditing ? 'Invoice updated successfully!' : 'Invoice saved successfully!'}
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={handleDownloadBill}>
                    Download PDF
                </Button>
                
                <Button variant="contained" color="info" onClick={handleDownloadWord}>
                    Download Word
                </Button>

                {isONGC && (
                  <Button variant="contained" color="secondary" onClick={handleGenerateWorkOrderInvoice}>
                      Generate Work Order Invoice
                  </Button>
                )}
            </Box>
        </Alert>
      )}

      
        {isVidhanMandal ? (
            
<Paper ref={invoiceRef} id="generated-bill" className="invoice-container" sx={{ p: 0, mt: 3, mb: 3, border: '1px solid #000', background: '#fff', display: 'flex', flexDirection: 'column', width: '900px', minWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
    <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', py: 0.5 }}>TAX INVOICE</Typography>
    
    <Box sx={{ display: 'flex', width: '100%', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
        <Box sx={{ width: '55%', borderRight: '1px solid #000', p: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>प्रति,</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1, fontSize: '1.2rem', lineHeight: 1.4 }}>
                {companyDetails?.address || parentOrder?.companyDetails?.address || ''}
            </Typography>
            <Typography variant="body2" sx={{ mt: 'auto', fontWeight: 'bold', borderTop: '1px solid #000', mx: -1, mb: -1, p: 1 }}>
                GST No. <EditableField value={gstNo} onChange={setGstNo} isEditing={editingGstNo} setEditing={setEditingGstNo} isReadOnly={isReadOnly} />
            </Typography>
        </Box>
        <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1, height: '75px', borderBottom: '1px solid #000' }}>
                <img src="/logo.PNG" alt="Logo" style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'left' }} />
            </Box>
            <Typography variant="body2" sx={{ px: 1, mt: 0.5 }}>21, Nilkanth Aprtment, Samata Nagar,</Typography>
            <Typography variant="body2" sx={{ px: 1 }}>Pokharan Road No. 1, Thane (W) 400 606</Typography>
            <Typography variant="body2" sx={{ mb: 1, px: 1 }}>E-mail : bhogtevijay@gmail.com</Typography>
            
            <Box sx={{ display: 'flex', borderTop: '1px solid #000', mt: 'auto' }}>
                <Box sx={{ flex: 1, borderRight: '1px solid #000', p: 1 }}>
                    <Typography variant="body2">Invoice No. : <EditableField value={invoiceNumber} onChange={setInvoiceNumber} isEditing={editingInvoiceNumber} setEditing={setEditingInvoiceNumber} isReadOnly={isReadOnly} /></Typography>
                </Box>
                <Box sx={{ flex: 1, p: 1 }}>
                    <Typography variant="body2">Date : <EditableField value={invoiceDate} onChange={setInvoiceDate} isEditing={editingInvoiceDate} setEditing={setEditingInvoiceDate} isReadOnly={isReadOnly} /></Typography>
                </Box>
            </Box>
        </Box>
    </Box>

    <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', p: '2px 8px', fontSize: '0.85rem' } }}>
        <TableBody>
            <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>कक्ष क्रमांक</TableCell>
                <TableCell>{convertEnglishToMarathiNumbers(selectedItems[0]?.parent?.roomNumber) || 'ई-२'}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>कामाचा दिनांक :</TableCell>
                <TableCell>{
                    convertEnglishToMarathiNumbers((() => {
                        const dates = selectedItems.map(i => i.parent?.eventDate).filter(Boolean).sort();
                        if (dates.length === 0) return 'N/A';
                        if (dates.length === 1) return new Date(dates[0]).toLocaleDateString('en-GB').replace(/\//g, '-');
                        return `${new Date(dates[0]).toLocaleDateString('en-GB').replace(/\//g, '-')} ते ${new Date(dates[dates.length - 1]).toLocaleDateString('en-GB').replace(/\//g, '-')}`;
                    })())
                }</TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>कामाचे नांव :</TableCell>
                <TableCell>{selectedItems[0]?.eventName || ''}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>कामाचे स्थळ :</TableCell>
                <TableCell>{selectedItems[0]?.eventVenue === 'Others' ? selectedItems[0]?.customVenue : selectedItems[0]?.eventVenue}</TableCell>
            </TableRow>
        </TableBody>
    </Table>

    <Table size="small" sx={{ mt: 0, '& .MuiTableCell-root': { border: '1px solid #000', p: '6px 8px', fontSize: '0.85rem' } }}>
        <TableHead>
            <TableRow>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '5%' }}>Sr.<br/>No</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '55%' }}>Description Of Items</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '10%' }}>Quantity</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '15%' }}>With GST Rate<br/>Rs.</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '15%' }}>Total Amount<br/>Rs.</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {selectedItems.map((item, idx) => {
                const rate = calculateItemAmount({ ...item, quantity: 1 }, companyDetails);
                const amount = calculateItemAmount(item, companyDetails);
                const dateStr = item.parent?.eventDate ? new Date(item.parent?.eventDate).toLocaleDateString('en-GB').replace(/\//g, '-') : '';
                const workMainMap = { 'Photography': 'फोटोग्राफी', 'Videography': 'व्हिडीओग्राफी' };
                const workStr = workMainMap[item.workMain] || (item.workMain ? item.workMain.replaceAll('_', ' ') : '');
                const durationMap = { '8_Hours': '८ तासापर्यन्त', '4_Hours': '४ तासापर्यन्त', '12_Hours': '१२ तासापर्यन्त' };
                const subStr = durationMap[item.workSub] || (item.workSub ? item.workSub.replaceAll('_', ' ') : '');
                
                let desc = '';
                if (item.workMain === '32_GB_Pendrive') {
                    desc = '३२ जीबी पेनड्राईव्ह';
                } else if (item.workMain === '64_GB_Pendrive') {
                    desc = '६४ जीबी पेनड्राईव्ह';
                } else {
                    desc = `दि. ${dateStr} ${workStr} ${subStr}`;
                }

                return (
                    <TableRow key={item.id || idx}>
                        <TableCell align="center">{convertEnglishToMarathiNumbers(idx + 1)}</TableCell>
                        <TableCell>{convertEnglishToMarathiNumbers(desc)}</TableCell>
                        <TableCell align="center">{convertEnglishToMarathiNumbers(item.quantity || 1)}</TableCell>
                        <TableCell align="right">{convertEnglishToMarathiNumbers(rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</TableCell>
                        <TableCell align="right">{convertEnglishToMarathiNumbers(amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</TableCell>
                    </TableRow>
                );
            })}
            <TableRow>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>अक्षरी रुपये : {numberToMarathiWords(amountBeforeTax)} फक्त</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>एकूण जीएसटीसह रक्कम रु.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{convertEnglishToMarathiNumbers(amountBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</TableCell>
            </TableRow>
        </TableBody>
    </Table>

    <Box sx={{ display: 'flex', width: '100%', mt: 'auto', borderTop: 'none' }}>
        <Box sx={{ width: '35%', borderRight: '1px solid #000', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', p: '2px 4px', borderBottom: '1px solid #000' }}>GST No. 27ABJPB2133M5ZO</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', p: '2px 4px', borderBottom: '1px solid #000' }}>Pan No. ABJPB2133M</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', p: '2px 4px', borderBottom: '1px solid #000' }}>Bank Details</Typography>
            <Box sx={{ p: '2px 4px', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Bank Name : State Bank Of India</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Bank A/C No. : 34238092999</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Bank IFSC Code : SBIN0013035</Typography>
            </Box>
        </Box>
        <Box sx={{ width: '35%', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
            <img src="/stamp.png" alt="Stamp" style={{ width: '80px', height: '80px', objectFit: 'contain', marginRight: '16px' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.1 }}>Vijay R.</Typography>
                <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.1 }}>Bhogte</Typography>
                <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.1 }}>{new Date().toISOString().slice(0,10).replace(/-/g, '.')}</Typography>
                <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.1 }}>09:26:14</Typography>
                <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.1 }}>+05'30'</Typography>
            </Box>
        </Box>
        <Box sx={{ width: '30%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', borderBottom: '1px solid #000', width: '100%', textAlign: 'center', p: '4px' }}>For Icomp Systems</Typography>
            <Box sx={{ flexGrow: 1 }}></Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold', borderTop: '1px solid #000', width: '100%', textAlign: 'center', p: '4px' }}>Authorised Signatory</Typography>
        </Box>
    </Box>
</Paper>

        ) : (
            <Paper ref={invoiceRef} id="generated-bill" className="invoice-container" sx={{ p: 0, mt: 3, mb: 3, border: '2px solid #000', background: '#fff', display: 'flex', flexDirection: 'column', width: '900px', minWidth: '900px', margin: '0 auto' }}>
        
        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', ...borderBottomStyle, alignItems: 'stretch' }}>
          <Box sx={{ width: '50%', ...borderRightStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ p: 1, pl: 2, fontSize: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', height: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '1.4rem' }}>To,</Typography>

              {(companyDetails?.address || parentOrder?.companyDetails?.address) && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap', 
                    pl: 0.5, 
                    pr: 0.5, 
                    pb: 0.5, 
                    fontSize: '1.1rem', 
                    color: '#333',
                    lineHeight: 1.4 
                  }}
                >
                  {companyDetails?.address || parentOrder?.companyDetails?.address}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1, justifyContent: 'center', height: '100%' }}>
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                <img src="/logo.PNG" alt="Company Logo" style={{ height: '100%', width: 'auto', maxHeight: 120 }} />
              </Box>
              
              <Box sx={{ textAlign: 'right', mt: 1, width: '100%' }}>
                <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#333' }}>
                  21, Nilkanth Aprtment, Samata Nagar, Pokharan Road No. 1,
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.9rem', color: '#333' }}>
                  Thane (W) 400 606 &nbsp;&nbsp; E-mail : bhogtevijay@gmail.com
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', ...borderBottomStyle }}>
          <Box sx={{ width: '50%', ...borderRightStyle, p: 1, pl: 2, fontSize: '1.2rem' }}>
            {isONGC && (
            <>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}><span style={{ fontWeight: 'bold' }}>Dealing Officer :</span>
              <EditableField
              value={dealingOfficer}
              onChange={setDealingOfficer}
              isEditing={editingDealingOfficer}
              setEditing={setEditingDealingOfficer}
              isReadOnly={isReadOnly}
              sx={{ ml: 1, fontSize: '1.2rem' }}
              textSx={{ fontSize: '1.2rem' }}
            />
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>Email ID :</span>
              <EditableField
              value={emailId}
              onChange={setEmailId}
              isEditing={editingEmailId}
              setEditing={setEditingEmailId}
              isReadOnly={isReadOnly}
              sx={{ ml: 1, fontSize: '1.2rem' }}
              textSx={{ fontSize: '1.2rem' }}
            />
            </Typography>
            </>
            )}
              <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>GST No. :</span>
                <EditableField
                value={gstNo}
                onChange={setGstNo}
                isEditing={editingGstNo}
                setEditing={setEditingGstNo}
                isReadOnly={isReadOnly}
                sx={{ ml: 1, fontSize: '1.25rem' }}
                textSx={{ fontSize: '1.25rem', verticalAlign: 'middle' }}
              />
              </Typography>
            {isONGC && (
            <>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>PO No. :</span>
              <EditableField
              value={poNumber}
              onChange={setPoNumber}
              isEditing={editingPoNumber}
              setEditing={setEditingPoNumber}
              isReadOnly={isReadOnly}
              sx={{ ml: 1, fontSize: '1.2rem' }}
              textSx={{ fontSize: '1.2rem' }}
            />
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>PO Date :</span>
              <EditableField
              value={poDate}
              onChange={setPoDate}
              isEditing={editingPoDate}
              setEditing={setEditingPoDate}
              isReadOnly={isReadOnly}
              sx={{ ml: 1, fontSize: '1.2rem' }}
              textSx={{ fontSize: '1.2rem' }}
            />
            </Typography>
            </>
            )}
          </Box>
          
          <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', fontSize: '1.2rem' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', ...borderBottomStyle }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '50%', p: 1, ...borderRightStyle }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, ml: 1 }}>Invoice No. :</Typography>
                <EditableField
                  value={invoiceNumber}
                  onChange={setInvoiceNumber}
                  isEditing={editingInvoiceNumber}
                  setEditing={setEditingInvoiceNumber}
                  isReadOnly={isReadOnly}
                  sx={{ width: 100, ml: 1, fontSize: '1.2rem', fontWeight: 'bold' }}
                  textSx={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                  fallback="Click to set"
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '50%', p: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, ml: 1 }}>Date :</Typography>
                <EditableField
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  isEditing={editingInvoiceDate}
                  setEditing={setEditingInvoiceDate}
                  isReadOnly={isReadOnly}
                  sx={{ ml: 1, fontSize: '1.1rem', fontWeight: 'bold' }}
                  textSx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
            </Box>
            <Box sx={{ p: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {isONGC && (
              <>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, ml: 1 }}>Vendor Code :</Typography>
                <EditableField
                  value={vendorCode}
                  onChange={setVendorCode}
                  isEditing={editingVendorCode}
                  setEditing={setEditingVendorCode}
                  isReadOnly={isReadOnly}
                  sx={{ ml: 1, fontSize: '1.2rem', fontWeight: 'bold' }}
                  textSx={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, ml: 1 }}>Place Of Supply :</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem', marginLeft: 1 }}>Mumbai</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, ml: 1, whiteSpace: 'nowrap' }}>Service Description :</Typography>
                <EditableField
                  value={serviceDescription}
                  onChange={setServiceDescription}
                  isEditing={editingServiceDescription}
                  setEditing={setEditingServiceDescription}
                  isReadOnly={isReadOnly}
                  sx={{ ml: 1, fontSize: '1.2rem', fontWeight: 'bold', flex: 1 }}
                  textSx={{ fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'break-word' }}
                />
              </Box>
              </>
            )}
            </Box>
          </Box>
        </Box>

        <Table size="small" sx={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
          <TableHead>
            <TableRow sx={{ borderBottom: '1px solid #000' }}>
              <TableCell sx={boldHeaderCellStyle}>Sr. No</TableCell>
              <TableCell sx={boldHeaderCellStyle}>Description Of Items</TableCell>
              <TableCell sx={boldHeaderCellStyle}>{isVidhanMandal ? 'नग' : 'Qty.'}</TableCell>
              <TableCell sx={boldHeaderCellStyle}>HSN Code</TableCell>
              <TableCell sx={boldRightAlignedCellStyle}>Rate Rs.</TableCell>
              <TableCell sx={boldRightAlignedCellStyle}>{isVidhanMandal ? 'रकम' : 'Amount'} Rs.</TableCell>
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
                <TableRow key={item.id || idx} sx={{ borderBottom: '1px solid #000' }}>
                  <TableCell sx={tableCellStyle} align="center">{idx + 1}</TableCell>
                  <TableCell sx={tableCellStyle}>
                    <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचा दिनांक:' : 'Event Date:'}</span> {item.parent?.eventDate ? new Date(item.parent.eventDate).toLocaleDateString('en-GB') : 'N/A'}<br />
                      <span style={{ fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचे नांव:' : 'Event Name:'}</span> {item.eventName}<br />
                      <span style={{ fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचे स्थळ:' : 'Venue:'}</span> {item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}<br />
                      <span style={{ fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचे स्वरूप:' : 'Work Type:'}</span> {item.workMain ? item.workMain.replaceAll('_', ' ') : ''}<br />
                      
                      {item.workMain !== '32_GB_Pendrive' && <span style={{ fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचे प्रकार:' : 'Location and Duration:'}</span>} 
                      {item.workMain !== '32_GB_Pendrive' && item.workSub && item.workSub.replaceAll('_', ' ')}
                      {dimensionsText}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'center' }}>{quantity}</TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'center' }}>99838</TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'right' }}>{rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'right' }}>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              );
            })}
            
            <TableRow sx={{ borderBottom: 'none' }}>
              <TableCell colSpan={5} sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>Amount Before Tax:</Typography>
              </TableCell>
              <TableCell sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>
                  {amountBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </TableCell>
            </TableRow>

            {isIGST ? (
              <TableRow sx={{ borderBottom: 'none' }}>
                <TableCell colSpan={5} sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>IGST 18%:</Typography>
                </TableCell>
                <TableCell sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>
                    {igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <>
                <TableRow sx={{ borderBottom: 'none' }}>
                  <TableCell colSpan={5} sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>CGST 9%:</Typography>
                  </TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>
                      {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ borderBottom: 'none' }}>
                  <TableCell colSpan={5} sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>SGST 9%:</Typography>
                  </TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'right', borderBottom: 'none', py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '1.1rem' }}>
                      {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                </TableRow>
              </>
            )}

            <TableRow sx={{ borderBottom: '1px solid #000' }}>
              <TableCell colSpan={5} sx={{ ...tableCellStyle, textAlign: 'right', py: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Total Amount Rs.:</Typography>
              </TableCell>
              <TableCell sx={{ ...tableCellStyle, textAlign: 'right', py: 1 }}>
                <Typography variant="body2" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', ...borderBottomStyle }}>
          <Box sx={{ flex: 1, p: '8px', pl: 2, ...borderRightStyle }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>In Words: {numberToWords(rounded)}</Typography>
          </Box>
          <Box sx={{ flex: '0 0 280px', p: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1, ml: 1 }}>Round up Rs.:</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
          <Box sx={{ width: '32%', p: '8px', pl: 2, ...borderRightStyle, fontSize: '1rem' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>GST No. 27ABJPB2133M5ZO</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Pan No. ABJPB2133M</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>Bank Details:</Typography>
              <Typography variant="body2">Bank Name: State Bank Of India</Typography>
              <Typography variant="body2">Bank A/C No.: 34238902999</Typography>
              <Typography variant="body2">Bank IFSC Code: SBIN0013035</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', ...borderRightStyle, pr: 1, py: '8px', ...flexEndColumnStyle }}>
              <Box sx={{ height: 100, width: '90%', maxWidth: 220, mx: 'auto', mt: 1 }}></Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Digital Signature</Typography>
            </Box>
            <Box sx={{ flex: '0 0 280px', textAlign: 'center', ml: 0, py: '8px', ...flexEndColumnStyle }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>For {parentOrder.vendor || 'Vendor'}</Typography>
              <Box sx={{ height: 100, width: '100%', maxWidth: 220, mx: 'auto', mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/signature.png" alt="Authorised Signatory Signature" style={{ width: '100%', maxWidth: 180, height: 'auto', objectFit: 'contain' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Authorised Signatory</Typography>
            </Box>
          </Box>

      </Paper>
        )}


      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, display: 'flex', flexDirection: 'column', gap: 2 }} open={isGenerating}>
        <CircularProgress color="inherit" />
        <Typography variant="h6">Generating PDF... Please wait.</Typography>
      </Backdrop>
    </Container>
  );
}

export default VendorInvoice;