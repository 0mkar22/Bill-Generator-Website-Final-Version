import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

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
        <Dialog open={isVenueModalOpen} onClose={() => setIsVenueModalOpen(false)}>
          <DialogTitle>{editingVenueOldName ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Venue Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newVenueText}
              onChange={(e) => setNewVenueText(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
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
