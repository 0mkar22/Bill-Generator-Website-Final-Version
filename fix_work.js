const fs = require('fs');
let content = fs.readFileSync('bill-generator-gateway/src/pages/WorkOrderInvoice.jsx', 'utf8');

content = content.replace(/onClick=\{\(\) => !isReadOnly && setEditingInvoiceNumber\(true\)\}/g, "onClick={() => !isReadOnly && setEditingInvoiceNumber(true)}");
content = content.replace(/cursor: isReadOnly \? 'default' : 'pointer'/g, "cursor: isReadOnly ? 'default' : 'pointer'");

fs.writeFileSync('bill-generator-gateway/src/pages/WorkOrderInvoice.jsx', content);
