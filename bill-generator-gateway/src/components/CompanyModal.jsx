import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, 
  FormControlLabel, Switch, Typography, Box, Divider, CircularProgress, 
  IconButton, Tooltip 
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const generateId = (prefix = 'id') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const CompanyModal = ({
    isCompanyModalOpen,
    setIsCompanyModalOpen,
    editingCompanyId,
    newCompany,
    setNewCompany,
    handleSaveCompany,
    savingCompany = false
}) => {
    const [categories, setCategories] = useState([]);
    const isSyncingRef = useRef(false);

    // Convert raw work_rates object into structured categories state
    const parseWorkRatesToCategories = (ratesObj) => {
        if (!ratesObj || typeof ratesObj !== 'object') return [];
        return Object.keys(ratesObj).map(catKey => {
            const rateData = ratesObj[catKey];
            if (typeof rateData === 'object' && rateData !== null) {
                const subKeys = Object.keys(rateData);
                return {
                    id: generateId('cat'),
                    name: catKey.replaceAll('_', ' '),
                    subs: subKeys.map(subKey => ({
                        id: generateId('sub'),
                        name: subKey.replaceAll('_', ' '),
                        rate: rateData[subKey] !== undefined && rateData[subKey] !== null ? String(rateData[subKey]) : ''
                    }))
                };
            } else {
                return {
                    id: generateId('cat'),
                    name: catKey.replaceAll('_', ' '),
                    subs: [
                        {
                            id: generateId('sub'),
                            name: 'Standard',
                            rate: rateData !== undefined && rateData !== null ? String(rateData) : ''
                        }
                    ]
                };
            }
        });
    };

    // Serialize structured categories state back to work_rates object
    const serializeCategories = (cats) => {
        const result = {};
        cats.forEach(cat => {
            const catName = (cat.name || '').trim();
            if (!catName) return;
            const catKey = catName.replace(/\s+/g, '_');
            result[catKey] = {};
            (cat.subs || []).forEach(sub => {
                const subName = (sub.name || '').trim();
                if (!subName) return;
                const subKey = subName.replace(/\s+/g, '_');
                result[catKey][subKey] = sub.rate === '' ? '' : Number(sub.rate);
            });
        });
        return result;
    };

    // Synchronize local changes to parent newCompany.work_rates
    const syncToParent = (updatedCategories) => {
        isSyncingRef.current = true;
        const serialized = serializeCategories(updatedCategories);
        setNewCompany(prev => ({
            ...prev,
            work_rates: serialized
        }));
    };

    // Initialize or refresh categories whenever the modal opens or external rates change
    useEffect(() => {
        if (isSyncingRef.current) {
            isSyncingRef.current = false;
            return;
        }
        if (isCompanyModalOpen) {
            const parsed = parseWorkRatesToCategories(newCompany.work_rates);
            setCategories(parsed);
        }
    }, [isCompanyModalOpen, newCompany.work_rates]);

    const handleCategoryNameChange = (catId, newName) => {
        setCategories(prev => {
            const updated = prev.map(c => c.id === catId ? { ...c, name: newName } : c);
            syncToParent(updated);
            return updated;
        });
    };

    const handleDeleteCategory = (catId) => {
        setCategories(prev => {
            const updated = prev.filter(c => c.id !== catId);
            syncToParent(updated);
            return updated;
        });
    };

    const handleAddCategory = () => {
        setCategories(prev => {
            const newCat = {
                id: generateId('cat'),
                name: '',
                subs: [
                    { id: generateId('sub'), name: '', rate: '' }
                ]
            };
            const updated = [...prev, newCat];
            syncToParent(updated);
            return updated;
        });
    };

    const handleSubNameChange = (catId, subId, newName) => {
        setCategories(prev => {
            const updated = prev.map(c => {
                if (c.id !== catId) return c;
                return {
                    ...c,
                    subs: c.subs.map(s => s.id === subId ? { ...s, name: newName } : s)
                };
            });
            syncToParent(updated);
            return updated;
        });
    };

    const handleSubRateChange = (catId, subId, newRate) => {
        const cleanRate = newRate.replace(/[^0-9.]/g, '');
        setCategories(prev => {
            const updated = prev.map(c => {
                if (c.id !== catId) return c;
                return {
                    ...c,
                    subs: c.subs.map(s => s.id === subId ? { ...s, rate: cleanRate } : s)
                };
            });
            syncToParent(updated);
            return updated;
        });
    };

    const handleAddSubcategory = (catId) => {
        setCategories(prev => {
            const updated = prev.map(c => {
                if (c.id !== catId) return c;
                return {
                    ...c,
                    subs: [...c.subs, { id: generateId('sub'), name: '', rate: '' }]
                };
            });
            syncToParent(updated);
            return updated;
        });
    };

    const handleDeleteSubcategory = (catId, subId) => {
        setCategories(prev => {
            const updated = prev.map(c => {
                if (c.id !== catId) return c;
                return {
                    ...c,
                    subs: c.subs.filter(s => s.id !== subId)
                };
            });
            syncToParent(updated);
            return updated;
        });
    };

    const onSaveClick = (e) => {
        const serialized = serializeCategories(categories);
        handleSaveCompany(e, serialized);
    };

    return (
        <Dialog 
          open={isCompanyModalOpen} 
          onClose={() => setIsCompanyModalOpen(false)} 
          slotProps={{
            backdrop: { sx: { backgroundColor: 'rgba(9, 9, 11, 0.7)', backdropFilter: 'blur(8px)' } }
          }}
          PaperProps={{ 
            sx: { 
              bgcolor: 'rgba(24, 24, 27, 0.95)', 
              backdropFilter: 'blur(24px)', 
              border: '1px solid rgba(255, 255, 255, 0.10)', 
              minWidth: { xs: '90vw', sm: '550px' },
              maxWidth: '680px',
              maxHeight: '90vh',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              position: 'relative',
              overflow: 'hidden'
            } 
          }}
        >
          {/* Subtle spotlight glow */}
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
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Company Name"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              minRows={1}
              maxRows={4}
              value={newCompany.company_name}
              onChange={(e) => setNewCompany({...newCompany, company_name: e.target.value})}
              sx={{ 
                mt: 2,
                '& .MuiInputBase-input': {
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }
              }}
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
              sx={{
                '& .MuiInputBase-input': {
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }
              }}
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
            
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#f4f4f5' }}>Custom Work Rates</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Edit work names and subcategories or add completely new ones. Rates are in ₹.
                </Typography>
              </Box>
            </Box>

            {categories.map((cat, catIdx) => (
              <Box 
                key={cat.id} 
                sx={{ 
                  mb: 2.5, 
                  p: 2, 
                  border: '1px solid rgba(99, 102, 241, 0.25)', 
                  bgcolor: 'rgba(99, 102, 241, 0.04)', 
                  borderRadius: '12px',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: 'rgba(99, 102, 241, 0.40)'
                  }
                }}
              >
                {/* Category Header: Work Name input + Delete category */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                    #{catIdx + 1}
                  </Typography>
                  <TextField
                    label="Work Name (Category)"
                    size="small"
                    fullWidth
                    value={cat.name}
                    onChange={(e) => handleCategoryNameChange(cat.id, e.target.value)}
                    placeholder="e.g. Still Photography, Drone Shoot..."
                    InputProps={{ 
                      sx: { 
                        fontFamily: '"JetBrains Mono", monospace', 
                        fontWeight: 600, 
                        color: '#f4f4f5',
                        fontSize: '0.9rem' 
                      } 
                    }}
                    InputLabelProps={{ sx: { color: '#818cf8' } }}
                  />
                  <Tooltip title="Delete this Work Category">
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteCategory(cat.id)}
                      sx={{ 
                        color: '#ef4444', 
                        border: '1px solid rgba(239, 68, 68, 0.25)', 
                        borderRadius: '8px',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Subcategories list */}
                <Typography variant="caption" sx={{ color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                  Subcategories & Rates
                </Typography>

                {cat.subs.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 1 }}>
                    No subcategories. Click below to add one.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    {cat.subs.map(sub => (
                      <Box key={sub.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <TextField
                          label="Subcategory Name"
                          size="small"
                          value={sub.name}
                          onChange={(e) => handleSubNameChange(cat.id, sub.id, e.target.value)}
                          placeholder="e.g. Mumbai Half Day, 32GB, etc."
                          sx={{ 
                            flex: 2,
                            '& .MuiInputBase-input': { fontSize: '0.875rem' }
                          }}
                        />
                        <TextField
                          label="Rate (₹)"
                          size="small"
                          type="text"
                          inputProps={{ inputMode: 'numeric' }}
                          value={sub.rate}
                          onChange={(e) => handleSubRateChange(cat.id, sub.id, e.target.value)}
                          placeholder="0"
                          sx={{ 
                            flex: 1,
                            '& .MuiInputBase-input': { 
                              fontFamily: '"JetBrains Mono", monospace',
                              fontSize: '0.875rem'
                            }
                          }}
                        />
                        <Tooltip title="Delete Subcategory">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteSubcategory(cat.id, sub.id)}
                            sx={{ color: '#ef4444', p: 0.75 }}
                          >
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ))}
                  </Box>
                )}

                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon fontSize="small" />}
                  onClick={() => handleAddSubcategory(cat.id)}
                  sx={{ 
                    mt: 1.5, 
                    color: '#818cf8', 
                    textTransform: 'none', 
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' }
                  }}
                >
                  + Add Subcategory
                </Button>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleAddCategory}
              fullWidth
              sx={{
                mt: 1,
                mb: 2,
                py: 1.2,
                borderStyle: 'dashed',
                borderWidth: '1.5px',
                borderColor: 'rgba(99, 102, 241, 0.40)',
                color: '#818cf8',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                '&:hover': {
                  borderColor: '#818cf8',
                  bgcolor: 'rgba(99, 102, 241, 0.08)'
                }
              }}
            >
              + Add New Work Category
            </Button>

          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Button type="button" onClick={() => setIsCompanyModalOpen(false)} disabled={savingCompany}>Cancel</Button>
            <Button type="button" onClick={onSaveClick} variant="contained" disabled={!newCompany.company_name || savingCompany}>
              {savingCompany ? <CircularProgress size={20} color="inherit" /> : (editingCompanyId ? 'Update' : 'Save')}
            </Button>
          </DialogActions>
        </Dialog>
    );
};

export default CompanyModal;
