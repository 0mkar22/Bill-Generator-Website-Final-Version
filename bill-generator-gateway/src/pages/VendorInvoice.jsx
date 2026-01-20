import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, Container, CircularProgress, Alert
} from '@mui/material';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './VendorInvoice.css';
import API from '../services/api';

// --- DATA & HELPER FUNCTIONS ---
const pricing = {
  "Still_Photography": { "Mumbai_Upto_4_Hrs": 2950, "Mumbai_Above_4_and_upto_8_Hrs": 4150, "Panvel_Upto_4_Hrs": 3200, "Panvel_Above_4_and_upto_8_Hrs": 4150, "Uran_Upto_4_Hrs": 4000, "Uran_Above_4_and_upto_8_Hrs": 5200, "Nhava_Upto_4_Hrs": 4000, "Nhava_Above_4_and_upto_8_Hrs": 5200, "Outstation_Upto_4_Hrs": 4490, "Outstation_Above_4_and_upto_8_Hrs": 6300 },
  "Videography": { "Mumbai_Upto_4_Hrs": 4300, "Mumbai_Above_4_and_upto_8_Hrs": 6000, "Panvel_Upto_4_Hrs": 4300, "Panvel_Above_4_and_upto_8_Hrs": 6000, "Uran_Upto_4_Hrs": 4500, "Uran_Above_4_and_upto_8_Hrs": 6000, "Nhava_Upto_4_Hrs": 4500, "Nhava_Above_4_and_upto_8_Hrs": 6000, "Outstation_Upto_4_Hrs": 5800, "Outstation_Above_4_and_upto_8_Hrs": 7500 },
  "Two_Camera_Setup": { "Mumbai_Upto_4_Hrs": 23650, "Mumbai_Above_4_and_upto_8_Hrs": 37000, "Panvel_Upto_4_Hrs": 25500, "Panvel_Above_4_and_upto_8_Hrs": 37000, "Uran_Upto_4_Hrs": 26500, "Uran_Above_4_and_upto_8_Hrs": 38000, "Nhava_Upto_4_Hrs": 26500, "Nhava_Above_4_and_upto_8_Hrs": 38000, "Outstation_Upto_4_Hrs": 32000, "Outstation_Above_4_and_upto_8_Hrs": 41000 },
  "Three_Camera_Setup": { "Mumbai_Upto_4_Hrs": 31000, "Mumbai_Above_4_and_upto_8_Hrs": 40000, "Panvel_Upto_4_Hrs": 31000, "Panvel_Above_4_and_upto_8_Hrs": 40000, "Uran_Upto_4_Hrs": 31000, "Uran_Above_4_and_upto_8_Hrs": 40000, "Nhava_Upto_4_Hrs": 31000, "Nhava_Above_4_and_upto_8_Hrs": 40000, "Outstation_Upto_4_Hrs": 32000, "Outstation_Above_4_and_upto_8_Hrs": 43000 },
  "Live_Telecast": { "Mumbai_Upto_4_Hrs": 7000, "Mumbai_Above_4_and_upto_8_Hrs": 9000, "Panvel_Upto_4_Hrs": 7000, "Panvel_Above_4_and_upto_8_Hrs": 9000, "Uran_Upto_4_Hrs": 7000, "Uran_Above_4_and_upto_8_Hrs": 9000, "Nhava_Upto_4_Hrs": 7000, "Nhava_Above_4_and_upto_8_Hrs": 9000, "Outstation_Upto_4_Hrs": 9000, "Outstation_Above_4_and_upto_8_Hrs": 10000 },
  "32_GB_Pendrive": 550, "Others": {}
};
const calculateItemAmount = (item) => {
    if (item.workMain === '32_GB_Pendrive') { return (pricing[item.workMain] || 0) * (item.quantity || 1); }
    return pricing[item.workMain]?.[item.workSub] || 0;
};
function numberToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = Math.round(num).toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[n[1][0]] + '  ' + a[n[1][1]]) + ' Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[n[2][0]] + '  ' + a[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[n[3][0]] + '  ' + a[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[n[4][0]] + '  ' + a[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + '  ' + a[n[5][1]]) : '';
    return str.trim() + ' Rupees Only';
}
const tableCellStyle = { border: '1px solid #000', p: '4px 8px' };
const boldHeaderCellStyle = { ...tableCellStyle, fontWeight: 'bold' };
const boldRightAlignedCellStyle = { ...boldHeaderCellStyle, textAlign: 'right' };
const flexEndColumnStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' };
const borderBottomStyle = { borderBottom: '1px solid #000' };
const borderRightStyle = { borderRight: '1px solid #000' };

function VendorInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: selectedItems, invoiceType, savedInvoice, invoiceNumber: passedInvoiceNumber } = location.state || { items: [] };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(savedInvoice || false);

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
  
  useEffect(() => {
    setInvoiceNumber(passedInvoiceNumber || '248/2025');
  }, [passedInvoiceNumber]);

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
            pdf.save(`VendorInvoice_${invoiceNumber}.pdf`);
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
            workItems: selectedItems.map(item => item._id),
            parentOrderInfo: { entryNumber: selectedItems[0].parent.entryNumber, vendor: selectedItems[0].parent.vendor }
        };
        await API.post('/invoices', invoicePayload);
        setSaveSuccess(true); // This will now trigger the new buttons to show
    } catch (error) {
        console.error("Failed to save invoice:", error);
        if (error.response?.data?.error) {
            alert(`Could not save the invoice: ${error.response.data.error}`);
        } else {
            alert("Could not save the invoice. Please try again.");
        }
    } finally {
        setIsSaving(false);
    }
  };

  const handleGenerateWorkOrderInvoice = () => {
      // Navigate to the other invoice page, passing the same items
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
  const parentOrder = selectedItems[0].parent;

  return (
    <Container>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate('/invoices')}>Back</Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
            {!savedInvoice && !saveSuccess && (
                <Button variant="contained" color="success" onClick={handleSaveToDatabase} disabled={isSaving}>
                    {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save to Database'}
                </Button>
            )}
        </Box>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
            Invoice saved successfully!
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
                <Box onClick={() => setEditingRecipient(true)} sx={{ cursor: 'pointer', minHeight: 60, whiteSpace: 'pre-line', p: 0.5 }}>
                  <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>{recipient}</Typography>
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
                <Typography variant="body2">{parentOrder.vendor}</Typography>
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
              {editingDealingOfficer ? ( <TextField value={dealingOfficer} onChange={e => setDealingOfficer(e.target.value)} onBlur={() => setEditingDealingOfficer(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/> ) : ( <Box component="span" onClick={() => setEditingDealingOfficer(true)} sx={{ cursor: 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{dealingOfficer}</Typography></Box> )}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>Email ID :</span>
              {editingEmailId ? ( <TextField value={emailId} onChange={e => setEmailId(e.target.value)} onBlur={() => setEditingEmailId(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => setEditingEmailId(true)} sx={{ cursor: 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{emailId}</Typography></Box>)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>GST No. :</span> <span style={{ fontSize: '1.25rem', verticalAlign: 'middle' }}>27AAAOC1598A1ZN</span></Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>PO No. :</span>
              {editingPoNumber ? ( <TextField value={poNumber} onChange={e => setPoNumber(e.target.value)} onBlur={() => setEditingPoNumber(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => setEditingPoNumber(true)} sx={{ cursor: 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{poNumber || 'N/A'}</Typography></Box>)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}><span style={{ fontWeight: 'bold' }}>PO Date :</span>
              {editingPoDate ? ( <TextField value={poDate} onChange={e => setPoDate(e.target.value)} onBlur={() => setEditingPoDate(false)} autoFocus size="small" sx={{ ml: 1, background: '#fafafa' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => setEditingPoDate(true)} sx={{ cursor: 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontSize: '1.2rem' }}>{poDate || 'N/A'}</Typography></Box>)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, p: 1, fontSize: '1.2rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, ...borderBottomStyle, pb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', ...borderRightStyle, pr: 2, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Invoice No. :</Typography>
                {editingInvoiceNumber ? (
                  <TextField value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} onBlur={() => setEditingInvoiceNumber(false)} autoFocus size="small" sx={{ width: 100, background: '#fafafa', ml: '8px' }} InputProps={{ style: { fontSize: '1.2rem' } }} disabled={saveSuccess} />
                ) : (
                  <Box component="span" onClick={() => !saveSuccess && setEditingInvoiceNumber(true)} sx={{ cursor: saveSuccess ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{invoiceNumber}</Typography></Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Date :</Typography>
                <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', fontSize: '1.1rem' }}>{new Date().toLocaleDateString('en-GB')}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, mt: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Vendor Code :</Typography>
              {editingVendorCode ? ( <TextField value={vendorCode} onChange={e => setVendorCode(e.target.value)} onBlur={() => setEditingVendorCode(false)} autoFocus size="small" sx={{ width: 100, background: '#fafafa', ml: '8px' }} InputProps={{ style: { fontSize: '1.2rem' } }} />) : ( <Box component="span" onClick={() => setEditingVendorCode(true)} sx={{ cursor: 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{vendorCode}</Typography></Box> )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Place Of Supply :</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem', marginLeft: 4 }}>Mumbai</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Service Description :</Typography>
              {editingServiceDescription ? ( <TextField value={serviceDescription} onChange={e => setServiceDescription(e.target.value)} onBlur={() => setEditingServiceDescription(false)} autoFocus size="small" sx={{ width: 180, background: '#fafafa', ml: '8px' }} InputProps={{ style: { fontSize: '1.2rem' } }}/>) : ( <Box component="span" onClick={() => setEditingServiceDescription(true)} sx={{ cursor: 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}><Typography component="span" variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{serviceDescription}</Typography></Box> )}
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
                <TableRow key={item._id} sx={{ borderBottom: '1px solid #000' }}>
                  <TableCell sx={tableCellStyle} align="center">{idx + 1}</TableCell>
                  <TableCell sx={tableCellStyle}>
                    <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Event Date:</span> {new Date(item.parent.eventDate).toLocaleDateString('en-GB')}<br />
                      <span style={{ fontWeight: 'bold' }}>Event Name:</span> {item.eventName}<br />
                      <span style={{ fontWeight: 'bold' }}>Venue:</span> {item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}<br />
                      <span style={{ fontWeight: 'bold' }}>Work Type:</span> {item.workMain.replaceAll('_', ' ')}<br />
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
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>GST No. 27AAAOC1598A1ZN</Typography>
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
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 2 }}>For {parentOrder.vendor}</Typography>
                <Box sx={{ height: 100, width: '100%', maxWidth: 220, mx: 'auto', mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/signature.png" alt="Authorised Signatory Signature" style={{ width: '100%', maxWidth: 180, height: 'auto', objectFit: 'contain' }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Authorised Signatory</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default VendorInvoice;