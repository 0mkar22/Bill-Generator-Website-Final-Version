import React, { useState, useEffect } from 'react';
import {
  Box, Button, Container, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Pagination, CircularProgress, Alert, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import API from '../services/api';
import { pricing, subWorks, venues, vendors } from '../constants/data';
import { calculateItemAmount, formatDateToYYYYMMDD } from '../utils/helpers';

const Reports = () => {
    const navigate = useNavigate();
    const [workItems, setWorkItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('');
    const [workTypeFilter, setWorkTypeFilter] = useState('');
    const [poNpoFilter, setPoNpoFilter] = useState('');
    const [dynamicVendors, setDynamicVendors] = useState([]);
    const [workTypes, setWorkTypes] = useState([]);
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const itemsPerPage = 10;
    const [monthFilter, setMonthFilter] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editedItemData, setEditedItemData] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchWorkOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await API.get('/workOrders');
            const allWorkItems = (response.data.data || []).flatMap(order =>
                order.workItems.map(item => ({
                    ...item,
                    parentWorkOrderId: order.id,
                    entryNumber: order.entryNumber,
                    date: order.eventDate,
                    vendor: order.vendor
                }))
            );
            setWorkItems(allWorkItems);
            const uniqueVendors = [...new Set(allWorkItems.map(item => item.vendor))];
            const uniqueWorkTypes = [...new Set(allWorkItems.map(item => item.workMain))];
            setDynamicVendors(uniqueVendors);
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

    const getSortedItems = () => {
        let sortedItems = [...workItems];
        if (searchTerm) {
            sortedItems = sortedItems.filter(item => Object.values(item).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase())));
        }
        if (monthFilter) {
            sortedItems = sortedItems.filter(item => {
                if (!item.date) return false;
                const itemDate = new Date(item.date);
                const [filterYear, filterMonth] = monthFilter.split('-');
                return (itemDate.getFullYear() === parseInt(filterYear, 10) && itemDate.getMonth() + 1 === parseInt(filterMonth, 10));
            });
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
            return `${item.workMain.replaceAll('_', ' ')} (Qty: ${item.quantity || 1})`;
        }
        const mainDisplay = item.workMain ? item.workMain.replaceAll('_', ' ') : 'N/A';
        const subDisplay = item.workSub ? item.workSub.replaceAll('_', ' ') : '';
        return subDisplay ? `${mainDisplay} - ${subDisplay}` : mainDisplay;
    };

    const handleExportToExcel = () => {
        const filteredItems = getSortedItems();
        const totalAmount = filteredItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
        const totalAmountWithGst = totalAmount * 1.18;
        const data = filteredItems.map((item, idx) => ({
            'Entry Number': item.entryNumber, 'Sr. No': idx + 1, 'Event Date': new Date(item.date).toLocaleDateString('en-GB'),
            'Vendor': item.vendor, 'Event Name': item.eventName, 'Event Venue': item.eventVenue, 'Event Time': item.eventTime,
            'PO/NPO': item.poNpo,
            'Work Type': getWorkTypeDisplay(item),
            'Contact Person': item.contactPerson, 'Contact Number': item.contactNumber,
            'Amount': calculateItemAmount(item), 'Amount with GST': calculateItemAmount(item) * 1.18
        }));
        data.push({ 'Contact Number': 'Total Amount:', 'Amount': totalAmount, 'Amount with GST': totalAmountWithGst });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Work Orders');
        XLSX.writeFile(wb, 'work_orders_report.xlsx');
    };

    const handleExportToPDF = () => {
        const filteredItems = getSortedItems();
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text('Work Orders Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        const tableColumn = ["Entry No", "Sr. No", "Date", "Vendor", "Event Name", "Venue", "Time", "PO/NPO", "Work Type", "Contact", "Phone", "Amount", "Amount+GST"];
        const tableRows = [];
        filteredItems.forEach((item, idx) => {
            const amount = calculateItemAmount(item);
            const rowData = [
                item.entryNumber, idx + 1, new Date(item.date).toLocaleDateString('en-GB'),
                item.vendor, item.eventName, item.eventVenue, item.eventTime, item.poNpo,
                getWorkTypeDisplay(item),
                item.contactPerson, item.contactNumber,
                `Rs.${amount.toLocaleString('en-IN')}`, `Rs.${(amount * 1.18).toLocaleString('en-IN')}`
            ];
            tableRows.push(rowData);
        });
        doc.autoTable({
            head: [tableColumn], body: tableRows, startY: 35, theme: 'grid',
            headStyles: { fillColor: [22, 160, 133] }, styles: { fontSize: 8, cellPadding: 1.5 },
            columnStyles: { 11: { halign: 'right' }, 12: { halign: 'right' } }
        });
        const totalAmount = filteredItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
        const totalAmountWithGst = totalAmount * 1.18;
        const finalY = doc.lastAutoTable.finalY;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Total Amount:', 200, finalY + 10);
        doc.text(`Rs.${totalAmount.toLocaleString('en-IN')}`, 240, finalY + 10);
        doc.text(`Rs.${totalAmountWithGst.toLocaleString('en-IN')}`, 270, finalY + 10);
        doc.save('work_orders_report.pdf');
    };

    const handleEditWorkItem = (item) => {
        setEditedItemData({ ...item, date: formatDateToYYYYMMDD(item.date) });
        setEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setEditedItemData(null);
    };

    const handleEditInputChange = (event) => {
        const { name, value } = event.target;
        setEditedItemData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (!editedItemData?.id || !editedItemData?.parentWorkOrderId) return;
        try {
            const parentWorkOrderResponse = await API.get(`/workOrders/${editedItemData.parentWorkOrderId}`);
            const parentWorkOrder = parentWorkOrderResponse.data.data;
            const itemIndex = parentWorkOrder.workItems.findIndex(item => item.id === editedItemData.id);
            if (itemIndex === -1) return;
            const updatedWorkItems = [...parentWorkOrder.workItems];
            updatedWorkItems[itemIndex] = { ...updatedWorkItems[itemIndex], ...editedItemData };
            const updatedParentWorkOrder = {
                ...parentWorkOrder,
                workItems: updatedWorkItems,
                eventDate: editedItemData.date || parentWorkOrder.eventDate,
                vendor: editedItemData.vendor || parentWorkOrder.vendor
            };
            await API.put(`/workOrders/${updatedParentWorkOrder.id}`, updatedParentWorkOrder);
            setSnackbar({ open: true, message: 'Work item updated successfully!', severity: 'success' });
            handleCloseEditModal();
            fetchWorkOrders();
        } catch (err) {
            console.error('Error updating work item:', err);
            setSnackbar({ open: true, message: 'Failed to update work item.', severity: 'error' });
        }
    };

    const renderTable = () => {
        const sortedItems = getSortedItems();
        const paginatedItems = sortedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);
        const totalAmount = sortedItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
        const totalAmountWithGst = totalAmount * 1.18;

        return (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {['entryNumber', 'date', 'vendor', 'eventName', 'eventVenue', 'eventTime', 'poNpo', 'workMain', 'contactPerson', 'contactNumber'].map(key => (
                                <TableCell key={key} onClick={() => handleSort(key)} sx={{ cursor: 'pointer' }}>
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    {sortConfig.key === key && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                                </TableCell>
                            ))}
                            <TableCell>Amount</TableCell>
                            <TableCell>Amount+GST</TableCell>
                            <TableCell>Edit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedItems.map((item) => {
                            const amount = calculateItemAmount(item);
                            return (
                                <TableRow key={item.id}>
                                    <TableCell>{item.entryNumber}</TableCell>
                                    <TableCell>{new Date(item.date).toLocaleDateString('en-GB')}</TableCell>
                                    <TableCell>{item.vendor}</TableCell>
                                    <TableCell>{item.eventName}</TableCell>
                                    <TableCell>{item.eventVenue}</TableCell>
                                    <TableCell>{item.eventTime}</TableCell>
                                    <TableCell>{item.poNpo}</TableCell>
                                    <TableCell>{getWorkTypeDisplay(item)}</TableCell>
                                    <TableCell>{item.contactPerson}</TableCell>
                                    <TableCell>{item.contactNumber}</TableCell>
                                    <TableCell>Rs.{amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell>Rs.{(amount * 1.18).toLocaleString('en-IN')}</TableCell>
                                    <TableCell><Button variant="contained" size="small" onClick={() => handleEditWorkItem(item)}>Edit</Button></TableCell>
                                </TableRow>
                            );
                        })}
                        <TableRow sx={{ '& > *': { fontWeight: 'bold', fontSize: '1.1rem' } }}>
                            <TableCell colSpan={10} align="right">Total:</TableCell>
                            <TableCell>Rs.{totalAmount.toLocaleString('en-IN')}</TableCell>
                            <TableCell>Rs.{totalAmountWithGst.toLocaleString('en-IN')}</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableBody>
                </Table>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination count={Math.ceil(sortedItems.length / itemsPerPage)} page={page} onChange={(e, value) => setPage(value)} color="primary" />
                </Box>
            </TableContainer>
        );
    };

    return (
        <Container maxWidth="xl">
            <Paper sx={{ p: 3, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>Back</Button>
                    <Typography variant="h4" sx={{ flexGrow: 1, textAlign: 'center' }}>Work Orders Report</Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={3}><TextField fullWidth label="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></Grid>
                    <Grid item xs={12} sm={2}><TextField fullWidth label="Month" type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} sm={2}><FormControl fullWidth><InputLabel>Vendor</InputLabel><Select value={vendorFilter} label="Vendor" onChange={(e) => setVendorFilter(e.target.value)}><MenuItem value="">All</MenuItem>{dynamicVendors.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={3}><FormControl fullWidth><InputLabel>Work Type</InputLabel><Select value={workTypeFilter} label="Work Type" onChange={(e) => setWorkTypeFilter(e.target.value)}><MenuItem value="">All</MenuItem>{workTypes.map(t => <MenuItem key={t} value={t}>{t.replaceAll('_', ' ')}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={2}>
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

            <Dialog open={editModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
                <DialogTitle>Edit Work Item</DialogTitle>
                <DialogContent>
                    {editedItemData && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Entry Number" name="entryNumber" value={editedItemData.entryNumber || ''} onChange={handleEditInputChange} /></Grid>
                            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Vendor</InputLabel><Select label="Vendor" name="vendor" value={editedItemData.vendor || ''} onChange={handleEditInputChange}>{dynamicVendors.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</Select></FormControl></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Event Name" name="eventName" value={editedItemData.eventName || ''} onChange={handleEditInputChange} /></Grid>
                            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>PO/NPO</InputLabel><Select label="PO/NPO" name="poNpo" value={editedItemData.poNpo || 'PO'} onChange={handleEditInputChange}><MenuItem value="PO">PO</MenuItem><MenuItem value="NPO">NPO</MenuItem></Select></FormControl></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Event Time" type="time" name="eventTime" value={editedItemData.eventTime || ''} onChange={handleEditInputChange} InputLabelProps={{ shrink: true }} /></Grid>
                            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Event Venue</InputLabel><Select label="Event Venue" name="eventVenue" value={editedItemData.eventVenue || ''} onChange={handleEditInputChange}>{venues.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}</Select></FormControl></Grid>
                            {editedItemData.eventVenue === 'Others' && <Grid item xs={12}><TextField fullWidth label="Custom Venue" name="customVenue" value={editedItemData.customVenue || ''} onChange={handleEditInputChange} /></Grid>}
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Contact Person" name="contactPerson" value={editedItemData.contactPerson || ''} onChange={handleEditInputChange} /></Grid>
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Contact Number" name="contactNumber" value={editedItemData.contactNumber || ''} onChange={handleEditInputChange} /></Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Work Name</InputLabel>
                                    <Select label="Work Name" name="workMain" value={editedItemData.workMain || ''} onChange={handleEditInputChange}>
                                        <MenuItem value="Still_Photography">Still Photography</MenuItem>
                                        <MenuItem value="Videography">Videography</MenuItem>
                                        <MenuItem value="Two_Camera_Setup">Two Video Cameras Live Setup</MenuItem>
                                        <MenuItem value="Three_Camera_Setup">Three Video Cameras Live Setup</MenuItem>
                                        <MenuItem value="Live_Telecast">Live Telecast Setup</MenuItem>
                                        <MenuItem value="32_GB_Pendrive">32 GB Pendrive</MenuItem>
                                        <MenuItem value="Others">Others</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            {editedItemData.workMain === '32_GB_Pendrive' ? (
                                <Grid item xs={12} sm={6}>
                                    <TextField name="quantity" label="Quantity" type="number" fullWidth value={editedItemData.quantity || 1} onChange={handleEditInputChange} />
                                </Grid>
                            ) : editedItemData.workMain === 'Others' ? (
                                <Grid item xs={12} sm={6}><TextField fullWidth label="Custom Work Name" name="customWorkMain" value={editedItemData.customWorkMain || ''} onChange={handleEditInputChange} /></Grid>
                            ) : (
                                <Grid item xs={12} sm={6}><FormControl fullWidth disabled={!editedItemData.workMain}><InputLabel>Work Subcategory</InputLabel><Select label="Work Subcategory" name="workSub" value={editedItemData.workSub || ''} onChange={handleEditInputChange}>{(subWorks[editedItemData.workMain] || []).map(sub => <MenuItem key={sub} value={sub}>{sub.replaceAll('_', ' ')}</MenuItem>)}</Select></FormControl></Grid>
                            )}
                            <Grid item xs={12} sm={6}><TextField fullWidth label="Event Date" type="date" name="date" value={editedItemData.date || ''} onChange={handleEditInputChange} InputLabelProps={{ shrink: true }} /></Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditModal}>Cancel</Button>
                    <Button variant="contained" onClick={handleSaveChanges}>Save Changes</Button>
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

export default Reports;
