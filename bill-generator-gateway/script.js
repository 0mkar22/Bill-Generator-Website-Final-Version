const fs = require('fs');
const file = 'src/pages/VendorInvoice.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add numberToMarathiWords import
if (!content.includes('numberToMarathiWords')) {
    content = content.replace('numberToWords }', 'numberToWords, numberToMarathiWords }');
}

// 2. Extract DefaultInvoiceLayout JSX
const paperStart = '<Paper ref={invoiceRef} id="generated-bill" className="invoice-container"';
const paperEnd = '</Paper>';
const startIndex = content.indexOf(paperStart);
let endIndex = content.indexOf(paperEnd, startIndex);
if (endIndex > -1) {
    endIndex += paperEnd.length;
}

const originalPaperJSX = content.substring(startIndex, endIndex);

// 3. Create the Vidhan Mandal Layout JSX
const vidhanMandalJSX = \<Paper ref={invoiceRef} id="generated-bill" className="invoice-container" sx={{ p: 0, mt: 3, mb: 3, border: '1px solid #000', background: '#fff', display: 'flex', flexDirection: 'column', width: '900px', minWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
    <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', borderBottom: '1px solid #000', py: 0.5 }}>TAX INVOICE</Typography>
    
    <Box sx={{ display: 'flex', width: '100%', borderBottom: '1px solid #000' }}>
        <Box sx={{ width: '55%', borderRight: '1px solid #000', p: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>प्रति,</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                <EditableField value={recipient} onChange={setRecipient} isEditing={editingRecipient} setEditing={setEditingRecipient} isReadOnly={isReadOnly} />
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                {companyDetails?.address || parentOrder?.companyDetails?.address || ''}
            </Typography>
            <Typography variant="body2" sx={{ mt: 'auto', fontWeight: 'bold' }}>
                GST No. <EditableField value={gstNo} onChange={setGstNo} isEditing={editingGstNo} setEditing={setEditingGstNo} isReadOnly={isReadOnly} />
            </Typography>
        </Box>
        <Box sx={{ width: '45%', p: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <img src="/logo.PNG" alt="Logo" style={{ height: '30px', marginRight: '8px' }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#0056b3' }}>Icomp Systems</Typography>
            </Box>
            <Typography variant="body2">21, Nilkanth Aprtment, Samata Nagar,</Typography>
            <Typography variant="body2">Pokharan Road No. 1, Thane (W) 400 606</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>E-mail : bhogtevijay@gmail.com</Typography>
            
            <Box sx={{ display: 'flex', borderTop: '1px solid #000', mt: 'auto', mx: -1, mb: -1 }}>
                <Box sx={{ flex: 1, borderRight: '1px solid #000', p: 0.5 }}>
                    <Typography variant="body2">Invoice No. : <EditableField value={invoiceNumber} onChange={setInvoiceNumber} isEditing={editingInvoiceNumber} setEditing={setEditingInvoiceNumber} isReadOnly={isReadOnly} /></Typography>
                </Box>
                <Box sx={{ flex: 1, p: 0.5 }}>
                    <Typography variant="body2">Date : <EditableField value={invoiceDate} onChange={setInvoiceDate} isEditing={editingInvoiceDate} setEditing={setEditingInvoiceDate} isReadOnly={isReadOnly} /></Typography>
                </Box>
            </Box>
        </Box>
    </Box>

    <Table size="small" sx={{ '& .MuiTableCell-root': { border: '1px solid #000', p: '2px 4px', fontSize: '0.85rem' } }}>
        <TableBody>
            <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>कक्ष क्रमांक</TableCell>
                <TableCell>{selectedItems[0]?.parent?.roomNumber || 'ई-२'}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>कामाचा दिनांक :</TableCell>
                <TableCell>{
                    (() => {
                        const dates = selectedItems.map(i => i.parent?.eventDate).filter(Boolean).sort();
                        if (dates.length === 0) return 'N/A';
                        if (dates.length === 1) return new Date(dates[0]).toLocaleDateString('en-GB');
                        return \\ ते \\;
                    })()
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

    <Table size="small" sx={{ mt: 0, '& .MuiTableCell-root': { border: '1px solid #000', p: '4px', fontSize: '0.85rem' } }}>
        <TableHead>
            <TableRow sx={{ bgcolor: '#f9f9f9' }}>
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
                const dateStr = item.parent?.eventDate ? new Date(item.parent?.eventDate).toLocaleDateString('en-GB') : '';
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
                    desc = \दि. \ \ \\;
                }

                return (
                    <TableRow key={item.id || idx}>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell>{desc}</TableCell>
                        <TableCell align="center">{item.quantity || 1}</TableCell>
                        <TableCell align="right">{rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                );
            })}
            <TableRow>
                <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>एकूण जीएसटीसह रक्कम रु.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{amountBeforeTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell colSpan={5} sx={{ fontWeight: 'bold' }}>अक्षरी रुपये : {numberToMarathiWords(amountBeforeTax)} फक्त</TableCell>
            </TableRow>
        </TableBody>
    </Table>

    <Box sx={{ display: 'flex', width: '100%', mt: 'auto', border: '1px solid #000', borderTop: 'none' }}>
        <Box sx={{ width: '60%', borderRight: '1px solid #000', p: 0.5, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>GST No. 27ABJPB2133M5ZO</Typography>
            <Typography variant="body2" sx={{ borderBottom: '1px solid #000', pb: 0.5, fontSize: '0.8rem' }}>Pan No. ABJPB2133M</Typography>
            <Typography variant="body2" sx={{ textDecoration: 'underline', fontSize: '0.8rem' }}>Bank Details</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Bank Name : State Bank Of India</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Bank A/C No. : 34238092999</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>Bank IFSC Code : SBIN0013035</Typography>
        </Box>
        <Box sx={{ width: '40%', p: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', borderBottom: '1px solid #000', width: '100%', textAlign: 'center', pb: 0.5 }}>For Icomp Systems</Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ border: '2px solid #8e44ad', borderRadius: '50%', p: 1, color: '#8e44ad', display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2, transform: 'rotate(-10deg)', width: '60px', height: '60px', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>ICOMP</Typography>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>SYSTEMS</Typography>
                    <Typography sx={{ fontSize: '0.5rem' }}>THANE</Typography>
                </Box>
                <Box>
                    <Typography sx={{ fontSize: '0.8rem' }}>Vijay R.</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>Bhogte</Typography>
                    <Typography sx={{ fontSize: '0.8rem' }}>{new Date().toISOString().slice(0,10).replace(/-/g, '.')}</Typography>
                </Box>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 'bold', borderTop: '1px solid #000', width: '100%', textAlign: 'center', pt: 0.5, mt: 'auto' }}>Authorised Signatory</Typography>
        </Box>
    </Box>
</Paper>\;

// 4. Replace in the file
const conditionalJSX = \
        {isVidhanMandal ? (
            \
        ) : (
            \
        )}
\;

content = content.replace(originalPaperJSX, conditionalJSX);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated VendorInvoice.jsx');
