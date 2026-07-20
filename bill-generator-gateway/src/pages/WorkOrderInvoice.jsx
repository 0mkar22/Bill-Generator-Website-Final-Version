import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Container, CircularProgress, Alert, TextField
} from '@mui/material';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './WorkOrderInvoice.css';
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

function numberToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = Math.round(num).toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
}

const calculateItemAmount = (item) => {
    if (item.workMain === '32_GB_Pendrive') { return (pricing[item.workMain] || 0) * (item.quantity || 1); }
    return pricing[item.workMain]?.[item.workSub] || 0;
};

const WorkOrderInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const invoiceRef = useRef();
  
  const { items: selectedItems, invoiceType, savedInvoice, invoiceNumber: passedInvoiceNumber } = location.state || { items: [] };
  
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(savedInvoice || false);

  useEffect(() => {
    setInvoiceNumber(passedInvoiceNumber || selectedItems[0]?.parent?.entryNumber || '');
  }, [passedInvoiceNumber, selectedItems]);

  const handleDownload = async () => {
    const input = invoiceRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`WorkOrder_${invoiceNumber || 'preview'}.pdf`);
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
        const invoicePayload = {
            invoiceNumber,
            invoiceType: invoiceType || 'WorkOrder',
            workItems: selectedItems.map(item => item.id || item._id),
            parentOrderInfo: {
                entryNumber: selectedItems[0]?.parent?.entryNumber,
                vendor: selectedItems[0]?.parent?.vendor
            }
        };
        await API.post('/invoices', invoicePayload);
        setSaveSuccess(true);
    } catch (error) {
        console.error("Failed to save invoice:", error);
        const serverError = error.response?.data?.error;
        if (Array.isArray(serverError)) {
            alert(`Could not save the invoice:\n- ${serverError.join('\n- ')}`);
        } else if (typeof serverError === 'string') {
            alert(`Could not save the invoice: ${serverError}`);
        } else {
            alert("Could not save the invoice. Please try again.");
        }
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
  const totalAmount = selectedItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  const totalWithGst = totalAmount * 1.18;
  const roundedTotal = Math.round(totalWithGst);

  // --- CORRECTED LOGIC for unique event/date pairs ---
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

  return (
    <Container>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate('/invoices')}>Back</Button>
        <Box sx={{ display: 'flex', gap: 2 }}>
            {!savedInvoice && (
                <Button variant="contained" color="success" onClick={handleSaveToDatabase} disabled={isSaving || saveSuccess}>
                    {isSaving ? <CircularProgress size={24} color="inherit" /> : (saveSuccess ? 'Saved' : 'Save to Database')}
                </Button>
            )}
            {saveSuccess && (
                <Button variant="contained" onClick={handleDownload}>Download Invoice</Button>
            )}
        </Box>
      </Box>
      {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>Invoice saved successfully!</Alert>}
      
      <Paper ref={invoiceRef} id="generated-invoice" sx={{ p: 0, border: '2px solid #000', fontFamily: 'Arial, sans-serif' }}>
        <Box sx={{ textAlign: 'center', borderBottom: '1px solid #000', p: 1 }}>
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
                        disabled={saveSuccess}
                    />
                ) : (
                    <Box component="span" onClick={() => !saveSuccess && setEditingInvoiceNumber(true)} sx={{ cursor: saveSuccess ? 'default' : 'pointer', borderBottom: '1px dashed #aaa', ml: 1 }}>
                        {invoiceNumber}
                    </Box>
                )}
             </Typography>
             <Typography variant="body2">DT: {new Date().toLocaleDateString('en-GB')}</Typography>
        </Box>
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            To,<br />M/s. {parentOrder.vendor}<br />21, Nilkanth Apartment, Samata Nagar, <br />Pokharan Road No. 1, Thane (W) 400 606
          </Typography>
          <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', textDecoration: 'underline', mb: 1, mt: 2 }}>Work Order</Typography>
          <Typography variant="body2" sx={{ mb: 1 }} fontSize="1.1rem">
            The Following Photography Assignment Is Assigned To Your Agency.
          </Typography>
        </Box>
        <TableContainer sx={{ p: 2, pt: 0 }}>
          <Table size="small" sx={{ border: '1px solid #000' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>Sr.<br />No.</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>Work</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>Qty.</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>Rate</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center' }}>Amount<br />(Rs.)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedItems.map((item, idx) => {
                const amount = calculateItemAmount(item);
                const rate = (item.workMain === '32_GB_Pendrive') ? pricing[item.workMain] : (pricing[item.workMain]?.[item.workSub] || 0);
                const quantity = item.quantity || 1;
                return (
                  <TableRow key={item.id || item._id || idx}>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'center' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      <Typography variant="body2" component="div">{`${item.workMain.replaceAll('_',' ')}`}</Typography>
                      {( <>
                          <Typography variant="body2" component="div">{item.workSub && `Duration : ${item.workSub.replaceAll('_', ' ')}`}</Typography>
                          <Typography variant="body2" component="div">{`dt. ${item.parent?.eventDate ? new Date(item.parent.eventDate).toLocaleDateString('en-GB') : ''}`}</Typography>
                          <Typography variant="body2" component="div">{`For ${item.eventName}`}</Typography>
                          <Typography variant="body2" component="div">{`at ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}`}</Typography>
                      </>)}
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
                  <TableCell sx={{ border: '1px solid #000', width: 100, fontWeight: 'bold' }}>Event</TableCell>
                  <TableCell sx={{ border: '1px solid #000' }}>
                    {selectedItems.length === 1 ? `For ${selectedItems[0].eventName} at ${selectedItems[0].eventVenue === 'Others' ? selectedItems[0].customVenue : selectedItems[0].eventVenue}` : 'For Various events at various places.'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>Date</TableCell>
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
    </Container>
  );
};

export default WorkOrderInvoice;