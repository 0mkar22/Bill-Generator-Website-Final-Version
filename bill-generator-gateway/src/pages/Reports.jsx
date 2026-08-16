import React, { useState, useEffect } from 'react';
import {
  Box, Button, Container, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Pagination, CircularProgress, Alert, Grid, Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx-js-style';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import API from '../services/api';
import { calculateItemAmount } from '../utils/helpers';
import { supabase } from '../supabase';

const Reports = () => {
    const navigate = useNavigate();
    const [workItems, setWorkItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [workTypeFilter, setWorkTypeFilter] = useState('');
    const [poNpoFilter, setPoNpoFilter] = useState('');
    const [dynamicVendors, setDynamicVendors] = useState([]);
    const [dynamicCompanies, setDynamicCompanies] = useState([]);
    const [workTypes, setWorkTypes] = useState([]);
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const itemsPerPage = 10;
    const [monthFilter, setMonthFilter] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchWorkOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            let fetchedCompanies = [];
            try {
                const { data: companyData } = await supabase.from('companies').select('*');
                fetchedCompanies = companyData || [];
            } catch (err) {
                console.warn("Could not fetch companies, proceeding without names.", err);
            }

            const response = await API.get('/workOrders');
            let orders = [];
            if (Array.isArray(response.data)) {
                orders = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                orders = response.data.data;
            }
            
            let allWorkTypesForFilter = new Set();

            const groupedWorkItems = [];

            for (const order of orders) {
                try {
                    const companyDetails = fetchedCompanies.find(c => c.id === order.company_id) || null;
                    const companyName = companyDetails ? companyDetails.company_name : 'N/A';

                    let items = [];
                    if (typeof order.workItems === 'string') {
                        try { items = JSON.parse(order.workItems); } catch(e) { items = []; }
                    } else if (Array.isArray(order.workItems)) {
                        items = order.workItems;
                    }

                    if (!Array.isArray(items)) items = [];

                    const dedupedItems = [];
                    const seenItems = new Set();
                    items.forEach(item => {
                        const key = `${item.workMain}-${item.workSub}-${item.customWorkMain}`;
                        if (!seenItems.has(key)) {
                            seenItems.add(key);
                            dedupedItems.push(item);
                            if (item.workMain && typeof item.workMain === 'string') {
                                allWorkTypesForFilter.add(item.workMain);
                            }
                        }
                    });

                    const workMainArr = dedupedItems.map(item => {
                        if (!item || !item.workMain) return 'N/A';
                        if (item.workMain === '32_GB_Pendrive') return '32 GB Pendrive';
                        if (item.workMain === 'Storage') return 'Storage';
                        if (item.workMain === 'Others') return item.customWorkMain || 'Others';
                        return typeof item.workMain === 'string' ? item.workMain.replaceAll('_', ' ') : String(item.workMain);
                    });

                    const workDurationArr = dedupedItems.map(item => {
                        if (!item || !item.workMain) return '—';
                        if (item.workMain === '32_GB_Pendrive') return `Qty: ${item.quantity || 1}`;
                        if (item.workMain === 'Storage') return `${item.workSub || 'N/A'} (Qty: ${item.quantity || 1})`;
                        return item.workSub ? (typeof item.workSub === 'string' ? item.workSub.replaceAll('_', ' ') : String(item.workSub)) : '—';
                    });

                    const workMainDisplay = workMainArr.join(',\n');
                    const workDurationDisplay = workDurationArr.join(',\n');

                    const personnelArr = items.flatMap(item => {
                        let pArr = item.personnel || [];
                        if (typeof pArr === 'string') {
                            try { pArr = JSON.parse(pArr); } catch(e) {}
                        }
                        if (!Array.isArray(pArr)) pArr = [];
                        
                        return pArr.filter(p => p && (p.name || p.number)).map(p => {
                            const pName = p.name ? p.name.trim() : 'Unnamed';
                            const pNum = p.number ? p.number.trim() : '';
                            return `${pName}${pNum ? `\n(${pNum})` : ''}`;
                        });
                    });
                    const uniquePersonnel = [...new Set(personnelArr)].join(',\n') || '—';

                    let totalAmount = 0;
                    try {
                        totalAmount = items.reduce((sum, item) => sum + (calculateItemAmount(item, companyDetails) || 0), 0);
                    } catch (e) {
                        console.warn("Failed to calculate amount for an order", e);
                    }

                    const firstItem = items[0] || {};
                    
                    const cName = firstItem.contactPerson ? firstItem.contactPerson.trim() : '';
                    const cNumber = firstItem.contactNumber ? firstItem.contactNumber.trim() : '';
                    const finalContactDisplay = cName ? `${cName}${cNumber ? `\n(${cNumber})` : ''}` : '—';

                    groupedWorkItems.push({
                        id: order.id || order._id,
                        entryNumber: order.entryNumber || 'N/A',
                        date: order.eventDate || '',
                        vendor: order.vendor || 'N/A',
                        companyName: companyName,
                        eventName: firstItem.eventName || 'N/A',
                        eventVenue: firstItem.eventVenue === 'Others' ? (firstItem.customVenue || 'Others') : (firstItem.eventVenue || 'N/A'),
                        eventTime: firstItem.eventTime || '—',
                        poNpo: firstItem.poNpo || '—',
                        workMainDisplay: workMainDisplay,
                        workDurationDisplay: workDurationDisplay,
                        rawWorkMains: items.map(i => i.workMain).filter(Boolean),
                        personnelDisplay: uniquePersonnel,
                        contactDisplay: finalContactDisplay,
                        amount: totalAmount,
                        fullOrder: order,
                        companyDetails: companyDetails
                    });

                } catch (orderError) {
                    console.error("Skipped a malformed work order:", order, orderError);
                }
            }

            setWorkItems(groupedWorkItems);
            
            const uniqueVendors = [...new Set(groupedWorkItems.map(item => item.vendor).filter(Boolean))];
            const uniqueCompanies = [...new Set(groupedWorkItems.map(item => item.companyName).filter(Boolean))];
            
            setDynamicVendors(uniqueVendors);
            setDynamicCompanies(uniqueCompanies);
            setWorkTypes(Array.from(allWorkTypesForFilter));
        } catch (err) {
            console.error('Error fetching work items completely:', err);
            setError('Failed to fetch work orders. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedItems = () => {
        let sortedItems = [...workItems];
        if (searchTerm) {
            sortedItems = sortedItems.filter(item => {
                const combinedValues = `${Object.values(item).join(' ')}`.toLowerCase();
                return combinedValues.includes(searchTerm.toLowerCase());
            });
        }
        if (monthFilter) {
            sortedItems = sortedItems.filter(item => {
                if (!item.date) return false;
                const itemDate = new Date(item.date);
                const [filterYear, filterMonth] = monthFilter.split('-');
                return (itemDate.getFullYear() === parseInt(filterYear, 10) && itemDate.getMonth() + 1 === parseInt(filterMonth, 10));
            });
        }
        if (companyFilter) {
            sortedItems = sortedItems.filter(item => item.companyName === companyFilter);
        }
        if (vendorFilter) {
            sortedItems = sortedItems.filter(item => item.vendor === vendorFilter);
        }
        if (workTypeFilter) {
            sortedItems = sortedItems.filter(item => item.rawWorkMains.includes(workTypeFilter));
        }
        if (poNpoFilter) {
            sortedItems = sortedItems.filter(item => item.poNpo === poNpoFilter);
        }
        if (sortConfig.key) {
            sortedItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortedItems;
    };

    const handleExportToExcel = () => {
        const filteredItems = getSortedItems();
        const totalAmount = filteredItems.reduce((sum, item) => sum + item.amount, 0);
        const totalAmountWithGst = totalAmount * 1.18;
        const data = filteredItems.map((item, idx) => ({
            'Entry Number': item.entryNumber,
            'Sr. No': idx + 1,
            'Company': item.companyName,
            'Event Date': item.date ? new Date(item.date).toLocaleDateString('en-GB') : '',
            'Vendor': item.vendor,
            'Event Name': item.eventName,
            'Event Venue': item.eventVenue,
            'Event Time': item.eventTime,
            'PO/NPO': item.poNpo || 'N/A',
            'Work Type': item.workMainDisplay,
            'Work Duration': item.workDurationDisplay,
            'Assigned Personnel': item.personnelDisplay,
            'Contact Person': item.contactDisplay,
            'Amount': item.amount,
            'Amount with GST': item.amount * 1.18
        }));
        data.push({ 'Contact Person': 'Total Amount:', 'Amount': totalAmount, 'Amount with GST': totalAmountWithGst });
        
        const ws = XLSX.utils.json_to_sheet(data);

        Object.keys(ws).forEach(key => {
            if (key !== '!ref' && key !== '!margins' && key !== '!cols') {
                ws[key].s = { 
                    alignment: { wrapText: true, vertical: 'center', horizontal: 'left' }
                };
                if (key.replace(/[0-9]/g, '') && key.match(/[0-9]+/)?.[0] === '1') {
                    ws[key].s.font = { bold: true };
                    ws[key].s.fill = { fgColor: { rgb: "EEEEEE" } };
                }
            }
        });

        ws['!cols'] = [
            { wch: 15 }, { wch: 8 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, 
            { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 30 }, 
            { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 18 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Work Orders');
        XLSX.writeFile(wb, 'work_orders_report.xlsx');
    };

    const handleExportToONGCExcel = () => {
        const sortedItems = getSortedItems();
        
        const ongcItems = sortedItems.filter(item => {
            const companyNameStr = (item.companyName || '').toUpperCase();
            return companyNameStr.includes('ONGC') || 
                   companyNameStr.includes('OIL & NATURAL GAS') || 
                   companyNameStr.includes('OIL AND NATURAL GAS');
        });

        const data = ongcItems.map((item, idx) => ({
            'Sr. No': idx + 1,
            'Event Date': item.date ? new Date(item.date).toLocaleDateString('en-GB') : '',
            'Event Name': item.eventName,
            'Event Venue': item.eventVenue,
            'Event Time': item.eventTime,
            'PO/NPO': item.poNpo || 'N/A',
            'Work Type': item.workMainDisplay,
            'Work Duration': item.workDurationDisplay
        }));

        const ws = XLSX.utils.json_to_sheet(data);

        // Force wrap, vertical center, and horizontal center on every single ONGC cell
        Object.keys(ws).forEach(key => {
            if (key !== '!ref' && key !== '!margins' && key !== '!cols') {
                ws[key].s = { 
                    alignment: { wrapText: true, vertical: 'center', horizontal: 'left' }
                };
                if (key.replace(/[0-9]/g, '') && key.match(/[0-9]+/)?.[0] === '1') {
                    ws[key].s.font = { bold: true };
                    ws[key].s.fill = { fgColor: { rgb: "EEEEEE" } };
                }
            }
        });

        ws['!cols'] = [
            { wch: 8 },  // Sr. No
            { wch: 15 }, // Event Date
            { wch: 25 }, // Event Name
            { wch: 35 }, // Event Venue
            { wch: 12 }, // Event Time
            { wch: 10 }, // PO/NPO
            { wch: 25 }, // Work Type
            { wch: 30 }  // Work Duration
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'ONGC Report');
        XLSX.writeFile(wb, 'ONGC_Report.xlsx');
    };

    const handleExportToPDF = () => {
        const filteredItems = getSortedItems();
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Work Orders Report', 14, 18);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
        
        const tableColumn = ["Entry", "Date", "Company", "Vendor", "Event Name", "Work Type", "Work Duration", "Assigned Personnel", "Contact Person", "Amount", "Amount+GST"];
        const tableRows = [];
        filteredItems.forEach((item) => {
            const rowData = [
                item.entryNumber,
                item.date ? new Date(item.date).toLocaleDateString('en-GB') : '',
                item.companyName,
                item.vendor,
                item.eventName,
                item.workMainDisplay,
                item.workDurationDisplay,
                item.personnelDisplay,
                item.contactDisplay,
                `Rs.${item.amount.toLocaleString('en-IN')}`,
                `Rs.${(item.amount * 1.18).toLocaleString('en-IN')}`
            ];
            tableRows.push(rowData);
        });
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] },
            styles: { fontSize: 7, cellPadding: 1.5 },
            columnStyles: { 9: { halign: 'right' }, 10: { halign: 'right' } }
        });
        const totalAmount = filteredItems.reduce((sum, item) => sum + item.amount, 0);
        const totalAmountWithGst = totalAmount * 1.18;
        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Total Amount:', 200, finalY + 8);
        doc.text(`Rs.${totalAmount.toLocaleString('en-IN')}`, 235, finalY + 8);
        doc.text(`Rs.${totalAmountWithGst.toLocaleString('en-IN')}`, 265, finalY + 8);
        doc.save('work_orders_report.pdf');
    };

    const handleEditWorkItem = (item) => {
        navigate('/', { state: { editData: item.fullOrder } });
    };

    const renderTable = () => {
        const sortedItems = getSortedItems();
        const paginatedItems = sortedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
        const totalAmount = sortedItems.reduce((sum, item) => sum + item.amount, 0);
        const totalAmountWithGst = totalAmount * 1.18;

        return (
            <TableContainer component={Paper} sx={{ mt: 2, bgcolor: 'transparent', boxShadow: 'none', overflowX: 'auto', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Table size="small" sx={{ minWidth: 1800, '& .MuiTableCell-root': { border: '1px solid rgba(0, 0, 0, 0.12)' } }}>
                    <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.04)' }}>
                        <TableRow>
                            {['entryNumber', 'date', 'companyName', 'vendor', 'eventName', 'eventVenue', 'eventTime', 'poNpo', 'workMainDisplay', 'workDurationDisplay'].map(key => {
                                let label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                if (key === 'companyName') label = 'Company';
                                if (key === 'workMainDisplay') label = 'Work Type';
                                if (key === 'workDurationDisplay') label = 'Work Duration';

                                return (
                                    <TableCell key={key} onClick={() => handleSort(key)} sx={{ cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                        {label}
                                        {sortConfig.key === key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                    </TableCell>
                                );
                            })}
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Assigned Personnel</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Contact Person</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Amount+GST</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Edit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedItems.map((item, idx) => (
                            <TableRow key={`${item.id}-${idx}`} hover>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.entryNumber}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '—'}</TableCell>
                                <TableCell sx={{ minWidth: 200 }}>{item.companyName}</TableCell>
                                <TableCell sx={{ minWidth: 150 }}>{item.vendor}</TableCell>
                                <TableCell sx={{ minWidth: 150 }}>{item.eventName}</TableCell>
                                <TableCell sx={{ minWidth: 250 }}>{item.eventVenue}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.eventTime}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{item.poNpo}</TableCell>
                                <TableCell sx={{ minWidth: 200, whiteSpace: 'pre-line' }}>{item.workMainDisplay}</TableCell>
                                <TableCell sx={{ minWidth: 250, whiteSpace: 'pre-line' }}>{item.workDurationDisplay}</TableCell>
                                <TableCell sx={{ minWidth: 250, whiteSpace: 'pre-line' }}>{item.personnelDisplay}</TableCell>
                                <TableCell sx={{ minWidth: 200, whiteSpace: 'pre-line' }}>{item.contactDisplay}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>Rs.{item.amount.toLocaleString('en-IN')}</TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>Rs.{(item.amount * 1.18).toLocaleString('en-IN')}</TableCell>
                                <TableCell>
                                    <Button variant="contained" size="small" onClick={() => handleEditWorkItem(item)}>
                                        Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow sx={{ '& > *': { fontWeight: 'bold', fontSize: '1rem', bgcolor: 'rgba(0, 0, 0, 0.02)' } }}>
                            <TableCell colSpan={12} align="right">Total:</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Rs.{totalAmount.toLocaleString('en-IN')}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Rs.{totalAmountWithGst.toLocaleString('en-IN')}</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableBody>
                </Table>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination count={Math.ceil(sortedItems.length / itemsPerPage) || 1} page={page} onChange={(e, value) => setPage(value)} color="primary" />
                </Box>
            </TableContainer>
        );
    };

    return (
        <Container maxWidth="xl">
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>Back</Button>
                    <Typography variant="h4" sx={{ flexGrow: 1, textAlign: 'center' }}>Work Orders Report</Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <TextField fullWidth label="Month" type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth>
                            <InputLabel>Company</InputLabel>
                            <Select value={companyFilter} label="Company" onChange={(e) => setCompanyFilter(e.target.value)}>
                                <MenuItem value="">All</MenuItem>
                                {dynamicCompanies.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth>
                            <InputLabel>Vendor</InputLabel>
                            <Select value={vendorFilter} label="Vendor" onChange={(e) => setVendorFilter(e.target.value)}>
                                <MenuItem value="">All</MenuItem>
                                {dynamicVendors.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <FormControl fullWidth>
                            <InputLabel>Work Type</InputLabel>
                            <Select value={workTypeFilter} label="Work Type" onChange={(e) => setWorkTypeFilter(e.target.value)}>
                                <MenuItem value="">All</MenuItem>
                                {workTypes.map(t => {
                                    const displayLabel = typeof t === 'string' ? t.replaceAll('_', ' ') : String(t);
                                    return <MenuItem key={t} value={t}>{displayLabel}</MenuItem>;
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                        <FormControl fullWidth>
                            <InputLabel>PO/NPO</InputLabel>
                            <Select value={poNpoFilter} label="PO/NPO" onChange={(e) => setPoNpoFilter(e.target.value)}>
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="PO">PO</MenuItem>
                                <MenuItem value="NPO">NPO</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button variant="contained" color="success" startIcon={<FileDownloadIcon />} onClick={handleExportToExcel}>Excel</Button>
                    <Button variant="contained" color="error" startIcon={<FileDownloadIcon />} onClick={handleExportToPDF}>PDF</Button>
                    <Button variant="contained" color="info" startIcon={<FileDownloadIcon />} onClick={handleExportToONGCExcel}>ONGC Excel</Button>
                </Box>
                {loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : renderTable()}
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
                <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Reports;