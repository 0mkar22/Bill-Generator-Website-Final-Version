import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, FormControlLabel, Switch, Typography, Box, Divider } from '@mui/material';
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
          backdrop: { sx: { backgroundColor: 'rgba(9, 9, 11, 0.7)', backdropFilter: 'blur(8px)' } }
        }}
        PaperProps={{ 
          sx: { 
            bgcolor: 'rgba(24, 24, 27, 0.92)', 
            backdropFilter: 'blur(24px)', 
            border: '1px solid rgba(255, 255, 255, 0.10)', 
            minWidth: '400px',
            maxWidth: '600px',
            maxHeight: '90vh',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            overflow: 'hidden'
          } 
        }}
      >
        {/* Lumina subtle top spotlight */}
        <Box sx={{
          position: 'absolute',
          top: -60,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 320,
          height: 120,
          bgcolor: 'rgba(99, 102, 241, 0.15)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
          borderRadius: '50%'
        }} />

        <DialogTitle sx={{ color: '#f4f4f5', fontWeight: 700, letterSpacing: '-0.02em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {editingCompanyId ? 'Edit Company Rates' : 'Add New Company'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Company Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newCompany.company_name}
            onChange={(e) => setNewCompany({...newCompany, company_name: e.target.value})}
            sx={{ mt: 2 }}
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
            InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
          />
          
          <Box sx={{ mt: 2.5, display: 'flex', flexDirection: 'column', gap: 1, p: 2, bgcolor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.20)', borderRadius: '12px' }}>
            <Typography variant="subtitle2" sx={{ color: '#818cf8', fontWeight: 600 }}>Client Specific Settings</Typography>
            <FormControlLabel
              control={<Switch checked={newCompany.is_govt_client || false} onChange={(e) => setNewCompany({...newCompany, is_govt_client: e.target.checked})} color="primary" />}
              label={<Typography variant="body2" sx={{ color: '#f4f4f5' }}>Is Government Client (Requires special handling)</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={newCompany.requires_po_number || false} onChange={(e) => setNewCompany({...newCompany, requires_po_number: e.target.checked})} color="primary" />}
              label={<Typography variant="body2" sx={{ color: '#f4f4f5' }}>Requires PO Number (Mandatory PO fields on invoice)</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={newCompany.uses_marathi_labels || false} onChange={(e) => setNewCompany({...newCompany, uses_marathi_labels: e.target.checked})} color="primary" />}
              label={<Typography variant="body2" sx={{ color: '#f4f4f5' }}>Uses Marathi Labels (Translates invoice fields to Marathi)</Typography>}
            />
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#f4f4f5' }}>Custom Work Rates</Typography>
          
          {Object.keys(newCompany.work_rates).map(key => {
            const rateData = newCompany.work_rates[key];
            
            if (typeof rateData === 'object' && rateData !== null) {
              const subKeys = getFilteredSubWorks(key, newCompany);

              return (
                <Box key={key} sx={{ mb: 2.5, p: 2, border: '1px solid rgba(99, 102, 241, 0.20)', bgcolor: 'rgba(99, 102, 241, 0.04)', borderRadius: '12px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: '#818cf8', textTransform: 'uppercase', fontFamily: '"JetBrains Mono", monospace' }}>
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
                          InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
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
                  InputProps={{ sx: { fontFamily: '"JetBrains Mono", monospace' } }}
                />
              );
            }
          })}

        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Button type="button" onClick={() => setIsCompanyModalOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleSaveCompany} variant="contained" disabled={!newCompany.company_name}>
            {editingCompanyId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    );
};

export default CompanyModal;
