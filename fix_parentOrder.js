const fs = require('fs');
let file1 = './bill-generator-gateway/src/pages/VendorInvoice.jsx';
let content1 = fs.readFileSync(file1, 'utf8');

// I already added the companyDetails logic relying on parentOrder.company_id.
// It seems parentOrder is selectedItems[0]?.parent.
// Let's check where parentOrder is derived.
console.log("VendorInvoice parentOrder logic:");
console.log(content1.split("const parentOrder =")[1].split(";")[0]);

let file2 = './bill-generator-gateway/src/pages/WorkOrderInvoice.jsx';
let content2 = fs.readFileSync(file2, 'utf8');
console.log("WorkOrderInvoice parentOrder logic:");
console.log(content2.split("const parentOrder =")[1].split(";")[0]);
