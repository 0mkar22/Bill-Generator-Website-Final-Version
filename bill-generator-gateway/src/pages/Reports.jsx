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
import * as XLSX from 'xlsx';
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

            const { data: companyData } = await supabase.from('companies').select('*');
            const fetchedCompanies = companyData || [];

            const response = await API.get('/workOrders');
            const allWorkItems = (response.data.data || []).flatMap(order => {
                const companyDetails = fetchedCompanies.find(c => c.id === order.company_id) || null;
                const companyName = companyDetails ? companyDetails.company_name : 'N/A';

                return (order.workItems || []).map(item => ({
                    ...item,
                    parentWorkOrderId: order.id,
                    entryNumber: order.entryNumber,
                    date: order.eventDate,
                    vendor: order.vendor,
                    companyName: companyName,
                    fullOrder: order,
                    companyDetails: companyDetails
                }));
            });
            
            setWorkItems(allWorkItems);
            const uniqueVendors = [...new Set(allWorkItems.map(item => item.vendor).filter(Boolean))];
            const uniqueCompanies = [...new Set(allWorkItems.map(item => item.companyName).filter(Boolean))];
            const uniqueWorkTypes = [...new Set(allWorkItems.map(item => item.workMain).filter(Boolean))];
            
            setDynamicVendors(uniqueVendors);
            setDynamicCompanies(uniqueCompanies);
            setWorkTypes(uniqueWorkTypes);
        } catch (err) {
            console.error('Error fetching work items:', err);
            setError('Failed to fetch work orders. Please try again.');
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

    const getPersonnelDisplay = (item) => {
        if (!item.personnel || item.personnel.length === 0) return '—';
        const formatted = item.personnel
            .filter(p => p.name || p.number)
            .map(p => `${p.name || 'Unnamed'}${p.number ? ` (${p.number})` : ''}`);
        return formatted.length > 0 ? formatted.join(', ') : '—';
    };

    const getSortedItems = () => {
        let sortedItems = [...workItems];
        if (searchTerm) {
            sortedItems = sortedItems.filter(item => {
                const personnelStr = (item.personnel || []).map(p => `${p.name} ${p.number}`).join(' ');
                const combinedValues = `${Object.values(item).join(' ')} ${personnelStr}`.toLowerCase();
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
            sortedItems = sortedItems.filter(item => item.workMain === workTypeFilter);
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

    const getWorkTypeDisplay = (item) => {
        if (item.workMain === '32_GB_Pendrive') {
            return `32 GB Pendrive (Qty: ${item.quantity || 1})`;
        }
        if (item.workMain === 'Storage') {
            return `Storage - ${item.workSub || 'N/A'} (Qty: ${item.quantity || 1})`;
        }
        if (item.workMain === 'Others') {
            return item.customWorkMain || 'Others';
        }
        const mainDisplay = item.workMain ? item.workMain.replaceAll('_', ' ') : 'N/A';
        const subDisplay = item.workSub ? item.workSub.replaceAll('_', ' ') : '';
        return subDisplay ? `${mainDisplay} - ${subDisplay}` : mainDisplay;
    };

    const handleExportToExcel = () => {
        const filteredItems = getSortedItems();
        const totalAmount = filteredItems.reduce((sum, item) => sum + calculateItemAmount(item, item.companyDetails), 0);
        const totalAmountWithGst = totalAmount * 1.18;
        const data = filteredItems.map((item, idx) => ({
            'Entry Number': item.entryNumber,
            'Sr. No': idx + 1,
            'Company': item.companyName,
            'Event Date': item.date ? new Date(item.date).toLocaleDateString('en-GB') : '',
            'Vendor': item.vendor,
            'Event Name': item.eventName,
            'Event Venue': item.eventVenue === 'Others' ? (item.customVenue || 'Others') : item.eventVenue,
            'Event Time': item.eventTime,
            'PO/NPO': item.poNpo || 'N/A',
            'Work Type': getWorkTypeDisplay(item),
            'Assigned Personnel': getPersonnelDisplay(item),
            'Contact Person': item.contactPerson ? `${item.contactPerson} ${item.contactNumber ? `(${item.contactNumber})` : ''}` : '—',
            'Amount': calculateItemAmount(item, item.companyDetails),
            'Amount with GST': calculateItemAmount(item, item.companyDetails) * 1.18
        }));
        data.push({ 'Contact Person': 'Total Amount:', 'Amount': totalAmount, 'Amount with GST': totalAmountWithGst });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Work Orders');
        XLSX.writeFile(wb, 'work_orders_report.xlsx');
    };

    const handleExportToPDF = () => {
        const filteredItems = getSortedItems();
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Work Orders Report', 14, 18);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
        
        const tableColumn = ["Entry", "Date", "Company", "Vendor", "Event Name", "Work Type", "Assigned Personnel", "Contact Person", "Amount", "Amount+GST"];
        const tableRows = [];
        filteredItems.forEach((item) => {
            const amount = calculateItemAmount(item, item.companyDetails);
            const rowData = [
                item.entryNumber,
                item.date ? new Date(item.date).toLocaleDateString('en-GB') : '',
                item.companyName,
                item.vendor,
                item.eventName,
                getWorkTypeDisplay(item),
                getPersonnelDisplay(item),
                item.contactPerson ? `${item.contactPerson} ${item.contactNumber ? `(${item.contactNumber})` : ''}` : '—',
                `Rs.${amount.toLocaleString('en-IN')}`,
                `Rs.${(amount * 1.18).toLocaleString('en-IN')}`
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
            columnStyles: { 8: { halign: 'right' }, 9: { halign: 'right' } }
        });
        const totalAmount = filteredItems.reduce((sum, item) => sum + calculateItemAmount(item, item.companyDetails), 0);
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
        const totalAmount = sortedItems.reduce((sum, item) => sum + calculateItemAmount(item, item.companyDetails), 0);
        const totalAmountWithGst = totalAmount * 1.18;

        return (
            <TableContainer component={Paper} sx={{ mt: 2, bgcolor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {['entryNumber', 'date', 'companyName', 'vendor', 'eventName', 'eventVenue', 'eventTime', 'poNpo', 'workMain'].map(key => (
                                <TableCell key={key} onClick={() => handleSort(key)} sx={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                    {key === 'companyName' ? 'Company' : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    {sortConfig.key === key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                            ))}
                            <TableCell sx={{ fontWeight: 'bold' }}>Assigned Personnel</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Contact Person</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Amount+GST</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Edit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedItems.map((item, idx) => {
                            const amount = calculateItemAmount(item, item.companyDetails);
                            return (
                                <TableRow key={`${item.parentWorkOrderId || ''}-${idx}`}>
                                    <TableCell>{item.entryNumber}</TableCell>
                                    <TableCell>{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '—'}</TableCell>
                                    <TableCell>{item.companyName}</TableCell>
                                    <TableCell>{item.vendor}</TableCell>
                                    <TableCell>{item.eventName}</TableCell>
                                    <TableCell>{item.eventVenue === 'Others' ? (item.customVenue || 'Others') : item.eventVenue}</TableCell>
                                    <TableCell>{item.eventTime}</TableCell>
                                    <TableCell>{item.poNpo || '—'}</TableCell>
                                    <TableCell>{getWorkTypeDisplay(item)}</TableCell>
                                    <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                        {getPersonnelDisplay(item)}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>
                                        {item.contactPerson ? `${item.contactPerson} ${item.contactNumber ? `(${item.contactNumber})` : ''}` : '—'}
                                    </TableCell>
                                    <TableCell>Rs.{amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell>Rs.{(amount * 1.18).toLocaleString('en-IN')}</TableCell>
                                    <TableCell>
                                        <Button variant="contained" size="small" onClick={() => handleEditWorkItem(item)}>
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow sx={{ '& > *': { fontWeight: 'bold', fontSize: '1rem' } }}>
                            <TableCell colSpan={11} align="right">Total:</TableCell>
                            <TableCell>Rs.{totalAmount.toLocaleString('en-IN')}</TableCell>
                            <TableCell>Rs.{totalAmountWithGst.toLocaleString('en-IN')}</TableCell>
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
                                {workTypes.map(t => <MenuItem key={t} value={t}>{t.replaceAll('_', ' ')}</MenuItem>)}
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