const fs = require('fs');

const filePath = 'bill-generator-gateway/src/pages/WorkOrder.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update Container
content = content.replace(
    '<Container component={Paper} sx={{ p: 4, mt: 4 }}>',
    '<Container component={Paper} sx={{ p: 4, mt: 4, bgcolor: \'rgba(255, 255, 255, 0.2)\', backdropFilter: \'blur(16px)\', border: \'1px solid rgba(255, 255, 255, 0.3)\', boxShadow: \'0 4px 30px rgba(0, 0, 0, 0.1)\' }}>'
);

// Update Dialog
content = content.replace(
    '<Dialog open={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)}>',
    '<Dialog open={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} PaperProps={{ sx: { bgcolor: \'rgba(255, 255, 255, 0.2)\', backdropFilter: \'blur(16px)\', border: \'1px solid rgba(255, 255, 255, 0.3)\' } }}>'
);

fs.writeFileSync(filePath, content);
