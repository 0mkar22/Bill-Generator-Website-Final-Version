const fs = require('fs');
let content = fs.readFileSync('bill-generator-gateway/src/pages/VendorInvoice.jsx', 'utf8');

content = content.replace(/onClick=\{\(\) => setEditing([A-Za-z]+)\(true\)\}/g, 'onClick={() => !saveSuccess && setEditing(true)}');

content = content.replace(/cursor:\s*'pointer'/g, "cursor: saveSuccess ? 'default' : 'pointer'");

fs.writeFileSync('bill-generator-gateway/src/pages/VendorInvoice.jsx', content);
