import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Container, CircularProgress, Alert, TextField, Snackbar, Backdrop, ThemeProvider
} from '@mui/material';

import './WorkOrderInvoice.css';
import invoiceTheme from '../invoiceTheme';
import API, { getCompanyById, createInvoice, updateInvoice } from '../services/api';
import { supabase } from '../supabase';
import { calculateItemAmount, numberToWords, getOrderDateRange } from '../utils/helpers';
import { exportWorkOrderToWord } from '../utils/wordExport';
import { bannerSubs } from '../constants/data';
import { InvoiceSkeleton } from '../components/skeletons';

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
        sx={{ 
          ...sx, 
          p: 0, 
          '& .MuiInputBase-root': { p: 0 }, 
          '& .MuiInputBase-input': { 
            p: 0, 
            wordBreak: 'break-word', 
            overflowWrap: 'anywhere' 
          } 
        }}
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

const computePageSplits = (rowHeights, headerHeight, tableHeadHeight, footerHeight, continuedHeight, maxPageHeight = 1240) => {
  const n = rowHeights.length;
  if (n === 0) return [[]];

  // 1. Check if everything fits cleanly on a single page:
  const singlePageNeeded = headerHeight + tableHeadHeight + rowHeights.reduce((a, b) => a + b, 0) + footerHeight;
  if (singlePageNeeded <= maxPageHeight) {
    return [Array.from({ length: n }, (_, i) => i)];
  }

  const pages = [];
  let currentIndex = 0;

  while (currentIndex < n) {
    const isFirstPage = pages.length === 0;
    const pageItems = [];
    let currentHeight = isFirstPage ? (headerHeight + tableHeadHeight) : tableHeadHeight;

    const remainingCount = n - currentIndex;

    // Check if ALL remaining items fit on this page with the footer:
    let remainingTotalHeight = footerHeight;
    for (let r = currentIndex; r < n; r++) {
      remainingTotalHeight += rowHeights[r];
    }

    if (currentHeight + remainingTotalHeight <= maxPageHeight) {
      // All remaining items fit on this page!
      for (let r = currentIndex; r < n; r++) {
        pageItems.push(r);
      }
      pages.push(pageItems);
      break;
    }

    // Otherwise, this page must continue to the next page.
    // Ensure we leave at least 1 item for the subsequent page.
    const maxItemsThisPage = Math.max(1, remainingCount - 1);

    while (currentIndex < n && pageItems.length < maxItemsThisPage) {
      const nextRowHeight = rowHeights[currentIndex];
      
      // Check if adding nextRowHeight + continuedHeight fits within maxPageHeight:
      if (currentHeight + nextRowHeight + continuedHeight <= maxPageHeight) {
        pageItems.push(currentIndex);
        currentHeight += nextRowHeight;
        currentIndex++;
      } else {
        // Page is full!
        break;
      }
    }

    // Safety fallback: if no item fit, force at least 1 item
    if (pageItems.length === 0) {
      pageItems.push(currentIndex);
      currentIndex++;
    }

    pages.push(pageItems);
  }

  return pages;
};

const getInvoicePages = (items) => {
  const total = items.length;
  // If 4 or fewer items, they fit cleanly on a single page with all totals and signatures
  if (total <= 4) {
    return [items];
  }

  // If 5 to 24 items, standard items can fit cleanly across 2 pages:
  if (total <= 24) {
    const page1Count = Math.min(13, Math.ceil(total / 2));
    return [
      items.slice(0, page1Count),
      items.slice(page1Count)
    ];
  }

  // For 25 or more items:
  // Page 1 gets up to 13 items
  const pages = [items.slice(0, 13)];
  let remaining = items.slice(13);

  while (remaining.length > 0) {
    if (remaining.length <= 13) {
      pages.push(remaining);
      remaining = [];
    } else {
      const chunk = Math.min(15, remaining.length - 2);
      pages.push(remaining.slice(0, chunk));
      remaining = remaining.slice(chunk);
    }
  }

  return pages;
};

const WorkOrderInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const invoiceRef = useRef();

  const [measuredPageSplits, setMeasuredPageSplits] = useState(null);
  const probeHeaderRef = useRef(null);
  const probeTableHeadRef = useRef(null);
  const probeRowsRef = useRef(null);
  const probeFooterRef = useRef(null);
  const probeContinuedRef = useRef(null);

  const { items: rawSelectedItems = [], invoiceType, savedInvoice, isEditing, invoiceId, invoiceNumber: passedInvoiceNumber, invoiceDate: passedInvoiceDate, poNumber: passedPoNumber } = location.state || { items: [] };

  const selectedItems = useMemo(() => {
    const list = Array.isArray(rawSelectedItems) ? [...rawSelectedItems] : [];
    return list.sort((a, b) => {
      const dateA = a.parent?.eventDate || a.eventDate ? new Date(a.parent?.eventDate || a.eventDate).getTime() : 0;
      const dateB = b.parent?.eventDate || b.eventDate ? new Date(b.parent?.eventDate || b.eventDate).getTime() : 0;
      if (dateA !== dateB) {
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB;
      }
      return 0; // preserve incoming order (how they were selected)
    });
  }, [rawSelectedItems]);

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);

  useEffect(() => {
    const entryNos = Array.from(new Set(selectedItems.map(i => i.parent?.entryNumber).filter(Boolean))).join(', ');
    setInvoiceNumber(passedInvoiceNumber || entryNos || '');
    if (passedPoNumber) setPoNumber(passedPoNumber);
    if (passedInvoiceDate) setInvoiceDate(new Date(passedInvoiceDate).toLocaleDateString('en-GB'));
  }, [passedInvoiceNumber, passedPoNumber, passedInvoiceDate, selectedItems]);

  const handleDownload = async () => {
    const pageElements = invoiceRef.current 
      ? invoiceRef.current.querySelectorAll('.invoice-page') 
      : document.querySelectorAll('#generated-invoice .invoice-page');
    if (!pageElements || pageElements.length === 0) return;

    setIsGenerating(true);
    const safeInvoiceNumber = (invoiceNumber || 'preview').toString().replace(/[\/\\?%*:|"<>]/g, '-');
    const filename = `WorkOrder_${safeInvoiceNumber}.pdf`;

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 1000,
          width: 900,
          scrollY: -window.scrollY,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              img {
                display: inline-block !important;
              }
              table, tr, td, th, .MuiTableCell-root {
                vertical-align: middle !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const renderedHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(renderedHeight, pdfHeight));
      }

      pdf.save(filename);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setSnackbar({ open: true, message: 'Failed to generate PDF. Please try again.', severity: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = () => {
    const pageElements = invoiceRef.current 
      ? invoiceRef.current.querySelectorAll('.invoice-page') 
      : document.querySelectorAll('#generated-invoice .invoice-page');
    if (!pageElements || pageElements.length === 0) return;

    let combinedHtml = '';
    pageElements.forEach((pageEl, idx) => {
      combinedHtml += `<div class="word-page">${pageEl.innerHTML}</div>`;
      if (idx < pageElements.length - 1) {
        combinedHtml += '<br clear="all" style="page-break-before: always; mso-break-type: section-break;" />';
      }
    });

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
          .word-page { width: 100%; page-break-after: always; }
        </style>
      </head>
      <body>
        ${combinedHtml}
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
        const gstVal = companyDetails ? companyDetails.gst_number : '';
        const invoicePayload = {
            invoiceNumber,
            invoiceType: invoiceType || 'WorkOrder',
            workItems: selectedItems.map(item => item.id),
            parentOrderInfo: {
                entryNumber: Array.from(new Set(selectedItems.map(i => i.parent?.entryNumber).filter(Boolean))).join(', ') || selectedItems[0]?.parent?.entryNumber,
                vendor: selectedItems[0]?.parent?.vendor
            },
            poNumber: poNumber,
            company_id: parentOrder.company_id || null,
            company_address: companyDetails ? companyDetails.address : '',
            gstNo: gstVal,
            gstno: gstVal,
            recipient: companyDetails ? companyDetails.company_name : parentOrder.vendor
        };
        if (isEditing && invoiceId) {
            await updateInvoice(invoiceId, invoicePayload);
            setSnackbar({ open: true, message: 'Invoice updated successfully!', severity: 'success' });
        } else {
            await createInvoice(invoicePayload);
            setSnackbar({ open: true, message: 'Invoice saved successfully!', severity: 'success' });
        }
        setSaveSuccess(true);
    } catch (error) {
        console.error("Failed to save invoice:", error);
        const serverError = error.response?.data?.error || error.message;
        const msg = Array.isArray(serverError) ? serverError.join(', ') : (typeof serverError === 'string' ? serverError : 'Could not save the invoice. Please try again.');
        setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
        setIsSaving(false);
    }
  };

  const parentOrder = selectedItems[0]?.parent || {};
  const [loadingDetails, setLoadingDetails] = useState(Boolean(parentOrder?.company_id));

  useEffect(() => {
    if (parentOrder && parentOrder.company_id) {
      getCompanyById(parentOrder.company_id)
        .then(response => {
          const compData = response?.data?.data || response?.data;
          if (compData) setCompanyDetails(compData);
        })
        .catch(console.error)
        .finally(() => {
          setLoadingDetails(false);
        });
    } else {
      setLoadingDetails(false);
    }
  }, [parentOrder]);

  const isPO = selectedItems[0]?.poNpo === 'PO';
  const isVidhanMandal = companyDetails?.uses_marathi_labels === true || parentOrder?.companyDetails?.uses_marathi_labels === true || companyDetails?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || parentOrder?.companyDetails?.company_name?.includes('महाराष्ट्र विधान मंडळ सचिवालय') || false;

  useLayoutEffect(() => {
    if (!probeRowsRef.current || selectedItems.length === 0) return;

    const headerH = probeHeaderRef.current ? probeHeaderRef.current.offsetHeight : 420;
    const tableHeadH = probeTableHeadRef.current ? probeTableHeadRef.current.offsetHeight : 40;
    const footerH = probeFooterRef.current ? probeFooterRef.current.offsetHeight : 360;
    const continuedH = probeContinuedRef.current ? probeContinuedRef.current.offsetHeight : 35;
    const rowElements = Array.from(probeRowsRef.current.children);
    const rowHeights = rowElements.map(el => el.offsetHeight || 65);

    const splits = computePageSplits(rowHeights, headerH, tableHeadH, footerH, continuedH, 1230);
    
    setMeasuredPageSplits(prev => {
      if (!prev) return splits;
      if (JSON.stringify(prev) !== JSON.stringify(splits)) {
        return splits;
      }
      return prev;
    });
  }, [selectedItems, isVidhanMandal, companyDetails, isPO, invoiceNumber, invoiceDate, poNumber]);

  const invoicePages = useMemo(() => {
    if (measuredPageSplits && measuredPageSplits.length > 0) {
      return measuredPageSplits.map(indices => indices.map(idx => selectedItems[idx]));
    }
    return getInvoicePages(selectedItems);
  }, [measuredPageSplits, selectedItems]);
  const totalPages = invoicePages.length;

  if (selectedItems.length === 0) {
    return (
        <Container sx={{ textAlign: 'center', mt: 5 }}>
            <Typography variant="h6">No items to display.</Typography>
            <Button sx={{mt: 2}} variant="contained" onClick={() => navigate('/invoices')}>Back to Invoices</Button>
        </Container>
    );
  }

  if (loadingDetails) {
    return <InvoiceSkeleton />;
  }

  const totalAmount = selectedItems.reduce((sum, item) => sum + calculateItemAmount(item, companyDetails), 0);
  const totalWithGst = totalAmount * 1.18;
  const roundedTotal = Math.round(totalWithGst);

  const uniqueEvents = selectedItems.reduce((acc, item) => {
      const dateDisplay = getOrderDateRange(item, isVidhanMandal ? 'ते' : 'to');
      const key = `${item.eventName}-${dateDisplay}`;
      if (!acc.has(key)) {
          acc.set(key, {
              name: `For ${item.eventName} at ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}`,
              date: dateDisplay
          });
      }
      return acc;
  }, new Map());

  const eventDateDetails = Array.from(uniqueEvents.values());
  const uniqueDates = [...new Set(eventDateDetails.map(detail => detail.date))];

  const onDownloadWord = async () => {
    await exportWorkOrderToWord({
      invoicePages,
      selectedItems,
      companyDetails,
      parentOrder,
      invoiceNumber,
      invoiceDate,
      isPO,
      poNumber,
      isVidhanMandal,
      totalAmount,
      totalWithGst,
      roundedTotal,
      uniqueDates
    });
  };

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
                    <Button variant="contained" color="info" onClick={onDownloadWord}>Download Word</Button>
                </>
            )}
        </Box>
      </Box>
      {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>{isEditing ? 'Invoice updated successfully!' : 'Invoice saved successfully!'}</Alert>}

      <ThemeProvider theme={invoiceTheme}>
      <Box id="generated-invoice" ref={invoiceRef}>
        {invoicePages.map((pageItems, pageIdx) => {
          const isFirstPage = pageIdx === 0;
          const isLastPage = pageIdx === totalPages - 1;

          return (
            <Paper
              key={pageIdx}
              className="invoice-page invoice-container"
              sx={{
                p: 0,
                border: '2px solid #000',
                width: '900px',
                minWidth: '900px',
                margin: '0 auto',
                background: '#fff',
                borderRadius: 0,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                fontFamily: 'Arial, sans-serif',
                minHeight: '1273px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}
            >
              {/* TOP CONTENT */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {isFirstPage && (
                  <>
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
                  </>
                )}

                {/* Table of items */}
                <TableContainer sx={{ p: 2, pt: isFirstPage ? 0 : 2.5, pb: 0, backgroundColor: '#fff', boxShadow: 'none' }}>
                  <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse', backgroundColor: '#fff', tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#fff' }}>
                        <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', width: 60, verticalAlign: 'middle' }}>Sr.<br />No.</TableCell>
                        <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', verticalAlign: 'middle' }}>{isVidhanMandal ? 'कामाचे स्वरूप' : 'Work'}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', width: 70, verticalAlign: 'middle' }}>{isVidhanMandal ? 'नग' : 'Qty.'}</TableCell>
                        <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', width: 110, verticalAlign: 'middle' }}>Rate</TableCell>
                        <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', backgroundColor: '#fff', color: '#000', textTransform: 'uppercase', width: 140, verticalAlign: 'middle' }}>{isVidhanMandal ? 'रकम' : 'Amount'}<br />(Rs.)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pageItems.map((item) => {
                        const globalIdx = selectedItems.indexOf(item);
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
                          <TableRow key={item.id || globalIdx} sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                            <TableCell sx={{ border: '1px solid #000', textAlign: 'center', backgroundColor: '#fff', color: '#000', width: 60, verticalAlign: 'middle' }}>{globalIdx + 1}</TableCell>
                            <TableCell sx={{ border: '1px solid #000', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>
                              <Typography variant="body2" component="div" sx={{ color: '#000', fontWeight: 'bold' }}>{item.workMain ? item.workMain.replaceAll('_',' ') : 'N/A'}</Typography>
                              <>
                                  <Typography variant="body2" component="div" sx={{ color: '#000' }}>
                                      {item.workSub && (isVidhanMandal ? `कामाचे प्रकार : ${item.workSub.replaceAll('_', ' ')}` : (item.workMain === 'Photo_Print' || item.workMain === 'Storage' ? `Size : ${item.workSub.replaceAll('_', ' ')}` : `Duration : ${item.workSub.replaceAll('_', ' ')}`))}
                                      {dimensionsText}
                                  </Typography>
                                  <Typography variant="body2" component="div" sx={{ color: '#000' }}>{isVidhanMandal ? `कामाचा दिनांक: ${getOrderDateRange(item, 'ते')}` : `dt. ${getOrderDateRange(item)}`}</Typography>
                                  <Typography variant="body2" component="div" sx={{ color: '#000' }}>{isVidhanMandal ? `कामाचे नांव: ${item.eventName}` : `For ${item.eventName}`}</Typography>
                                  <Typography variant="body2" component="div" sx={{ color: '#000' }}>{isVidhanMandal ? `कामाचे स्थळ: ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}` : `at ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}`}</Typography>
                              </>
                            </TableCell>
                            <TableCell sx={{ border: '1px solid #000', textAlign: 'center', backgroundColor: '#fff', color: '#000', width: 70, verticalAlign: 'middle' }}>{quantity}</TableCell>
                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right', backgroundColor: '#fff', color: '#000', width: 110, verticalAlign: 'middle' }}>{rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell sx={{ border: '1px solid #000', textAlign: 'right', backgroundColor: '#fff', color: '#000', width: 140, verticalAlign: 'middle' }}>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        );
                      })}
                      {!isLastPage && (
                        <TableRow sx={{ backgroundColor: '#fff' }}>
                          <TableCell colSpan={5} sx={{ border: '1px solid #000', textAlign: 'right', py: 1, backgroundColor: '#fcfcfc', color: '#000', fontStyle: 'italic', fontWeight: 'bold' }}>
                            {isVidhanMandal ? `(पुढे चालू - पान ${pageIdx + 2})` : `(Continued on Page ${pageIdx + 2}...)`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* BOTTOM SECTION ONLY ON LAST PAGE */}
                {isLastPage && (
                  <>
                    <Box sx={{ p: 2, pt: 1, pb: 0 }}>
                      <TableContainer sx={{ backgroundColor: '#fff', boxShadow: 'none' }}>
                        <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse', backgroundColor: '#fff', tableLayout: 'fixed', width: '100%' }}>
                          <TableBody>
                              <TableRow sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                                  <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>Total Cost</TableCell>
                                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 140, backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>CGST 9%</TableCell>
                                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 140, backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{(totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>SGST 9%</TableCell>
                                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 140, backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{(totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                                  <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>Total</TableCell>
                                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', width: 140, backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{totalWithGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                                  <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{`Round Up Rs. (${numberToWords(roundedTotal)})`}</TableCell>
                                  <TableCell sx={{ border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', width: 140, backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{roundedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                              </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    <Box sx={{ p: 2, pt: 1, pb: 0 }}>
                      <TableContainer sx={{ backgroundColor: '#fff', boxShadow: 'none' }}>
                        <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                          <TableBody>
                            <TableRow sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                              <TableCell sx={{ border: '1px solid #000', width: 100, fontWeight: 'bold', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{isVidhanMandal ? 'कामाचे नांव' : 'Event'}</TableCell>
                              <TableCell sx={{ border: '1px solid #000', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>
                                {selectedItems.every(item => 
                                    item.eventName === selectedItems[0].eventName && 
                                    item.eventVenue === selectedItems[0].eventVenue && 
                                    item.customVenue === selectedItems[0].customVenue
                                ) 
                                  ? (isVidhanMandal ? `कामाचे नांव ${selectedItems[0].eventName} कामाचे स्थळ ${selectedItems[0].eventVenue === 'Others' ? selectedItems[0].customVenue : selectedItems[0].eventVenue}` : `For ${selectedItems[0].eventName} at ${selectedItems[0].eventVenue === 'Others' ? selectedItems[0].customVenue : selectedItems[0].eventVenue}`) 
                                  : (isVidhanMandal ? 'विविध ठिकाणी विविध कार्यक्रमांसाठी.' : 'For Various events at various places.')}
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff' } }}>
                              <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>{isVidhanMandal ? 'कामाचा दिनांक' : 'Date'}</TableCell>
                              <TableCell sx={{ border: '1px solid #000', backgroundColor: '#fff', color: '#000', verticalAlign: 'middle' }}>
                                {uniqueDates.join(', ')}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    <Box sx={{ p: 2, pt: 1, mt: 16, mb: 4, pr: 4, textAlign: 'center', paddingLeft: '55%' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'Mangal, Arial, sans-serif', fontSize: '1.05rem', lineHeight: 1.6, color: '#000' }}>
                        केलिए<br/>निगमित संचार विभाग<br/>पहिली मंजिल, एनबीपी ग्रीन हाइट्स,<br/>बीकेसी-बांद्रा-ईस्ट-मुंबई
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

            </Paper>
          );
        })}
      </Box>

      {/* Hidden probe container for exact pixel measurement of row and header/footer heights */}
      <Box
        sx={{
          position: 'absolute',
          left: -99999,
          top: -99999,
          width: '900px',
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -999,
        }}
      >
        <Box ref={probeHeaderRef}>
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
              सं. प.अ.क्षे.का./नि.सं./ {invoiceNumber || 'preview'}
            </Typography>
            <Typography variant="body2">DT: {invoiceDate}</Typography>
          </Box>
          <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
              To,{'\n'}{`${parentOrder.vendor || 'Vendor'}\n21, Nilkanth Apartment, Samata Nagar,\nPokharan Road No. 1, Thane (W) 400606`}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Work Order {isPO ? `PO No. ${poNumber}` : ''}</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1 }} fontSize="0.9rem">
              The Following Photography Assignment Is Assigned To Your Agency.
            </Typography>
          </Box>
        </Box>

        <TableContainer sx={{ p: 2, pt: 0, pb: 0 }}>
          <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
            <TableHead ref={probeTableHeadRef}>
              <TableRow>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', width: 60 }}>Sr.<br />No.</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>{isVidhanMandal ? 'कामाचे स्वरूप' : 'Work'}</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', width: 70 }}>{isVidhanMandal ? 'नग' : 'Qty.'}</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', width: 110 }}>Rate</TableCell>
                <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', width: 140 }}>{isVidhanMandal ? 'रकम' : 'Amount'}<br />(Rs.)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody ref={probeRowsRef}>
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
                  <TableRow key={item.id || idx} sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'center', width: 60 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>{item.workMain ? item.workMain.replaceAll('_',' ') : 'N/A'}</Typography>
                      <Typography variant="body2" component="div">
                        {item.workSub && (isVidhanMandal ? `कामाचे प्रकार : ${item.workSub.replaceAll('_', ' ')}` : (item.workMain === 'Photo_Print' || item.workMain === 'Storage' ? `Size : ${item.workSub.replaceAll('_', ' ')}` : `Duration : ${item.workSub.replaceAll('_', ' ')}`))}
                        {dimensionsText}
                      </Typography>
                      <Typography variant="body2" component="div">{isVidhanMandal ? `कामाचा दिनांक: ${getOrderDateRange(item, 'ते')}` : `dt. ${getOrderDateRange(item)}`}</Typography>
                      <Typography variant="body2" component="div">{isVidhanMandal ? `कामाचे नांव: ${item.eventName}` : `For ${item.eventName}`}</Typography>
                      <Typography variant="body2" component="div">{isVidhanMandal ? `कामाचे स्थळ: ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}` : `at ${item.eventVenue === 'Others' ? item.customVenue : item.eventVenue}`}</Typography>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'center', width: 70 }}>{quantity}</TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 110 }}>{rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 140 }}>{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableBody>
              <TableRow ref={probeContinuedRef}>
                <TableCell colSpan={5} sx={{ border: '1px solid #000', textAlign: 'right', py: 1, fontStyle: 'italic', fontWeight: 'bold' }}>
                  {isVidhanMandal ? '(पुढे चालू - पान 2)' : '(Continued on Page 2...)'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box ref={probeFooterRef}>
          <Box sx={{ p: 2, pt: 1, pb: 0 }}>
            <TableContainer sx={{ backgroundColor: '#fff', boxShadow: 'none' }}>
              <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse', backgroundColor: '#fff', tableLayout: 'fixed', width: '100%' }}>
                <TableBody>
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>Total Cost</TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 140 }}>{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>CGST 9%</TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 140 }}>{(totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right' }}>SGST 9%</TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right', width: 140 }}>{(totalAmount * 0.09).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>Total</TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', width: 140 }}>{totalWithGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold', textAlign: 'right' }}>{`Round Up Rs. (${numberToWords(roundedTotal)})`}</TableCell>
                    <TableCell sx={{ border: '1px solid #000', textAlign: 'right', fontWeight: 'bold', width: 140 }}>{roundedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={{ p: 2, pt: 1, pb: 0 }}>
            <TableContainer sx={{ backgroundColor: '#fff', boxShadow: 'none' }}>
              <Table size="small" sx={{ border: '1px solid #000', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                <TableBody>
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', width: 100, fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचे नांव' : 'Event'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      {selectedItems.every(item => 
                          item.eventName === selectedItems[0]?.eventName && 
                          item.eventVenue === selectedItems[0]?.eventVenue && 
                          item.customVenue === selectedItems[0]?.customVenue
                      ) 
                        ? (isVidhanMandal ? `कामाचे नांव ${selectedItems[0]?.eventName} कामाचे स्थळ ${selectedItems[0]?.eventVenue === 'Others' ? selectedItems[0]?.customVenue : selectedItems[0]?.eventVenue}` : `For ${selectedItems[0]?.eventName} at ${selectedItems[0]?.eventVenue === 'Others' ? selectedItems[0]?.customVenue : selectedItems[0]?.eventVenue}`) 
                        : (isVidhanMandal ? 'विविध ठिकाणी विविध कार्यक्रमांसाठी.' : 'For Various events at various places.')}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff' }}>
                    <TableCell sx={{ border: '1px solid #000', fontWeight: 'bold' }}>{isVidhanMandal ? 'कामाचा दिनांक' : 'Date'}</TableCell>
                    <TableCell sx={{ border: '1px solid #000' }}>
                      {uniqueDates.join(', ')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={{ p: 2, pt: 1, mt: 16, mb: 4, pr: 4, textAlign: 'center', paddingLeft: '55%' }}>
            <Typography variant="body2" sx={{ fontFamily: 'Mangal, Arial, sans-serif', fontSize: '1.05rem', lineHeight: 1.6, color: '#000' }}>
              केलिए<br/>निगमित संचार विभाग<br/>पहिली मंजिल, एनबीपी ग्रीन हाइट्स,<br/>बीकेसी-बांद्रा-ईस्ट-मुंबई
            </Typography>
          </Box>
        </Box>
      </Box>
      </ThemeProvider>

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
};

export default WorkOrderInvoice;