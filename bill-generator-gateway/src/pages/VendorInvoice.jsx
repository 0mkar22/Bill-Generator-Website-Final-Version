import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Button, TextField, Container, CircularProgress, Alert, Snackbar
} from '@mui/material';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './VendorInvoice.css';
import API from '../services/api';
import { pricing } from '../constants/data';
import { supabase } from '../supabase';
import { calculateItemAmount, numberToWords } from '../utils/helpers';

const tableCellStyle = { border: '1px solid #000', p: '4px 8px' };
const boldHeaderCellStyle = { ...tableCellStyle, fontWeight: 'bold' };
const boldRightAlignedCellStyle = { ...boldHeaderCellStyle, textAlign: 'right' };
const flexEndColumnStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' };
const borderBottomStyle = { borderBottom: '1px solid #000' };
const borderRightStyle = { borderRight: '1px solid #000' };

function VendorInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: selectedItems, invoiceType, savedInvoice, isEditing, invoiceId, invoiceNumber: passedInvoiceNumber, invoiceDate: passedInvoiceDate, recipient: passedRecipient, dealingOfficer: passedDealingOfficer, emailId: passedEmailId, vendorCode: passedVendorCode, poNumber: passedPoNumber, poDate: passedPoDate, serviceDescription: passedServiceDescription, gstNo: passedGstNo } = location.state || { items: [] };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState((savedInvoice && !isEditing) || false);
  const isReadOnly = (savedInvoice && !isEditing) || saveSuccess;
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [recipient, setRecipient] = useState(`OIL & NATURAL GAS CORPORATION LTD.\nCorporate Communication,\nN.B.P. Green Heights,\nBKC, Bandra (E),\nMumbai 400 051`);
  const [editingRecipient, setEditingRecipient] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState(false);
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

  const displayDate = passedInvoiceDate
    ? new Date(passedInvoiceDate).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  useEffect(() => {
    if (passedInvoiceNumber) setInvoiceNumber(passedInvoiceNumber);
  }, [passedInvoiceNumber]);

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
    const billElement = document.getElementById('generated-bill');
    if (!billElement) return;
    billElement.classList.add('pdf-bill-large');
    setTimeout(() => {
      html2canvas(billElement, { scale: 2.5, useCORS: true, logging: false, allowTaint: true, backgroundColor: '#ffffff' })
        .then(canvas => {
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`VendorInvoice_${invoiceNumber || 'preview'}.pdf`);
            billElement.classList.remove('pdf-bill-large');
        });
    }, 100);
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
              recipient: companyDetails ? companyDetails.company_name : recipient,
              company_id: parentOrder.company_id || null,
              company_address: companyDetails ? companyDetails.address : '',
              dealingOfficer,
              emailId,
              vendorCode,
              poNumber,
              poDate,
              serviceDescription,
              gstNo
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

  const amountBeforeTax = selectedItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  const cgst = amountBeforeTax * 0.09;
  const sgst = amountBeforeTax * 0.09;
  const total = amountBeforeTax + cgst + sgst;
  const rounded = Math.round(total);
  const parentOrder = selectedItems[0]?.parent || {};

  useEffect(() => {
    if (parentOrder && parentOrder.company_id) {
      supabase.from('companies').select('*').eq('id', parentOrder.company_id).single()
        .then(({ data }) => {
          if (data) setCompanyDetails(data);
        })
        .catch(console.error);
    }
  }, [parentOrder]);

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
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleDownloadBill}>
                    Download Invoice
                </Button>
                <Button variant="contained" color="secondary" onClick={handleGenerateWorkOrderInvoice}>
                    Generate Work Order Invoice
                </Button>
            </Box>
        </Alert>
      )}

      <Paper id="generated-bill" sx={{ p: 0, mt: 3, mb: 3, border: '2px solid #000', background: '#fff' }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', ...borderBottomStyle, alignItems: 'stretch' }}>
          <Box sx={{ flex: 1, ...borderRightStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ p: 1, fontSize: '1.4rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>To,</Typography>
              {editingRecipient ? (
                <TextField multiline minRows={3} value={recipient} onChange={e => setRecipient(e.target.value)} variant="outlined" fullWidth size="small" sx={{ background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }} onBlur={() => setEditingRecipient(false)} autoFocus />
              ) : (
                <Box onClick={() => !isReadOnly && setEditingRecipient(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', minHeight: 60, whiteSpace: 'pre-line', p: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>{companyDetails ? companyDetails.company_name + '\n' + companyDetails.address : recipient}</Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1, justifyContent: 'center', height: '100%' }}>
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                <img src="/logo.PNG" alt="Company Logo" style={{ height: '100%', width: 'auto', maxHeight: 120 }} />
              </Box>
              <Box sx={{ textAlign: 'right', fontSize: '1.2rem' }}>
                <Typography variant="body2">{parentOrder.vendor || 'Vendor'}</Typography>
                <Typography variant="body2">21, Nilkanth Aprtment, Samata Nagar,</Typography>
                <Typography variant="body2">Pokharan Road No. 1, Thane (W) 400 606</Typography>
                <Typography variant="body2">E-mail : bhogtevijay@gmail.com</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', ...borderBottomStyle }}>
          <Box sx={{ flex: 1, ...borderRightStyle, p: 1, fontSize: '1.2rem' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}><span style={{ fontWeight: 'bold' }}>Dealing Officer :</span>
              {editingDealingOfficer ? ( <TextField value={dealingOfficer} onChange={e => setDealingOfficer(e.target.value)} onBlur={() => setEditingDealingOfficer(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/> ) : ( <Box component="span" onClick={() => !isReadOnly && setEditingDealingOfficer(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{dealingOfficer}</Typography></Box> )}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>Email ID :</span>
              {editingEmailId ? ( <TextField value={emailId} onChange={e => setEmailId(e.target.value)} onBlur={() => setEditingEmailId(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => !isReadOnly && setEditingEmailId(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{emailId}</Typography></Box>)}
            </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>GST No. :</span>
                {editingGstNo ? ( <TextField value={gstNo} onChange={e => setGstNo(e.target.value)} onBlur={() => setEditingGstNo(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => !isReadOnly && setEditingGstNo(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.25rem', verticalAlign: 'middle' }}>{gstNo}</Typography></Box>)}
              </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>PO No. :</span>
              {editingPoNumber ? ( <TextField value={poNumber} onChange={e => setPoNumber(e.target.value)} onBlur={() => setEditingPoNumber(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => !isReadOnly && setEditingPoNumber(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{poNumber || 'N/A'}</Typography></Box>)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>PO Date :</span>
              {editingPoDate ? ( <TextField value={poDate} onChange={e => setPoDate(e.target.value)} onBlur={() => setEditingPoDate(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => !isReadOnly && setEditingPoDate(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{poDate || 'N/A'}</Typography></Box>)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1, fontSize: '1.2rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, ...borderBottomStyle, pb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', ...borderRightStyle, pr: 2, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Invoice No. :</Typography>
                {editingInvoiceNumber ? (
                  <TextField value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} onBlur={() => setEditingInvoiceNumber(false)} autoFocus size="small" sx={{ width: 100, background: '#fafafa', ml: '8px' }} InputProps={{ style: { fontSize: '1.2rem' } }} disabled={isReadOnly} />
                ) : (
                  <Box component="span" onClick={() => !isReadOnly && setEditingInvoiceNumber(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{invoiceNumber || 'Click to set'}</Typography></Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Date :</Typography>
                <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>{displayDate}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, mt: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Vendor Code :</Typography>
              {editingVendorCode ? ( <TextField value={vendorCode} onChange={e => setVendorCode(e.target.value)} onBlur={() => setEditingVendorCode(false)} autoFocus size="small" sx={{ width: 100, background: '#fafafa', ml: '8px' }} InputProps={{ style: { fontSize: '1.2rem' } }} />) : ( <Box component="span" onClick={() => !isReadOnly && setEditingVendorCode(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{vendorCode}</Typography></Box> )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Place Of Supply :</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem', marginLeft: 4 }}>Mumbai</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Service Description :</Typography>
              {editingServiceDescription ? ( <TextField value={serviceDescription} onChange={e => setServiceDescription(e.target.value)} onBlur={() => setEditingServiceDescription(false)} autoFocus size="small" sx={{ width: 180, background: '#fafafa', ml: '8px' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => !isReadOnly && setEditingServiceDescription(true)} sx={{ cursor: isReadOnly ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{serviceDescription}</Typography></Box> )}
            </Box>
          </Box>
        </Box>
        <Table size="small" sx={{ borderCollapse: 'collapse', border: '1px solid #000', borderTop: 'none' }}>
          <TableHead>
            <TableRow sx={{ borderBottom: '1px solid #000' }}>
              <TableCell sx={boldHeaderCellStyle}>Sr. No</TableCell>
              <TableCell sx={boldHeaderCellStyle}>Description Of Items</TableCell>
              <TableCell sx={boldHeaderCellStyle}>Quantity</TableCell>
              <TableCell sx={boldHeaderCellStyle}>HSN Code</TableCell>
              <TableCell sx={boldRightAlignedCellStyle}>Rate Rs.</TableCell>
              <TableCell sx={boldRightAlignedCellStyle}>Amount Rs.</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedItems.map((item, idx) => {
              const amount = calculateItemAmount(item);
              const rate = (item.workMain === '32_GB_Pendrive') ? pricing[item.workMain] : (pricing[item.workMain]?.[item.workSub] || 0);
              const quantity = item.quantity || 1;
              return (
                <TableRow key={item.id || idx} sx={{ borderBottom: '1px solid #000' }}>
                  <TableCell sx={tableCellStyle} align="center">{idx + 1}</TableCell>
                  <TableCell sx={tableCellStyle}>
                    <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Event Date:</span> {item.parent?.eventDate ? new Date(item.parent.eventDate).toLocaleDateString('en-GB') : 'N/A'}<br />
                      <span style={{ fontWeight: 'bold' }}>Event Name:</span> {item.eventName}<br />
                      <span style={{ fontWeight: 'bold' }}>Venue:</span> {item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}<br />
                      <span style={{ fontWeight: 'bold' }}>Work Type:</span> {item.workMain ? item.workMain.replaceAll('_', ' ') : ''}<br />
                      {item.workMain !== '32_GB_Pendrive' && <span style={{ fontWeight: 'bold' }}>Location and Duration:</span>} {item.workMain !== '32_GB_Pendrive' && item.workSub && item.workSub.replaceAll('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'center' }}>{quantity}</TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'center' }}>99838</TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'right' }}>{rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell sx={{ ...tableCellStyle, textAlign: 'right' }}>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Box sx={{ fontSize: '1.1rem' }}>
          <Box sx={{ ...flexEndColumnStyle, alignItems: 'flex-end', ...borderBottomStyle, m: 1 }}>
            <Box sx={{ width: 340, p: '8px', textAlign: 'right', m: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.5, mb: 0, columnGap: 3 }}>
                <Typography variant="body2" sx={{ gridColumn: '1 / 2', textAlign: 'left', whiteSpace: 'nowrap' }}>Amount Before Tax:</Typography>
                <Typography variant="body2" sx={{ gridColumn: '2 / 3', textAlign: 'right' }}>{amountBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                <Typography variant="body2" sx={{ gridColumn: '1 / 2', textAlign: 'left' }}>CGST 9%:</Typography>
                <Typography variant="body2" sx={{ gridColumn: '2 / 3', textAlign: 'right' }}>{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                <Typography variant="body2" sx={{ gridColumn: '1 / 2', textAlign: 'left' }}>SGST 9%:</Typography>
                <Typography variant="body2" sx={{ gridColumn: '2 / 3', textAlign: 'right' }}>{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                <Typography variant="body2" sx={{ gridColumn: '1 / 2', textAlign: 'left', fontWeight: 'bold' }}>Total Amount Rs.:</Typography>
                <Typography variant="body2" sx={{ gridColumn: '2 / 3', textAlign: 'right', fontWeight: 'bold' }}>{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', ...borderBottomStyle }}>
            <Box sx={{ flex: 1, p: '8px', ...borderRightStyle }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>In Words: {numberToWords(rounded)}</Typography>
            </Box>
            <Box sx={{ width: 280, p: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Round up Rs.:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <Box sx={{ flex: 3, p: '8px', ...borderRightStyle, fontSize: '1rem' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>GST No. {gstNo}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Pan No. ABJPB2133M</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>Bank Details:</Typography>
              <Typography variant="body2">Bank Name: State Bank Of India</Typography>
              <Typography variant="body2">Bank A/C No.: 34238902999</Typography>
              <Typography variant="body2">Bank IFSC Code: SBIN0013035</Typography>
            </Box>
            <Box sx={{ width: 860, textAlign: 'center', display: 'flex' }}>
              <Box sx={{ flex: 1, mr: 0.5, textAlign: 'center', ...borderRightStyle, pr: 1, height: '100%', py: '8px', ...flexEndColumnStyle }}>
                <Box sx={{ height: 100, width: '90%', maxWidth: 220, mx: 'auto', mt: 1 }}></Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Digital Signature</Typography>
              </Box>
              <Box sx={{ flex: 1, ml: 2, textAlign: 'center', height: '100%', py: '8px', ...flexEndColumnStyle }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>For {parentOrder.vendor || 'Vendor'}</Typography>
                <Box sx={{ height: 100, width: '100%', maxWidth: 220, mx: 'auto', mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/signature.png" alt="Authorised Signatory Signature" style={{ width: '100%', maxWidth: 180, height: 'auto', objectFit: 'contain' }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Authorised Signatory</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default VendorInvoice;
