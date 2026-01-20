import React, { useState } from 'react';
import { Box, Tabs, Tab, Container } from '@mui/material';
import VendorInvoice from './VendorInvoice';
import InvoiceSwitcher from './InvoiceSwitcher';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const InvoicePage = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="invoice tabs">
          <Tab label="Find Work Order Invoice" id="invoice-tab-0" />
          <Tab label="Create Vendor Invoice" id="invoice-tab-1" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <InvoiceSwitcher />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <VendorInvoice />
      </TabPanel>
    </Container>
  );
};

export default InvoicePage;