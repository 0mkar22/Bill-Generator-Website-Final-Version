import { useState } from 'react';
import { convertMarathiToEnglishNumbers } from '../utils/helpers';
import { noPersonnelWorks, bannerSubs } from '../constants/data';

export const useWorkOrderForm = (initialData, historicalContacts, historicalPersonnel) => {
    const [formData, setFormData] = useState(initialData);

    const handleMainChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWorkItemChange = (index, e) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (['quantity', 'customRate'].includes(name)) {
            finalValue = convertMarathiToEnglishNumbers(value);
        } else if (name === 'contactNumber') {
            finalValue = convertMarathiToEnglishNumbers(value).slice(0, 10);
        }

        const newWorkItems = [...formData.workItems];
        newWorkItems[index][name] = finalValue;

        if (index === 0 && ['eventName', 'poNpo', 'eventTime', 'eventVenue', 'contactPerson', 'contactNumber', 'customVenue', 'roomNumber'].includes(name)) {
            for (let i = 1; i < newWorkItems.length; i++) {
                newWorkItems[i][name] = finalValue;
            }
        }

        if (name === 'contactPerson') {
            let matchedNumber = '';
            const cleanedValue = finalValue.trim().toLowerCase();

            if (cleanedValue !== '') {
                const foundDb = historicalContacts.find(c => c.name.toLowerCase() === cleanedValue);
                if (foundDb) {
                    matchedNumber = foundDb.number.replace(/[^0-9]/g, '').slice(0, 10);
                } else {
                    for (const workItem of formData.workItems) {
                        if (workItem.contactPerson?.toLowerCase().trim() === cleanedValue && workItem.contactNumber) {
                            matchedNumber = workItem.contactNumber.replace(/[^0-9]/g, '').slice(0, 10);
                            break;
                        }
                    }
                }
            }
            
            newWorkItems[index]['contactNumber'] = matchedNumber;
            if (index === 0) {
                for (let i = 1; i < newWorkItems.length; i++) {
                    newWorkItems[i]['contactNumber'] = matchedNumber;
                }
            }
        }

        if (name === 'quantity') {
            const qty = Number(finalValue) || 1;
            
            if (!['Two_Camera_Setup', 'Three_Camera_Setup', 'लाईव्ह व्हिडिओ मिक्सर'].includes(newWorkItems[index].workMain)) {
                let personnel = newWorkItems[index].personnel || [];
                if (personnel.length < qty) {
                    for (let i = personnel.length; i < qty; i++) {
                        personnel.push({ name: '', number: '' });
                    }
                } else if (personnel.length > qty) {
                    personnel = personnel.slice(0, qty);
                }
                newWorkItems[index].personnel = personnel;
            }

            if (newWorkItems[index].workSub === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच' || (bannerSubs && bannerSubs.includes(newWorkItems[index].workSub))) {
                let dims = newWorkItems[index].dimensions || [];
                if (dims.length === 0) {
                    dims = [{ length: '', breadth: '', qty: qty }];
                } else if (dims.length === 1) {
                    dims[0].qty = qty;
                }
                newWorkItems[index].dimensions = dims;
            }
        }

        if (name === 'workSub') {
            if (finalValue === 'फोटो सहित लेमिनेशन (लाकडी) प्रती इंच' || (bannerSubs && bannerSubs.includes(finalValue))) {
                newWorkItems[index].dimensions = [{ length: '', breadth: '', qty: newWorkItems[index].quantity || 1 }];
            }
        }

        if (name === 'workMain') {
            newWorkItems[index]['workSub'] = '';
            newWorkItems[index]['customRate'] = '';
            newWorkItems[index]['quantity'] = 1; 
            newWorkItems[index]['dimensions'] = [{ length: '', breadth: '', qty: 1 }];
            newWorkItems[index]['assemblyDetails'] = [{ assemblyType: '', members: [''] }];

            if (finalValue === 'Two_Camera_Setup') {
                newWorkItems[index]['personnel'] = [
                    { role: 'Mixer Operator', name: '', number: '' },
                    { role: 'Camera Operator', name: '', number: '' },
                    { role: 'Camera Operator', name: '', number: '' },
                    { role: 'Assistant', name: '', number: '' }
                ];
            } else if (finalValue === 'Three_Camera_Setup') {
                newWorkItems[index]['personnel'] = [
                    { role: 'Mixer Operator', name: '', number: '' },
                    { role: 'Camera Operator', name: '', number: '' },
                    { role: 'Camera Operator', name: '', number: '' },
                    { role: 'Camera Operator', name: '', number: '' },
                    { role: 'Assistant', name: '', number: '' }
                ];
            } else if (finalValue === 'लाईव्ह व्हिडिओ मिक्सर') {
                newWorkItems[index]['personnel'] = Array(2).fill(null).map(() => ({ name: '', number: '' }));
            } else if (noPersonnelWorks && noPersonnelWorks.includes(finalValue)) {
                newWorkItems[index]['personnel'] = []; 
            } else {
                newWorkItems[index]['personnel'] = [{ name: '', number: '' }];
            }
        }
        setFormData(prev => ({ ...prev, workItems: newWorkItems }));
    };

    const handleDimensionChange = (itemIndex, dimIndex, field, value) => {
        const safeValue = convertMarathiToEnglishNumbers(value);
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const updatedDims = [...(currentItem.dimensions || [])];
            
            if (!updatedDims[dimIndex]) {
                updatedDims[dimIndex] = { length: '', breadth: '', qty: 1 };
            }
            
            updatedDims[dimIndex] = { ...updatedDims[dimIndex], [field]: safeValue };
            currentItem.dimensions = updatedDims;

            const totalQty = updatedDims.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
            currentItem.quantity = totalQty > 0 ? totalQty : 1;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const addDimensionRow = (itemIndex) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            currentItem.dimensions = [...(currentItem.dimensions || []), { length: '', breadth: '', qty: 1 }];
            
            const totalQty = currentItem.dimensions.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
            currentItem.quantity = totalQty > 0 ? totalQty : 1;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const removeDimensionRow = (itemIndex, dimIndex) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const newDims = [...currentItem.dimensions];
            newDims.splice(dimIndex, 1);
            currentItem.dimensions = newDims;
            
            const totalQty = newDims.reduce((sum, d) => sum + (Number(d.qty) || 0), 0);
            currentItem.quantity = totalQty > 0 ? totalQty : 1;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const handleAssemblyTypeChange = (itemIndex, groupIndex, value) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const updatedAssembly = [...(currentItem.assemblyDetails || [])];
            
            if (!updatedAssembly[groupIndex]) {
                updatedAssembly[groupIndex] = { assemblyType: '', members: [''] };
            }
            
            updatedAssembly[groupIndex] = { ...updatedAssembly[groupIndex], assemblyType: value };
            currentItem.assemblyDetails = updatedAssembly;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const handleMemberNameChange = (itemIndex, groupIndex, memberIndex, value) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const updatedAssembly = [...(currentItem.assemblyDetails || [])];
            const updatedMembers = [...(updatedAssembly[groupIndex].members || [''])];
            
            updatedMembers[memberIndex] = value;
            updatedAssembly[groupIndex] = { ...updatedAssembly[groupIndex], members: updatedMembers };
            currentItem.assemblyDetails = updatedAssembly;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const addMemberRow = (itemIndex, groupIndex) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const updatedAssembly = [...(currentItem.assemblyDetails || [])];
            const updatedMembers = [...(updatedAssembly[groupIndex].members || [])];
            
            updatedMembers.push('');
            updatedAssembly[groupIndex] = { ...updatedAssembly[groupIndex], members: updatedMembers };
            currentItem.assemblyDetails = updatedAssembly;
            
            const totalQty = updatedAssembly.reduce((sum, group) => sum + group.members.length, 0);
            currentItem.quantity = totalQty > 0 ? totalQty : 1;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const removeMemberRow = (itemIndex, groupIndex, memberIndex) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const updatedAssembly = [...(currentItem.assemblyDetails || [])];
            const updatedMembers = [...(updatedAssembly[groupIndex].members || [])];
            
            updatedMembers.splice(memberIndex, 1);
            updatedAssembly[groupIndex] = { ...updatedAssembly[groupIndex], members: updatedMembers };
            currentItem.assemblyDetails = updatedAssembly;
            
            const totalQty = updatedAssembly.reduce((sum, group) => sum + group.members.length, 0);
            currentItem.quantity = totalQty > 0 ? totalQty : 1;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const addAssemblyGroup = (itemIndex) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            currentItem.assemblyDetails = [...(currentItem.assemblyDetails || []), { assemblyType: '', members: [''] }];
            
            const totalQty = currentItem.assemblyDetails.reduce((sum, group) => sum + group.members.length, 0);
            currentItem.quantity = totalQty > 0 ? totalQty : 1;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const removeAssemblyGroup = (itemIndex, groupIndex) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const newAssembly = [...currentItem.assemblyDetails];
            newAssembly.splice(groupIndex, 1);
            currentItem.assemblyDetails = newAssembly;
            
            const totalQty = newAssembly.reduce((sum, group) => sum + group.members.length, 0);
            currentItem.quantity = totalQty > 0 ? totalQty : 1;
            
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const handlePersonnelChange = (itemIndex, personIndex, field, value) => {
        setFormData(prev => {
            const newWorkItems = [...prev.workItems];
            const currentItem = { ...newWorkItems[itemIndex] };
            const updatedPersonnel = [...(currentItem.personnel || [])];
            
            let finalValue = value;
            if (field === 'number') {
                finalValue = convertMarathiToEnglishNumbers(value).slice(0, 10);
            }
            
            if (!updatedPersonnel[personIndex]) {
                updatedPersonnel[personIndex] = { name: '', number: '' };
            }
            
            updatedPersonnel[personIndex] = { ...updatedPersonnel[personIndex], [field]: finalValue };

            if (field === 'name') {
                let matchedNumber = '';
                const cleanedValue = finalValue.trim().toLowerCase();

                if (cleanedValue !== '') {
                    const foundDb = historicalPersonnel.find(p => p.name.toLowerCase() === cleanedValue);
                    if (foundDb) {
                        matchedNumber = foundDb.number.replace(/[^0-9]/g, '').slice(0, 10);
                    } else {
                        for (const workItem of prev.workItems) {
                            for (const p of (workItem.personnel || [])) {
                                if (p.name?.toLowerCase().trim() === cleanedValue && p.number) {
                                    matchedNumber = p.number.replace(/[^0-9]/g, '').slice(0, 10);
                                    break;
                                }
                            }
                            if (matchedNumber) break;
                        }
                    }
                }
                
                updatedPersonnel[personIndex].number = matchedNumber;
            }

            currentItem.personnel = updatedPersonnel;
            newWorkItems[itemIndex] = currentItem;
            return { ...prev, workItems: newWorkItems };
        });
    };

    const addWorkItem = () => {
        const firstItem = formData.workItems[0];
        setFormData(prev => ({
            ...prev,
            workItems: [
                ...prev.workItems,
                {
                    eventName: firstItem.eventName,
                    poNpo: firstItem.poNpo,
                    eventTime: firstItem.eventTime,
                    eventVenue: firstItem.eventVenue,
                    contactPerson: firstItem.contactPerson,
                    contactNumber: firstItem.contactNumber,
                    roomNumber: firstItem.roomNumber || '',
                    customVenue: firstItem.customVenue,
                    workMain: '',
                    workSub: '',
                    quantity: 1,
                    customWorkMain: '',
                    customRate: '',
                    dimensions: [{ length: '', breadth: '', qty: 1 }],
                    assemblyDetails: [{ assemblyType: '', members: [''] }],
                    personnel: [{ name: '', number: '' }] 
                }
            ]
        }));
    };

    const removeWorkItem = (index) => {
        const newWorkItems = formData.workItems.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, workItems: newWorkItems }));
    };

    return {
        formData,
        setFormData,
        handleMainChange,
        handleWorkItemChange,
        handleDimensionChange,
        addDimensionRow,
        removeDimensionRow,
        handleAssemblyTypeChange,
        handleMemberNameChange,
        addMemberRow,
        removeMemberRow,
        addAssemblyGroup,
        removeAssemblyGroup,
        handlePersonnelChange,
        addWorkItem,
        removeWorkItem
    };
};
