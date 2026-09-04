import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";
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
  return /* @__PURE__ */ React.createElement(Dialog, { open: isVenueModalOpen, onClose: () => setIsVenueModalOpen(false) }, /* @__PURE__ */ React.createElement(DialogTitle, null, editingVenueOldName ? "Edit Venue" : "Add New Venue"), /* @__PURE__ */ React.createElement(DialogContent, null, /* @__PURE__ */ React.createElement(
    TextField,
    {
      autoFocus: true,
      margin: "dense",
      label: "Venue Name",
      type: "text",
      fullWidth: true,
      variant: "outlined",
      value: newVenueText,
      onChange: (e) => setNewVenueText(e.target.value)
    }
  )), /* @__PURE__ */ React.createElement(DialogActions, null, /* @__PURE__ */ React.createElement(Button, { onClick: () => setIsVenueModalOpen(false) }, "Cancel"), /* @__PURE__ */ React.createElement(Button, { onClick: () => {
    const val = newVenueText.trim();
    if (val) {
      setLocalVenues((prev) => {
        let newList;
        if (editingVenueOldName) {
          newList = prev.map((v) => v === editingVenueOldName ? val : v);
        } else {
          newList = [...prev, val];
        }
        newList = Array.from(new Set(newList));
        const customOnly = newList.filter((v) => !venues.includes(v));
        localStorage.setItem("customVenues", JSON.stringify(customOnly));
        return newList;
      });
      if (!editingVenueOldName || formData.workItems[0].eventVenue === editingVenueOldName) {
        handleWorkItemChange(0, { target: { name: "eventVenue", value: val } });
      }
    }
    setIsVenueModalOpen(false);
    setNewVenueText("");
    setEditingVenueOldName(null);
  }, variant: "contained", disabled: !newVenueText.trim() }, editingVenueOldName ? "Update" : "Add")));
};
export default VenueModal;
