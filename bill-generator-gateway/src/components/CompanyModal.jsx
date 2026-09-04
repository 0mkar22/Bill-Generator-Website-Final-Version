import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, FormControlLabel, Switch, Typography, Box } from '@mui/material';
import { subWorks, vidhanMandalWorks } from '../constants/data';

const CompanyModal = ({
    isCompanyModalOpen,
    setIsCompanyModalOpen,
    editingCompanyId,
    newCompany,
    setNewCompany,
    handleSaveCompany,
    getFilteredSubWorks
}) => {
    return (
        <Dialog 
        open={isCompanyModalOpen} 
        onClose={() => setIsCompanyModalOpen(false)} 
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0, 0, 0, 0.1)' } }
        }}
        PaperProps={{ 
          sx: { 
            bgcolor: 'rgba(255, 255, 255, 0.4)', 
            backdropFilter: 'blur(16px)', 
            border: '1px solid rgba(255, 255, 255, 0.6)', 
            minWidth: '400px',
            maxWidth: '600px',
            maxHeight: '90vh',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' 
          } 
        }}
      >
        <DialogTitle>{editingCompanyId ? 'Edit Company Rates' : 'Add New Company'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Company Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCompany.company_name}
            onChange={(e) => setNewCompany({...newCompany, company_name: e.target.value})}
          />
          <TextField
            margin="dense"
            label="Address"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newCompany.address}
            onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
          />
          <TextField
            margin="dense"
            label="GST Number"
            type="text"
            fullWidth
            variant="outlined"
            value={newCompany.gst_number}
            onChange={(e) => setNewCompany({...newCompany, gst_number: e.target.value})}
          />
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1, p: 2, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">Client Specific Settings</Typography>
            <FormControlLabel
              control={<Switch checked={newCompany.is_govt_client || false} onChange={(e) => setNewCompany({...newCompany, is_govt_client: e.target.checked})} color="primary" />}
              label="Is Government Client (Requires special handling)"
            />
            <FormControlLabel
              control={<Switch checked={newCompany.requires_po_number || false} onChange={(e) => setNewCompany({...newCompany, requires_po_number: e.target.checked})} color="primary" />}
              label="Requires PO Number (Mandatory PO fields on invoice)"
            />
            <FormControlLabel
              control={<Switch checked={newCompany.uses_marathi_labels || false} onChange={(e) => setNewCompany({...newCompany, uses_marathi_labels: e.target.checked})} color="primary" />}
              label="Uses Marathi Labels (Translates invoice fields to Marathi)"
            />
          </Box>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Custom Work Rates</Typography>
          
          {Object.keys(newCompany.work_rates).map(key => {
            const rateData = newCompany.work_rates[key];
            
            if (typeof rateData === 'object' && rateData !== null) {
              const subKeys = getFilteredSubWorks(key, newCompany);

              return (
                <Box key={key} sx={{ mb: 3, p: 2, borderLeft: '4px solid #1976d2', bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: '0 8px 8px 0' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2', textTransform: 'uppercase' }}>
                    {key.replaceAll('_', ' ')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {subKeys.map(subKey => (
                      <Grid item xs={12} key={subKey}>
                        <TextField
                          label={`${subKey.replaceAll('_', ' ')} Rate`}
                          type="text"
                          inputProps={{ inputMode: 'numeric' }}
                          fullWidth
                          variant="outlined"
                          size="small"
                          value={rateData[subKey] || ''}
                          onChange={(e) => handleRateChange(key, subKey, e.target.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            } else {
              return (
                <TextField
                  key={key}
                  margin="dense"
                  label={`${key.replaceAll('_', ' ')} Rate`}
                  type="text"
                  inputProps={{ inputMode: 'numeric' }}
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={rateData || ''}
                  onChange={(e) => handleRateChange(key, null, e.target.value)}
                  sx={{ mb: 2 }}
                />
              );
            }
          })}

        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button type="button" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleSaveCompany} variant="contained" disabled={!newCompany.company_name}>
            {editingCompanyId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    );
};

export default CompanyModal;
