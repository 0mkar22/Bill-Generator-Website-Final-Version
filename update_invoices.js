const fs = require('fs');

const filePath = 'bill-generator-gateway/src/pages/WorkOrderInvoice.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update To Section mapping
const searchStr = 'To,{\'\\n\'}{companyDetails ? companyDetails.address : `M/s. ${parentOrder.vendor}\\n21, Nilkanth Apartment, Samata Nagar, Pokharan Road No. 1, Thane (W) 400 606`}';
const replaceStr = 'To,{\'\\n\'}{companyDetails ? companyDetails.company_name + \'\\n\' + companyDetails.address : `M/s. ${parentOrder.vendor}\\n21, Nilkanth Apartment, Samata Nagar, Pokharan Road No. 1, Thane (W) 400 606`}';

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(filePath, content);
