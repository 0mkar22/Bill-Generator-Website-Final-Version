const fs = require('fs');
let file = './bill-generator-gateway/src/pages/InvoiceGenerator.jsx';
let content = fs.readFileSync(file, 'utf8');

console.log(content.split("return { ...item, id: uniqueId, parent: order };")[0].slice(-200));
