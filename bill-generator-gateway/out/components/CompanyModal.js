import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, FormControlLabel, Switch, Typography, Box } from "@mui/material";
import { subWorks, vidhanMandalWorks } from "../constants/data";
const CompanyModal = ({
  isCompanyModalOpen,
  setIsCompanyModalOpen,
  editingCompanyId,
  newCompany,
  setNewCompany,
  handleSaveCompany,
  getFilteredSubWorks
}) => {
  return /* @__PURE__ */ React.createElement(
    Dialog,
    {
      open: isCompanyModalOpen,
      onClose: () => setIsCompanyModalOpen(false),
      slotProps: {
        backdrop: { sx: { backgroundColor: "rgba(0, 0, 0, 0.1)" } }
      },
      PaperProps: {
        sx: {
          bgcolor: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          minWidth: "400px",
          maxWidth: "600px",
          maxHeight: "90vh",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
        }
      }
    },
    /* @__PURE__ */ React.createElement(DialogTitle, null, editingCompanyId ? "Edit Company Rates" : "Add New Company"),
    /* @__PURE__ */ React.createElement(DialogContent, null, /* @__PURE__ */ React.createElement(
      TextField,
      {
        autoFocus: true,
        margin: "dense",
        label: "Company Name",
        type: "text",
        fullWidth: true,
        variant: "outlined",
        value: newCompany.company_name,
        onChange: (e) => setNewCompany({ ...newCompany, company_name: e.target.value })
      }
    ), /* @__PURE__ */ React.createElement(
      TextField,
      {
        margin: "dense",
        label: "Address",
        type: "text",
        fullWidth: true,
        variant: "outlined",
        multiline: true,
        rows: 3,
        value: newCompany.address,
        onChange: (e) => setNewCompany({ ...newCompany, address: e.target.value })
      }
    ), /* @__PURE__ */ React.createElement(
      TextField,
      {
        margin: "dense",
        label: "GST Number",
        type: "text",
        fullWidth: true,
        variant: "outlined",
        value: newCompany.gst_number,
        onChange: (e) => setNewCompany({ ...newCompany, gst_number: e.target.value })
      }
    ), /* @__PURE__ */ React.createElement(Box, { sx: { mt: 2, display: "flex", flexDirection: "column", gap: 1, p: 2, bgcolor: "rgba(0,0,0,0.03)", borderRadius: 1 } }, /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle2", color: "text.secondary" }, "Client Specific Settings"), /* @__PURE__ */ React.createElement(
      FormControlLabel,
      {
        control: /* @__PURE__ */ React.createElement(Switch, { checked: newCompany.is_govt_client || false, onChange: (e) => setNewCompany({ ...newCompany, is_govt_client: e.target.checked }), color: "primary" }),
        label: "Is Government Client (Requires special handling)"
      }
    ), /* @__PURE__ */ React.createElement(
      FormControlLabel,
      {
        control: /* @__PURE__ */ React.createElement(Switch, { checked: newCompany.requires_po_number || false, onChange: (e) => setNewCompany({ ...newCompany, requires_po_number: e.target.checked }), color: "primary" }),
        label: "Requires PO Number (Mandatory PO fields on invoice)"
      }
    ), /* @__PURE__ */ React.createElement(
      FormControlLabel,
      {
        control: /* @__PURE__ */ React.createElement(Switch, { checked: newCompany.uses_marathi_labels || false, onChange: (e) => setNewCompany({ ...newCompany, uses_marathi_labels: e.target.checked }), color: "primary" }),
        label: "Uses Marathi Labels (Translates invoice fields to Marathi)"
      }
    )), /* @__PURE__ */ React.createElement(Divider, { sx: { my: 3 } }), /* @__PURE__ */ React.createElement(Typography, { variant: "h6", sx: { fontWeight: "bold", mb: 2 } }, "Custom Work Rates"), Object.keys(newCompany.work_rates).map((key) => {
      const rateData = newCompany.work_rates[key];
      if (typeof rateData === "object" && rateData !== null) {
        const subKeys = getFilteredSubWorks(key, newCompany);
        return /* @__PURE__ */ React.createElement(Box, { key, sx: { mb: 3, p: 2, borderLeft: "4px solid #1976d2", bgcolor: "rgba(25, 118, 210, 0.05)", borderRadius: "0 8px 8px 0" } }, /* @__PURE__ */ React.createElement(Typography, { variant: "body1", sx: { fontWeight: "bold", mb: 2, color: "#1976d2", textTransform: "uppercase" } }, key.replaceAll("_", " ")), /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 2 }, subKeys.map((subKey) => /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, key: subKey }, /* @__PURE__ */ React.createElement(
          TextField,
          {
            label: `${subKey.replaceAll("_", " ")} Rate`,
            type: "text",
            inputProps: { inputMode: "numeric" },
            fullWidth: true,
            variant: "outlined",
            size: "small",
            value: rateData[subKey] || "",
            onChange: (e) => handleRateChange(key, subKey, e.target.value)
          }
        )))));
      } else {
        return /* @__PURE__ */ React.createElement(
          TextField,
          {
            key,
            margin: "dense",
            label: `${key.replaceAll("_", " ")} Rate`,
            type: "text",
            inputProps: { inputMode: "numeric" },
            fullWidth: true,
            variant: "outlined",
            size: "small",
            value: rateData || "",
            onChange: (e) => handleRateChange(key, null, e.target.value),
            sx: { mb: 2 }
          }
        );
      }
    })),
    /* @__PURE__ */ React.createElement(DialogActions, { sx: { p: 2 } }, /* @__PURE__ */ React.createElement(Button, { type: "button", onClick: () => setIsCompanyModalOpen(false) }, "Cancel"), /* @__PURE__ */ React.createElement(Button, { type: "button", onClick: handleSaveCompany, variant: "contained", disabled: !newCompany.company_name }, editingCompanyId ? "Update" : "Save"))
  );
};
export default CompanyModal;
