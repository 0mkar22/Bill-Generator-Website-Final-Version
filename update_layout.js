const fs = require('fs');

const filePath = 'bill-generator-gateway/src/components/Layout.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Update AppBar
content = content.replace(
    '<AppBar\n        position="fixed"\n        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}\n      >',
    '<AppBar\n        position="fixed"\n        className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg"\n        sx={{ bgcolor: \'transparent\', boxShadow: \'none\', zIndex: (theme) => theme.zIndex.drawer + 1 }}\n      >'
);

// Update Drawers
content = content.replace(
    'ModalProps={{ keepMounted: true }}\n          sx={{',
    'ModalProps={{ keepMounted: true }}\n          PaperProps={{ sx: { bgcolor: \'rgba(255, 255, 255, 0.1)\', backdropFilter: \'blur(10px)\', borderRight: \'1px solid rgba(255,255,255,0.2)\' } }}\n          sx={{'
);

content = content.replace(
    '<Drawer\n          variant="permanent"\n          sx={{',
    '<Drawer\n          variant="permanent"\n          PaperProps={{ sx: { bgcolor: \'rgba(255, 255, 255, 0.1)\', backdropFilter: \'blur(10px)\', borderRight: \'1px solid rgba(255,255,255,0.2)\' } }}\n          sx={{'
);

fs.writeFileSync(filePath, content);
