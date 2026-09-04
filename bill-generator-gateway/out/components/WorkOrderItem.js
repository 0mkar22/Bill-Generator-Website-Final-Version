import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  IconButton,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Autocomplete
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { noPersonnelWorks, bannerSubs, vidhanMandalWorks, subWorks, venues } from "../constants/data";
import { calculateItemAmount } from "../utils/helpers";
const WorkOrderItem = ({
  item,
  index,
  expandedItem,
  setExpandedItem,
  formData,
  handleWorkItemChange,
  handleMainChange,
  removeWorkItem,
  isVidhanMandalSelected,
  selectedCompany,
  getFilteredSubWorks,
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
  vendors,
  localVenues,
  setIsVenueModalOpen,
  setNewVenueText,
  setEditingVenueOldName,
  historicalContacts,
  historicalPersonnel
}) => {
  const hidePersonnel = noPersonnelWorks.includes(item.workMain);
  const isLamination = item.workSub === "\u092B\u094B\u091F\u094B \u0938\u0939\u093F\u0924 \u0932\u0947\u092E\u093F\u0928\u0947\u0936\u0928 (\u0932\u093E\u0915\u0921\u0940) \u092A\u094D\u0930\u0924\u0940 \u0907\u0902\u091A";
  const isBannerArea = bannerSubs.includes(item.workSub);
  const isAssemblyWork = item.workMain === "\u0926\u093F\u0935\u0902\u0917\u0924 \u0935\u093F\u0927\u093E\u0928\u092A\u0930\u093F\u0937\u0926 \u0935 \u0935\u093F\u0927\u093E\u0928\u0938\u092D\u093E \u0938\u0926\u0938\u094D\u092F \u092F\u093E\u0902\u091A\u094D\u092F\u093E\u0915\u0930\u0940\u0924 \u0938\u094D\u092E\u0943\u0924\u093F\u092A\u0924\u094D\u0930";
  const requiresDimensions = isLamination || isBannerArea;
  const unitLabel = isLamination ? "\u0907\u0902\u091A (inches)" : "\u092B\u0942\u091F (feet)";
  const sqUnit = isLamination ? "sq.in" : "sq.ft";
  const totalCalculatedArea = (item.dimensions || []).reduce((sum, dim) => sum + (Number(dim.length) || 0) * (Number(dim.breadth) || 0) * (Number(dim.qty) || 1), 0);
  let currentRate = 0;
  if (item.workMain === "Others") {
    currentRate = Number(item.customRate) || 0;
  } else if (selectedCompany?.work_rates && selectedCompany.work_rates[item.workMain]) {
    currentRate = Number(selectedCompany.work_rates[item.workMain][item.workSub]) || 0;
  }
  return /* @__PURE__ */ React.createElement(
    Accordion,
    {
      key: index,
      expanded: expandedItem === index,
      onChange: (e, isExpanded) => setExpandedItem(isExpanded ? index : false),
      sx: { mt: 3 }
    },
    /* @__PURE__ */ React.createElement(AccordionSummary, { expandIcon: /* @__PURE__ */ React.createElement(ExpandMoreIcon, null), sx: { display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" } }, /* @__PURE__ */ React.createElement(Typography, { variant: "h6" }, "Work Item #", index + 1, " ", item.workMain ? `- ${item.workMain}` : ""), formData.workItems.length > 1 && /* @__PURE__ */ React.createElement(IconButton, { type: "button", onClick: (e) => {
      e.stopPropagation();
      removeWorkItem(index);
    }, color: "error" }, /* @__PURE__ */ React.createElement(RemoveCircleOutlineIcon, null)))),
    /* @__PURE__ */ React.createElement(AccordionDetails, { sx: { p: 2 } }, /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 3 }, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12 }, /* @__PURE__ */ React.createElement(Divider, null, "Work Details"))), /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 2, sx: { mt: index === 0 ? 1 : 0 } }, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(FormControl, { fullWidth: true, required: true }, /* @__PURE__ */ React.createElement(InputLabel, null, isVidhanMandalSelected ? "\u0915\u093E\u092E\u093E\u091A\u0947 \u0938\u094D\u0935\u0930\u0942\u092A" : "Work Name"), /* @__PURE__ */ React.createElement(Select, { name: "workMain", value: item.workMain, label: isVidhanMandalSelected ? "\u0915\u093E\u092E\u093E\u091A\u0947 \u0938\u094D\u0935\u0930\u0942\u092A" : "Work Name", onChange: (e) => handleWorkItemChange(index, e) }, isVidhanMandalSelected ? Object.keys(vidhanMandalWorks).map((work) => /* @__PURE__ */ React.createElement(MenuItem, { key: work, value: work }, work)) : [
      /* @__PURE__ */ React.createElement(MenuItem, { key: "still", value: "Still_Photography" }, "Still Photography"),
      /* @__PURE__ */ React.createElement(MenuItem, { key: "video", value: "Videography" }, "Videography"),
      /* @__PURE__ */ React.createElement(MenuItem, { key: "2cam", value: "Two_Camera_Setup" }, "Two Video Cameras Live Setup"),
      /* @__PURE__ */ React.createElement(MenuItem, { key: "3cam", value: "Three_Camera_Setup" }, "Three Video Cameras Live Setup"),
      /* @__PURE__ */ React.createElement(MenuItem, { key: "live", value: "Live_Telecast" }, "Live Telecast Setup"),
      /* @__PURE__ */ React.createElement(MenuItem, { key: "storage", value: "Storage" }, "Storage")
    ], /* @__PURE__ */ React.createElement(MenuItem, { value: "Others" }, "Others")))), item.workMain === "Others" ? /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(TextField, { name: "customWorkMain", label: "Custom Work Name", required: true, fullWidth: true, value: item.customWorkMain, onChange: (e) => handleWorkItemChange(index, e) })) : /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(FormControl, { fullWidth: true, required: !!item.workMain, disabled: !item.workMain }, /* @__PURE__ */ React.createElement(InputLabel, null, isVidhanMandalSelected ? "\u0915\u093E\u092E\u093E\u091A\u0947 \u092A\u094D\u0930\u0915\u093E\u0930" : "Work Subcategory"), /* @__PURE__ */ React.createElement(Select, { name: "workSub", value: item.workSub, label: isVidhanMandalSelected ? "\u0915\u093E\u092E\u093E\u091A\u0947 \u092A\u094D\u0930\u0915\u093E\u0930" : "Work Subcategory", onChange: (e) => handleWorkItemChange(index, e) }, getFilteredSubWorks(item.workMain, selectedCompany).map((sub) => /* @__PURE__ */ React.createElement(MenuItem, { key: sub, value: sub }, sub.replaceAll("_", " ")))))), isAssemblyWork && /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12 }, /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle2", sx: { mb: 1, color: "text.secondary" } }, "\u0938\u0926\u0938\u094D\u092F\u093E\u0902\u091A\u093E \u0924\u092A\u0936\u0940\u0932 (Member Details)"), (item.assemblyDetails || []).map((assemblyGroup, gIdx) => {
      const groupQty = assemblyGroup.members.length;
      const groupAmount = groupQty * currentRate;
      return /* @__PURE__ */ React.createElement(Box, { key: gIdx, sx: { p: 2, mb: 2, border: "1px solid #ddd", borderRadius: 2, bgcolor: "rgba(255,255,255,0.5)" } }, /* @__PURE__ */ React.createElement(Box, { sx: { display: "flex", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement(Typography, { variant: "body1", sx: { fontWeight: "bold" } }, "\u0938\u092D\u093E\u0917\u0943\u0939 (Assembly):"), /* @__PURE__ */ React.createElement(FormControl, { sx: { minWidth: 200 }, size: "small", required: true }, /* @__PURE__ */ React.createElement(
        Select,
        {
          value: assemblyGroup.assemblyType || "",
          displayEmpty: true,
          onChange: (e) => handleAssemblyTypeChange(index, gIdx, e.target.value)
        },
        /* @__PURE__ */ React.createElement(MenuItem, { value: "", disabled: true }, "\u0928\u093F\u0935\u0921\u093E (Select)"),
        /* @__PURE__ */ React.createElement(MenuItem, { value: "\u0935\u093F\u0927\u093E\u0928\u092A\u0930\u093F\u0937\u0926" }, "\u0935\u093F\u0927\u093E\u0928\u092A\u0930\u093F\u0937\u0926"),
        /* @__PURE__ */ React.createElement(MenuItem, { value: "\u0935\u093F\u0927\u093E\u0928\u0938\u092D\u093E" }, "\u0935\u093F\u0927\u093E\u0928\u0938\u092D\u093E")
      )), /* @__PURE__ */ React.createElement(Box, { sx: { flex: 1, textAlign: "right" } }, item.assemblyDetails.length > 1 && /* @__PURE__ */ React.createElement(Button, { color: "error", size: "small", onClick: () => removeAssemblyGroup(index, gIdx) }, "Remove Assembly Group"))), /* @__PURE__ */ React.createElement(Divider, { sx: { mb: 2 } }), /* @__PURE__ */ React.createElement(Typography, { variant: "body2", sx: { fontWeight: "bold", mb: 1 } }, "\u0938\u0926\u0938\u094D\u092F\u093E\u0902\u091A\u0940 \u0928\u093E\u0935\u0947 (Member Names):"), /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 2 }, (assemblyGroup.members || [""]).map((member, mIdx) => /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6, md: 4, key: mIdx }, /* @__PURE__ */ React.createElement(Box, { sx: { display: "flex", gap: 1, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
        TextField,
        {
          label: `\u0938\u0926\u0938\u094D\u092F ${mIdx + 1} (Member ${mIdx + 1})`,
          required: true,
          size: "small",
          fullWidth: true,
          value: member || "",
          onChange: (e) => handleMemberNameChange(index, gIdx, mIdx, e.target.value)
        }
      ), /* @__PURE__ */ React.createElement(IconButton, { color: "primary", onClick: () => addMemberRow(index, gIdx), sx: { p: 0.5 } }, /* @__PURE__ */ React.createElement(AddCircleOutlineIcon, null)), assemblyGroup.members.length > 1 && /* @__PURE__ */ React.createElement(IconButton, { color: "error", onClick: () => removeMemberRow(index, gIdx, mIdx), sx: { p: 0.5 } }, /* @__PURE__ */ React.createElement(RemoveCircleOutlineIcon, null)))))), /* @__PURE__ */ React.createElement(Box, { sx: { display: "flex", mt: 2, pt: 1, borderTop: "1px dashed #ccc", justifyContent: "flex-end", gap: 4 } }, /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle1", sx: { color: "#1976d2", fontWeight: "bold" } }, "\u090F\u0915\u0942\u0923 \u0928\u0917 (Total Qty): ", groupQty), /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle1", sx: { color: "#1976d2", fontWeight: "bold" } }, "\u0930\u0915\u094D\u0915\u092E (Amount): \u20B9 ", groupAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))));
    }), /* @__PURE__ */ React.createElement(Button, { variant: "outlined", startIcon: /* @__PURE__ */ React.createElement(AddCircleOutlineIcon, null), onClick: () => addAssemblyGroup(index), sx: { mt: 1 } }, "Add Another Assembly Group")), requiresDimensions ? /* @__PURE__ */ React.createElement(React.Fragment, null, (item.dimensions || []).map((dim, dIdx) => {
      const l = Number(dim.length) || 0;
      const b = Number(dim.breadth) || 0;
      const q = Number(dim.qty) || 1;
      const area = l * b * q;
      const rowAmount = area * currentRate;
      return /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, key: dIdx }, /* @__PURE__ */ React.createElement(Box, { sx: { p: 2, border: "1px dashed #ccc", borderRadius: 1, bgcolor: "rgba(0,0,0,0.02)" } }, /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 2, alignItems: "center" }, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 4 }, /* @__PURE__ */ React.createElement(Box, { sx: { display: "flex", gap: 1, alignItems: "center" } }, /* @__PURE__ */ React.createElement(Typography, { variant: "body2", sx: { fontWeight: "bold", mr: 1 } }, "\u0906\u0915\u093E\u0930 ", dIdx + 1, ":"), /* @__PURE__ */ React.createElement(
        TextField,
        {
          label: `\u0932\u093E\u0902\u092C\u0940 (${unitLabel.split(" ")[1].replace(")", "")})`,
          type: "text",
          inputProps: { inputMode: "numeric" },
          required: true,
          size: "small",
          value: dim.length || "",
          onChange: (e) => handleDimensionChange(index, dIdx, "length", e.target.value),
          sx: { width: "80px" }
        }
      ), /* @__PURE__ */ React.createElement(Typography, { sx: { fontWeight: "bold" } }, "X"), /* @__PURE__ */ React.createElement(
        TextField,
        {
          label: `\u0930\u0941\u0902\u0926\u0940 (${unitLabel.split(" ")[1].replace(")", "")})`,
          type: "text",
          inputProps: { inputMode: "numeric" },
          required: true,
          size: "small",
          value: dim.breadth || "",
          onChange: (e) => handleDimensionChange(index, dIdx, "breadth", e.target.value),
          sx: { width: "80px" }
        }
      ))), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 2 }, /* @__PURE__ */ React.createElement(
        TextField,
        {
          label: "\u0928\u0917 (Qty)",
          type: "text",
          inputProps: { inputMode: "numeric" },
          required: true,
          size: "small",
          fullWidth: true,
          value: dim.qty || "",
          onChange: (e) => handleDimensionChange(index, dIdx, "qty", e.target.value)
        }
      )), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 3 }, /* @__PURE__ */ React.createElement(Typography, { variant: "body1", sx: { color: "#1976d2", fontWeight: "bold" } }, "= ", area, " ", sqUnit)), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 3 }, /* @__PURE__ */ React.createElement(Box, { sx: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Typography, { variant: "body1", sx: { color: "#1976d2", fontWeight: "bold" } }, "(\u20B9 ", rowAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), ")"), /* @__PURE__ */ React.createElement(Box, null, /* @__PURE__ */ React.createElement(IconButton, { color: "primary", onClick: () => addDimensionRow(index) }, /* @__PURE__ */ React.createElement(AddCircleOutlineIcon, null)), item.dimensions.length > 1 && /* @__PURE__ */ React.createElement(IconButton, { color: "error", onClick: () => removeDimensionRow(index, dIdx) }, /* @__PURE__ */ React.createElement(RemoveCircleOutlineIcon, null))))))));
    }), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12 }, /* @__PURE__ */ React.createElement(Box, { sx: { px: 2, py: 1 } }, /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 2, alignItems: "center" }, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 4 }), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 2 }, /* @__PURE__ */ React.createElement(
      TextField,
      {
        name: "quantity",
        label: isVidhanMandalSelected ? "\u090F\u0915\u0942\u0923 \u0928\u0917" : "Total Qty",
        type: "text",
        inputProps: { inputMode: "numeric" },
        required: true,
        fullWidth: true,
        size: "small",
        value: item.quantity,
        InputProps: { readOnly: true, sx: { backgroundColor: "#f5f5f5" } }
      }
    )), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 3 }, /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle1", sx: { fontWeight: "bold", color: "#2e7d32" } }, "\u090F\u0915\u0942\u0923: ", totalCalculatedArea, " ", sqUnit)), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 3 }, /* @__PURE__ */ React.createElement(
      TextField,
      {
        label: isVidhanMandalSelected ? "\u090F\u0915\u0942\u0923 \u0930\u0915\u094D\u0915\u092E" : "Total Amount",
        type: "text",
        fullWidth: true,
        size: "small",
        value: calculateItemAmount(item, selectedCompany).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        InputProps: { readOnly: true, sx: { backgroundColor: "#f5f5f5", fontWeight: "bold" } }
      }
    )))))) : (
      /* STANDARD LAYOUT FOR NON-DIMENSION ITEMS */
      /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(
        TextField,
        {
          name: "quantity",
          label: isVidhanMandalSelected ? isAssemblyWork ? "\u090F\u0915\u0942\u0923 \u0928\u0917 (Total Qty)" : "\u0928\u0917" : "Quantity",
          type: "text",
          inputProps: { inputMode: "numeric" },
          required: true,
          fullWidth: true,
          value: item.quantity,
          onChange: (e) => handleWorkItemChange(index, e),
          disabled: ["Two_Camera_Setup", "Three_Camera_Setup"].includes(item.workMain) || isAssemblyWork
        }
      )), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, item.workMain === "Others" ? /* @__PURE__ */ React.createElement(
        TextField,
        {
          name: "customRate",
          label: "Custom Rate / Amount (Rs.)",
          type: "text",
          inputProps: { inputMode: "numeric" },
          fullWidth: true,
          value: item.customRate || "",
          onChange: (e) => handleWorkItemChange(index, e)
        }
      ) : /* @__PURE__ */ React.createElement(
        TextField,
        {
          label: isVidhanMandalSelected ? "\u0930\u0915\u092E" : "Amount",
          type: "text",
          fullWidth: true,
          value: calculateItemAmount(item, selectedCompany).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          InputProps: { readOnly: true, sx: { backgroundColor: "#f5f5f5" } }
        }
      )))
    ), !hidePersonnel && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12 }, /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle2", sx: { mt: 1, color: "text.secondary" } }, "Assigned Personnel")), (item.personnel || [{ name: "", number: "" }]).map((person, pIdx) => /* @__PURE__ */ React.createElement(React.Fragment, { key: pIdx }, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(
      Autocomplete,
      {
        freeSolo: true,
        options: Array.from(/* @__PURE__ */ new Set([
          ...historicalPersonnel.map((p) => p.name),
          ...formData.workItems.flatMap((wi) => (wi.personnel || []).map((p) => p.name).filter(Boolean))
        ])),
        inputValue: person.name || "",
        onInputChange: (e, newValue) => handlePersonnelChange(index, pIdx, "name", newValue || ""),
        renderInput: (params) => /* @__PURE__ */ React.createElement(
          TextField,
          {
            ...params,
            label: person.role ? `${person.role} Name` : `Photographer/Videographer ${pIdx + 1} Name`,
            fullWidth: true,
            size: "small"
          }
        )
      }
    )), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(
      TextField,
      {
        label: `Contact Number`,
        fullWidth: true,
        size: "small",
        type: "text",
        inputProps: { inputMode: "numeric" },
        value: person.number || "",
        onChange: (e) => handlePersonnelChange(index, pIdx, "number", e.target.value)
      }
    )))))))
  );
};
export default WorkOrderItem;
