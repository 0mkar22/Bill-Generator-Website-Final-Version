import React from 'react';
import { 
    Accordion, AccordionSummary, AccordionDetails, Box, Typography, IconButton, Grid, Divider, 
    FormControl, InputLabel, Select, MenuItem, TextField, Button, Autocomplete
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { noPersonnelWorks, bannerSubs, vidhanMandalWorks, subWorks, venues } from '../constants/data';
import { calculateItemAmount } from '../utils/helpers';

const WorkOrderItem = ({
    item, index, expandedItem, setExpandedItem, formData,
    handleWorkItemChange, handleMainChange, removeWorkItem,
    isVidhanMandalSelected, selectedCompany, getFilteredSubWorks,
    handleDimensionChange, addDimensionRow, removeDimensionRow,
    handleAssemblyTypeChange, handleMemberNameChange,
    addMemberRow, removeMemberRow, addAssemblyGroup, removeAssemblyGroup,
    handlePersonnelChange, vendors, localVenues,
    setIsVenueModalOpen, setNewVenueText, setEditingVenueOldName,
    historicalContacts, historicalPersonnel
}) => {
    const hidePersonnel = noPersonnelWorks.includes(item.workMain);
          
          const isLamination = item.workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच';
          const isBannerArea = bannerSubs.includes(item.workSub);
          const isAssemblyWork = item.workMain === 'दिवंगत विधानपरिषद व विधानसभा सदस्य यांच्याकरीत स्मृतिपत्र';
          
          const requiresDimensions = isLamination || isBannerArea;
          const unitLabel = isLamination ? 'इंच (inches)' : 'फूट (feet)';
          const sqUnit = isLamination ? 'sq.in' : 'sq.ft';
          
          const totalCalculatedArea = (item.dimensions || []).reduce((sum, dim) => sum + ((Number(dim.length) || 0) * (Number(dim.breadth) || 0) * (Number(dim.qty) || 1)), 0);

          let currentRate = 0;
          if (item.workMain === 'Others') {
              currentRate = Number(item.customRate) || 0;
          } else if (selectedCompany?.work_rates && selectedCompany.work_rates[item.workMain]) {
              currentRate = Number(selectedCompany.work_rates[item.workMain][item.workSub]) || 0;
          }

          

    return (
        <Accordion 
            key={index} 
            expanded={expandedItem === index} 
            onChange={(e, isExpanded) => setExpandedItem(isExpanded ? index : false)}
            sx={{ mt: 3 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Typography variant="h6">Work Item #{index + 1} {item.workMain ? `- ${item.workMain}` : ''}</Typography>
                {formData.workItems.length > 1 && (
                  <IconButton type="button" onClick={(e) => { e.stopPropagation(); removeWorkItem(index); }} color="error">
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 2 }}>
              <Grid container spacing={3}>
                    <Grid item xs={12}><Divider>Work Details</Divider></Grid>
                  </Grid>

            <Grid container spacing={2} sx={{ mt: index === 0 ? 1 : 0 }}>
                {/* --- 1. Work Name --- */}
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                        <InputLabel>{isVidhanMandalSelected ? 'कामाचे स्वरूप' : 'Work Name'}</InputLabel>
                        <Select name="workMain" value={item.workMain} label={isVidhanMandalSelected ? 'कामाचे स्वरूप' : 'Work Name'} onChange={(e) => handleWorkItemChange(index, e)}>
                            {isVidhanMandalSelected ? (
                                Object.keys(vidhanMandalWorks).map(work => (
                                    <MenuItem key={work} value={work}>{work}</MenuItem>
                                ))
                            ) : (
                                [
                                  <MenuItem key="still" value="Still_Photography">Still Photography</MenuItem>,
                                  <MenuItem key="video" value="Videography">Videography</MenuItem>,
                                  <MenuItem key="2cam" value="Two_Camera_Setup">Two Video Cameras Live Setup</MenuItem>,
                                  <MenuItem key="3cam" value="Three_Camera_Setup">Three Video Cameras Live Setup</MenuItem>,
                                  <MenuItem key="live" value="Live_Telecast">Live Telecast Setup</MenuItem>,
                                  <MenuItem key="storage" value="Storage">Storage</MenuItem>
                                ]
                            )}
                            <MenuItem value="Others">Others</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {/* --- 2. Work Subcategory --- */}
                {item.workMain === 'Others' ? (
                    <Grid item xs={12} sm={6}>
                        <TextField name="customWorkMain" label="Custom Work Name" required fullWidth value={item.customWorkMain} onChange={(e) => handleWorkItemChange(index, e)} />
                    </Grid>
                ) : (
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required={!!item.workMain} disabled={!item.workMain}>
                            <InputLabel>{isVidhanMandalSelected ? 'कामाचे प्रकार' : 'Work Subcategory'}</InputLabel>
                            <Select name="workSub" value={item.workSub} label={isVidhanMandalSelected ? 'कामाचे प्रकार' : 'Work Subcategory'} onChange={(e) => handleWorkItemChange(index, e)}>
                                {getFilteredSubWorks(item.workMain, selectedCompany).map(sub => (
                                    <MenuItem key={sub} value={sub}>{sub.replaceAll('_', ' ')}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}

                {/* --- 2.5 Dynamic Assembly/Member Fields --- */}
                {isAssemblyWork && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>सदस्यांचा तपशील (Member Details)</Typography>
                    {(item.assemblyDetails || []).map((assemblyGroup, gIdx) => {
                      const groupQty = assemblyGroup.members.length;
                      const groupAmount = groupQty * currentRate;

                      return (
                      <Box key={gIdx} sx={{ p: 2, mb: 2, border: '1px solid #ddd', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.5)' }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>सभागृह (Assembly):</Typography>
                              <FormControl sx={{ minWidth: 200 }} size="small" required>
                                  <Select
                                      value={assemblyGroup.assemblyType || ''}
                                      displayEmpty
                                      onChange={(e) => handleAssemblyTypeChange(index, gIdx, e.target.value)}
                                  >
                                      <MenuItem value="" disabled>निवडा (Select)</MenuItem>
                                      <MenuItem value="विधानपरिषद">विधानपरिषद</MenuItem>
                                      <MenuItem value="विधानसभा">विधानसभा</MenuItem>
                                  </Select>
                              </FormControl>
                              
                              <Box sx={{ flex: 1, textAlign: 'right' }}>
                                 {item.assemblyDetails.length > 1 && (
                                    <Button color="error" size="small" onClick={() => removeAssemblyGroup(index, gIdx)}>
                                        Remove Assembly Group
                                    </Button>
                                 )}
                              </Box>
                          </Box>
                          
                          <Divider sx={{ mb: 2 }} />
                          
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>सदस्यांची नावे (Member Names):</Typography>
                          <Grid container spacing={2}>
                              {(assemblyGroup.members || ['']).map((member, mIdx) => (
                                  <Grid item xs={12} sm={6} md={4} key={mIdx}>
                                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                          <TextField
                                              label={`सदस्य ${mIdx + 1} (Member ${mIdx + 1})`}
                                              required
                                              size="small"
                                              fullWidth
                                              value={member || ''}
                                              onChange={(e) => handleMemberNameChange(index, gIdx, mIdx, e.target.value)}
                                          />
                                          <IconButton color="primary" onClick={() => addMemberRow(index, gIdx)} sx={{ p: 0.5 }}>
                                            <AddCircleOutlineIcon />
                                          </IconButton>
                                          {assemblyGroup.members.length > 1 && (
                                            <IconButton color="error" onClick={() => removeMemberRow(index, gIdx, mIdx)} sx={{ p: 0.5 }}>
                                              <RemoveCircleOutlineIcon />
                                            </IconButton>
                                          )}
                                      </Box>
                                  </Grid>
                              ))}
                          </Grid>
                          
                          {/* PLACED SUB-TOTAL HERE */}
                          <Box sx={{ display: 'flex', mt: 2, pt: 1, borderTop: '1px dashed #ccc', justifyContent: 'flex-end', gap: 4 }}>
                              <Typography variant="subtitle1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                  एकूण नग (Total Qty): {groupQty}
                              </Typography>
                              <Typography variant="subtitle1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                  रक्कम (Amount): ₹ {groupAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Typography>
                          </Box>
                          
                      </Box>
                    )})}
                    <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => addAssemblyGroup(index)} sx={{ mt: 1 }}>
                        Add Another Assembly Group
                    </Button>
                  </Grid>
                )}

                {/* --- 3. Dimension Rows (If Applicable) --- */}
                {requiresDimensions ? (
                  <>
                    {(item.dimensions || []).map((dim, dIdx) => {
                      const l = Number(dim.length) || 0;
                      const b = Number(dim.breadth) || 0;
                      const q = Number(dim.qty) || 1;
                      const area = l * b * q;
                      const rowAmount = area * currentRate;

                      return (
                        <Grid item xs={12} key={dIdx}>
                          <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <Grid container spacing={2} alignItems="center">
                                {/* L x B */}
                                <Grid item xs={12} sm={4}>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>आकार {dIdx + 1}:</Typography>
                                    <TextField 
                                      label={`लांबी (${unitLabel.split(' ')[1].replace(')','')})`} 
                                      type="text"
                                      inputProps={{ inputMode: 'numeric' }}
                                      required 
                                      size="small"
                                      value={dim.length || ''} 
                                      onChange={(e) => handleDimensionChange(index, dIdx, 'length', e.target.value)} 
                                      sx={{ width: '80px' }}
                                    />
                                    <Typography sx={{ fontWeight: 'bold' }}>X</Typography>
                                    <TextField 
                                      label={`रुंदी (${unitLabel.split(' ')[1].replace(')','')})`} 
                                      type="text"
                                      inputProps={{ inputMode: 'numeric' }}
                                      required 
                                      size="small"
                                      value={dim.breadth || ''} 
                                      onChange={(e) => handleDimensionChange(index, dIdx, 'breadth', e.target.value)} 
                                      sx={{ width: '80px' }}
                                    />
                                  </Box>
                                </Grid>

                                {/* Individual Qty */}
                                <Grid item xs={12} sm={2}>
                                    <TextField 
                                      label="नग (Qty)" 
                                      type="text"
                                      inputProps={{ inputMode: 'numeric' }}
                                      required 
                                      size="small"
                                      fullWidth
                                      value={dim.qty || ''} 
                                      onChange={(e) => handleDimensionChange(index, dIdx, 'qty', e.target.value)} 
                                    />
                                </Grid>

                                {/* Individual Area */}
                                <Grid item xs={12} sm={3}>
                                    <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                        = {area} {sqUnit}
                                    </Typography>
                                </Grid>

                                {/* Amount & Buttons */}
                                <Grid item xs={12} sm={3}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                        (₹ {rowAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                    </Typography>
                                    <Box>
                                      <IconButton color="primary" onClick={() => addDimensionRow(index)}>
                                        <AddCircleOutlineIcon />
                                      </IconButton>
                                      {item.dimensions.length > 1 && (
                                        <IconButton color="error" onClick={() => removeDimensionRow(index, dIdx)}>
                                          <RemoveCircleOutlineIcon />
                                        </IconButton>
                                      )}
                                    </Box>
                                  </Box>
                                </Grid>
                            </Grid>
                          </Box>
                        </Grid>
                      );
                    })}

                    {/* ALIGNED SUMMARY ROW */}
                    <Grid item xs={12}>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Grid container spacing={2} alignItems="center">
                                {/* Spacer matching LxB length */}
                                <Grid item xs={12} sm={4}></Grid>

                                {/* Total Quantity */}
                                <Grid item xs={12} sm={2}>
                                    <TextField 
                                        name="quantity" 
                                        label={isVidhanMandalSelected ? 'एकूण नग' : 'Total Qty'} 
                                        type="text"
                                        inputProps={{ inputMode: 'numeric' }}
                                        required 
                                        fullWidth 
                                        size="small"
                                        value={item.quantity} 
                                        InputProps={{ readOnly: true, sx: { backgroundColor: '#f5f5f5' } }} 
                                    />
                                </Grid>

                                {/* Total Area */}
                                <Grid item xs={12} sm={3}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                        एकूण: {totalCalculatedArea} {sqUnit}
                                    </Typography>
                                </Grid>

                                {/* Total Amount */}
                                <Grid item xs={12} sm={3}>
                                    <TextField 
                                        label={isVidhanMandalSelected ? 'एकूण रक्कम' : 'Total Amount'} 
                                        type="text" 
                                        fullWidth 
                                        size="small"
                                        value={calculateItemAmount(item, selectedCompany).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                        InputProps={{ readOnly: true, sx: { backgroundColor: '#f5f5f5', fontWeight: 'bold' } }} 
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                  </>
                ) : (
                  /* STANDARD LAYOUT FOR NON-DIMENSION ITEMS */
                  <>
                    <Grid item xs={12} sm={6}>
                        <TextField 
                            name="quantity" 
                            label={isVidhanMandalSelected ? (isAssemblyWork ? 'एकूण नग (Total Qty)' : 'नग') : 'Quantity'} 
                            type="text"
                            inputProps={{ inputMode: 'numeric' }}
                            required 
                            fullWidth 
                            value={item.quantity} 
                            onChange={(e) => handleWorkItemChange(index, e)} 
                            disabled={['Two_Camera_Setup', 'Three_Camera_Setup'].includes(item.workMain) || isAssemblyWork}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        {item.workMain === 'Others' ? (
                            <TextField 
                                name="customRate" 
                                label="Custom Rate / Amount (Rs.)" 
                                type="text"
                                inputProps={{ inputMode: 'numeric' }}
                                fullWidth 
                                value={item.customRate || ''} 
                                onChange={(e) => handleWorkItemChange(index, e)} 
                            />
                        ) : (
                            <TextField 
                                label={isVidhanMandalSelected ? 'रकम' : 'Amount'} 
                                type="text" 
                                fullWidth 
                                value={calculateItemAmount(item, selectedCompany).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                InputProps={{ readOnly: true, sx: { backgroundColor: '#f5f5f5' } }} 
                            />
                        )}
                    </Grid>
                  </>
                )}

                {/* --- 7. Assigned Personnel --- */}
                {!hidePersonnel && (
                  <React.Fragment>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1, color: 'text.secondary' }}>Assigned Personnel</Typography>
                    </Grid>
                    {(item.personnel || [{ name: '', number: '' }]).map((person, pIdx) => (
                      <React.Fragment key={pIdx}>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            freeSolo
                            options={Array.from(new Set([
                                ...historicalPersonnel.map(p => p.name),
                                ...formData.workItems.flatMap(wi => (wi.personnel || []).map(p => p.name).filter(Boolean))
                            ]))}
                            inputValue={person.name || ''}
                            onInputChange={(e, newValue) => handlePersonnelChange(index, pIdx, 'name', newValue || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label={person.role ? `${person.role} Name` : `Photographer/Videographer ${pIdx + 1} Name`}
                                fullWidth
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label={`Contact Number`}
                            fullWidth
                            size="small"
                            type="text"
                            inputProps={{ inputMode: 'numeric' }}
                            value={person.number || ''}
                            onChange={(e) => handlePersonnelChange(index, pIdx, 'number', e.target.value)}
                          />
                        </Grid>
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                )}
            </Grid>
            </AccordionDetails>
          </Accordion>
    );
};

export default WorkOrderItem;
