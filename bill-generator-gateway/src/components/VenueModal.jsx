import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box } from '@mui/material';

const VenueModal = ({
    isVenueModalOpen,
    setIsVenueModalOpen,
    editingVenueOldName,
    newVenueText,
    setNewVenueText,
    setLocalVenues,
    venues,
    formData,
    handleWorkItemChange,
    setEditingVenueOldName
}) => {
    return (
        <Dialog 
          open={isVenueModalOpen} 
          onClose={() => setIsVenueModalOpen(false)}
          slotProps={{
            backdrop: { sx: { backgroundColor: 'rgba(9, 9, 11, 0.7)', backdropFilter: 'blur(8px)' } }
          }}
          PaperProps={{
            sx: {
              bgcolor: 'rgba(24, 24, 27, 0.92)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              borderRadius: '16px',
              minWidth: '360px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              position: 'relative',
              overflow: 'hidden'
            }
          }}
        >
          {/* Lumina subtle top spotlight */}
          <Box sx={{
            position: 'absolute',
            top: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 250,
            height: 100,
            bgcolor: 'rgba(99, 102, 241, 0.15)',
            filter: 'blur(35px)',
            pointerEvents: 'none',
            borderRadius: '50%'
          }} />

          <DialogTitle sx={{ color: '#f4f4f5', fontWeight: 700, letterSpacing: '-0.02em', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {editingVenueOldName ? 'Edit Venue' : 'Add New Venue'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Venue Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newVenueText}
              onChange={(e) => setNewVenueText(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Button onClick={() => setIsVenueModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
                const val = newVenueText.trim();
                if (val) {
                    setLocalVenues(prev => {
                        let newList;
                        if (editingVenueOldName) {
                            newList = prev.map(v => v === editingVenueOldName ? val : v);
                        } else {
                            newList = [...prev, val];
                        }
                        newList = Array.from(new Set(newList));
                        
                        const customOnly = newList.filter(v => !venues.includes(v));
                        localStorage.setItem('customVenues', JSON.stringify(customOnly));
                        
                        return newList;
                    });
                    
                    if (!editingVenueOldName || formData.workItems[0].eventVenue === editingVenueOldName) {
                        handleWorkItemChange(0, { target: { name: 'eventVenue', value: val } });
                    }
                }
                setIsVenueModalOpen(false);
                setNewVenueText('');
                setEditingVenueOldName(null);
            }} variant="contained" disabled={!newVenueText.trim()}>
              {editingVenueOldName ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
    );
};

export default VenueModal;
