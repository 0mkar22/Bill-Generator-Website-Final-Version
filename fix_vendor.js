const fs = require('fs');
let content = fs.readFileSync('bill-generator-gateway/src/pages/VendorInvoice.jsx', 'utf8');

content = content.replace(/const \[isSaving, setIsSaving\] = useState\(false\);/g, 'const [isSaving, setIsSaving] = useState(false);\n  const isReadOnly = (savedInvoice && !isEditing) || saveSuccess;');

content = content.replace(/onClick=\{\(\) => setEditing([A-Za-z]+)\(true\)\}/g, 'onClick={() => !isReadOnly && setEditing(true)}');

content = content.replace(/onClick=\{\(\) => !saveSuccess && setEditingInvoiceNumber\(true\)\}/g, 'onClick={() => !isReadOnly && setEditingInvoiceNumber(true)}');

content = content.replace(/cursor: 'pointer'/g, "cursor: isReadOnly ? 'default' : 'pointer'");

content = content.replace(/cursor: saveSuccess \? 'default' : 'pointer'/g, "cursor: isReadOnly ? 'default' : 'pointer'");

fs.writeFileSync('bill-generator-gateway/src/pages/VendorInvoice.jsx', content);
