const fs = require('fs');
let c = fs.readFileSync('bill-generator-gateway/src/pages/InvoiceGenerator.jsx', 'utf8');
console.log(c.split('const selectedItems = ')[1].split(';')[0]);
