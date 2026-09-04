import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Box,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import API, { getWorkOrders, createWorkOrder, getCompanies, getTeam, createCompany, updateCompany, upsertTeam } from "../services/api";
import { supabase } from "../supabase";
import { subWorks, venues, vendors, vidhanMandalWorks, noPersonnelWorks, bannerSubs } from "../constants/data";
import { calculateItemAmount, convertMarathiToEnglishNumbers } from "../utils/helpers";
import { useWorkOrderForm } from "../hooks/useWorkOrderForm";
import CompanyModal from "../components/CompanyModal";
import VenueModal from "../components/VenueModal";
import WorkOrderItem from "../components/WorkOrderItem";
const getRatesTemplateForCompany = (companyName = "") => {
  const isVidhan = companyName.includes("\u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0935\u093F\u0927\u093E\u0928 \u092E\u0902\u0921\u0933 \u0938\u091A\u093F\u0935\u093E\u0932\u092F");
  if (isVidhan) {
    const rates = {};
    Object.keys(vidhanMandalWorks).forEach((work) => {
      rates[work] = {};
      vidhanMandalWorks[work].forEach((sub) => {
        rates[work][sub] = "";
      });
    });
    return rates;
  }
  const baseLocations = ["Mumbai", "Panvel", "Uran", "Nhava", "Outstation"];
  const generateCategoryRates = (workMain) => {
    const rates = {};
    const rawSubWorks = subWorks[workMain] || [];
    const hasLocationPrefix = rawSubWorks.some(
      (sub) => ["mumbai", "panvel", "uran", "nhava", "outstation"].some((loc) => sub.toLowerCase().includes(loc))
    );
    if (hasLocationPrefix) {
      rawSubWorks.forEach((dur) => {
        rates[dur] = "";
      });
    } else {
      baseLocations.forEach((loc) => {
        rawSubWorks.forEach((dur) => {
          rates[`${loc}_${dur}`] = "";
        });
      });
    }
    return rates;
  };
  return {
    Still_Photography: generateCategoryRates("Still_Photography"),
    Videography: generateCategoryRates("Videography"),
    Two_Camera_Setup: generateCategoryRates("Two_Camera_Setup"),
    Three_Camera_Setup: generateCategoryRates("Three_Camera_Setup"),
    Live_Telecast: generateCategoryRates("Live_Telecast"),
    Storage: { "32GB": "", "64GB": "", "128GB": "", "256GB": "", "1TB": "", "2TB": "" }
  };
};
const WorkOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const editData = location.state?.editData;
  const [latestEntry, setLatestEntry] = useState(null);
  const [existingEntryNumbers, setExistingEntryNumbers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [historicalPersonnel, setHistoricalPersonnel] = useState([]);
  const [localVenues, setLocalVenues] = useState(() => {
    const saved = localStorage.getItem("customVenues");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.from(/* @__PURE__ */ new Set([...venues, ...parsed]));
      } catch (e) {
      }
    }
    return venues;
  });
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [newVenueText, setNewVenueText] = useState("");
  const [editingVenueOldName, setEditingVenueOldName] = useState(null);
  const [historicalContacts, setHistoricalContacts] = useState([]);
  const {
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
  } = useWorkOrderForm({
    entryNumber: "",
    eventDate: "",
    vendor: "ICOMP SYSTEMS",
    company_id: "",
    workItems: [
      {
        eventName: "",
        poNpo: "",
        eventTime: "",
        eventVenue: "",
        contactPerson: "",
        contactNumber: "",
        roomNumber: "",
        workMain: "",
        workSub: "",
        quantity: 1,
        customVenue: "",
        customWorkMain: "",
        customRate: "",
        dimensions: [{ length: "", breadth: "", qty: 1 }],
        assemblyDetails: [{ assemblyType: "", members: [""] }],
        personnel: [{ name: "", number: "" }]
      }
    ]
  }, historicalContacts, historicalPersonnel);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [expandedItem, setExpandedItem] = useState(0);
  const [newCompany, setNewCompany] = useState({
    company_name: "",
    address: "",
    gst_number: "",
    is_govt_client: false,
    requires_po_number: false,
    uses_marathi_labels: false,
    work_rates: getRatesTemplateForCompany()
  });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  useEffect(() => {
    if (!editingCompanyId && isCompanyModalOpen) {
      const isVidhan = newCompany.company_name.includes("\u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0935\u093F\u0927\u093E\u0928 \u092E\u0902\u0921\u0933 \u0938\u091A\u093F\u0935\u093E\u0932\u092F");
      const currentIsVidhan = Object.keys(newCompany.work_rates).includes("\u092B\u094B\u091F\u094B\u0917\u094D\u0930\u093E\u092B\u0940");
      if (isVidhan && !currentIsVidhan) {
        setNewCompany((prev) => ({ ...prev, work_rates: getRatesTemplateForCompany(prev.company_name) }));
      } else if (!isVidhan && currentIsVidhan) {
        setNewCompany((prev) => ({ ...prev, work_rates: getRatesTemplateForCompany(prev.company_name) }));
      }
    }
  }, [newCompany.company_name, isCompanyModalOpen, editingCompanyId]);
  const fetchCompanies = async () => {
    try {
      const response = await getCompanies();
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };
  const fetchTeamData = async () => {
    try {
      const response = await getTeam();
      setHistoricalPersonnel(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    }
  };
  const fetchLatestEntry = async () => {
    try {
      const response = await getWorkOrders();
      const workOrders = response.data.data || [];
      if (workOrders.length > 0) {
        const latest = workOrders.reduce(
          (max, order) => parseInt(order.entryNumber, 10) > parseInt(max.entryNumber, 10) ? order : max,
          { entryNumber: "0" }
        );
        setLatestEntry(latest.entryNumber);
        setExistingEntryNumbers(workOrders.map((o) => String(o.entryNumber)));
        const cMap = /* @__PURE__ */ new Map();
        workOrders.forEach((order) => {
          let wItems = [];
          if (typeof order.workItems === "string") {
            try {
              wItems = JSON.parse(order.workItems);
            } catch (e) {
            }
          } else if (Array.isArray(order.workItems)) {
            wItems = order.workItems;
          }
          wItems.forEach((item) => {
            if (item.contactPerson && item.contactNumber) {
              cMap.set(item.contactPerson.trim().toLowerCase(), {
                name: item.contactPerson.trim(),
                number: item.contactNumber.trim()
              });
            }
          });
        });
        setHistoricalContacts(Array.from(cMap.values()));
      }
    } catch (error) {
      console.error("Failed to fetch latest entry & history:", error);
    }
  };
  useEffect(() => {
    fetchCompanies();
    fetchLatestEntry();
    fetchTeamData();
    if (editData) {
      let parsedItems = [];
      if (Array.isArray(editData.workItems)) {
        parsedItems = editData.workItems;
      } else if (typeof editData.workItems === "string") {
        try {
          parsedItems = JSON.parse(editData.workItems);
        } catch (e) {
        }
      }
      if (parsedItems.length === 0) {
        parsedItems = [{
          eventName: "",
          poNpo: "",
          eventTime: "",
          eventVenue: "",
          contactPerson: "",
          contactNumber: "",
          roomNumber: "",
          workMain: "",
          workSub: "",
          quantity: 1,
          customVenue: "",
          customWorkMain: "",
          customRate: "",
          dimensions: [{ length: "", breadth: "", qty: 1 }],
          assemblyDetails: [{ assemblyType: "", members: [""] }],
          personnel: [{ name: "", number: "" }]
        }];
      } else {
        parsedItems = parsedItems.map((item) => {
          if (item.eventVenue === "Others") {
            item.eventVenue = item.customVenue || "Others";
          }
          if (item.eventVenue && !venues.includes(item.eventVenue)) {
            setLocalVenues((prev) => prev.includes(item.eventVenue) ? prev : [...prev, item.eventVenue]);
          }
          const qty = Number(item.quantity) || 1;
          let targetPersonnelCount = qty;
          if (item.workMain === "Two_Camera_Setup") targetPersonnelCount = 4;
          else if (item.workMain === "Three_Camera_Setup") targetPersonnelCount = 5;
          else if (item.workMain === "\u0932\u093E\u0908\u0935\u094D\u0939 \u0935\u094D\u0939\u093F\u0921\u093F\u0913 \u092E\u093F\u0915\u094D\u0938\u0930") targetPersonnelCount = 2;
          else if (noPersonnelWorks.includes(item.workMain)) targetPersonnelCount = 0;
          let personnel = item.personnel || [];
          if (item.workMain === "Two_Camera_Setup" && personnel.length === 0) {
            personnel = [
              { role: "Mixer Operator", name: "", number: "" },
              { role: "Camera Operator", name: "", number: "" },
              { role: "Camera Operator", name: "", number: "" },
              { role: "Assistant", name: "", number: "" }
            ];
          } else if (item.workMain === "Three_Camera_Setup" && personnel.length === 0) {
            personnel = [
              { role: "Mixer Operator", name: "", number: "" },
              { role: "Camera Operator", name: "", number: "" },
              { role: "Camera Operator", name: "", number: "" },
              { role: "Camera Operator", name: "", number: "" },
              { role: "Assistant", name: "", number: "" }
            ];
          } else {
            if (personnel.length < targetPersonnelCount) {
              for (let i = personnel.length; i < targetPersonnelCount; i++) {
                personnel.push({ name: "", number: "" });
              }
            } else if (personnel.length > targetPersonnelCount) {
              personnel = personnel.slice(0, targetPersonnelCount);
            }
            if (item.workMain === "Two_Camera_Setup" && personnel.length === 4 && !personnel[0].role) {
              const roles = ["Mixer Operator", "Camera Operator", "Camera Operator", "Assistant"];
              personnel = personnel.map((p, i) => ({ ...p, role: roles[i] }));
            } else if (item.workMain === "Three_Camera_Setup" && personnel.length === 5 && !personnel[0].role) {
              const roles = ["Mixer Operator", "Camera Operator", "Camera Operator", "Camera Operator", "Assistant"];
              personnel = personnel.map((p, i) => ({ ...p, role: roles[i] }));
            }
          }
          let dimensions = item.dimensions || [];
          if (dimensions.length === 0 && (item.length || item.breadth)) {
            dimensions = [{ length: item.length || "", breadth: item.breadth || "", qty }];
          }
          let assemblyDetails = item.assemblyDetails || [];
          if (assemblyDetails.length > 0 && assemblyDetails[0].memberName !== void 0) {
            const grouped = {};
            assemblyDetails.forEach((ad) => {
              const type = ad.assemblyType || "";
              if (!grouped[type]) grouped[type] = [];
              if (ad.memberName) grouped[type].push(ad.memberName);
            });
            assemblyDetails = Object.keys(grouped).map((type) => ({ assemblyType: type, members: grouped[type].length ? grouped[type] : [""] }));
          } else if (assemblyDetails.length === 0) {
            if (item.assemblyType || item.memberName) {
              assemblyDetails = [{ assemblyType: item.assemblyType || "", members: [item.memberName || ""] }];
            } else {
              assemblyDetails = [{ assemblyType: "", members: [""] }];
            }
          }
          return {
            ...item,
            dimensions,
            assemblyDetails,
            personnel
          };
        });
      }
      let formattedDate = "";
      if (editData.eventDate) {
        try {
          const dateObj = new Date(editData.eventDate);
          if (!isNaN(dateObj)) {
            formattedDate = dateObj.toISOString().split("T")[0];
          }
        } catch (e) {
        }
      }
      setFormData({
        id: editData.id || editData._id || "",
        entryNumber: editData.entryNumber || "",
        eventDate: formattedDate,
        vendor: editData.vendor || "",
        company_id: editData.company_id || "",
        workItems: parsedItems
      });
    }
  }, [editData]);
  const getFilteredSubWorks = (workMain, company) => {
    const companyName = company?.company_name?.toUpperCase() || "";
    const isVidhan = company?.uses_marathi_labels === true || companyName.includes("\u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0935\u093F\u0927\u093E\u0928 \u092E\u0902\u0921\u0933 \u0938\u091A\u093F\u0935\u093E\u0932\u092F");
    if (isVidhan && vidhanMandalWorks[workMain]) {
      return vidhanMandalWorks[workMain];
    }
    if (workMain === "Storage") {
      return subWorks["Storage"] || ["32GB", "64GB", "128GB", "256GB", "1TB", "2TB"];
    }
    const isONGC = company?.requires_po_number === true || companyName.includes("ONGC") || companyName.includes("OIL & NATURAL GAS") || companyName.includes("OIL AND NATURAL GAS");
    const allowedLocations = isONGC ? ["Mumbai", "Panvel", "Uran", "Nhava", "Outstation"] : ["Mumbai", "Outstation"];
    const rawSubWorks = subWorks[workMain] || [];
    const hasLocationPrefix = rawSubWorks.some(
      (sub) => ["mumbai", "panvel", "uran", "nhava", "outstation"].some((loc) => sub.toLowerCase().includes(loc))
    );
    if (hasLocationPrefix) {
      return rawSubWorks.filter(
        (sub) => allowedLocations.some((loc) => sub.toLowerCase().includes(loc.toLowerCase()))
      );
    }
    if (rawSubWorks.length > 0) {
      const combinations = [];
      allowedLocations.forEach((loc) => {
        rawSubWorks.forEach((dur) => {
          combinations.push(`${loc}_${dur}`);
        });
      });
      return combinations;
    }
    return allowedLocations;
  };
  const handleOpenAddCompany = () => {
    setEditingCompanyId(null);
    setNewCompany({
      company_name: "",
      address: "",
      gst_number: "",
      work_rates: getRatesTemplateForCompany()
    });
    setIsCompanyModalOpen(true);
  };
  const handleEditCompanyClick = (e, company) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCompanyId(company.id);
    const existingRates = company.work_rates || {};
    const mergedRates = getRatesTemplateForCompany(company.company_name);
    for (const key in mergedRates) {
      if (typeof mergedRates[key] === "object") {
        mergedRates[key] = { ...mergedRates[key], ...existingRates[key] || {} };
      } else {
        mergedRates[key] = existingRates[key] !== void 0 ? existingRates[key] : "";
      }
    }
    setNewCompany({
      company_name: company.company_name || "",
      address: company.address || "",
      gst_number: company.gst_number || "",
      work_rates: mergedRates
    });
    setIsCompanyModalOpen(true);
  };
  const handleRateChange = (workType, subType, value) => {
    setNewCompany((prev) => {
      const updatedRates = { ...prev.work_rates };
      if (subType) {
        updatedRates[workType] = {
          ...updatedRates[workType],
          [subType]: value === "" ? "" : Number(value)
        };
      } else {
        updatedRates[workType] = value === "" ? "" : Number(value);
      }
      return { ...prev, work_rates: updatedRates };
    });
  };
  const handleSaveCompany = async (e) => {
    if (e) e.preventDefault();
    try {
      const companyNameStr = newCompany.company_name?.toUpperCase() || "";
      const isONGC = newCompany.requires_po_number === true || companyNameStr.includes("ONGC") || companyNameStr.includes("OIL & NATURAL GAS") || companyNameStr.includes("OIL AND NATURAL GAS");
      const isModalVidhan = newCompany.uses_marathi_labels === true || companyNameStr.includes("\u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0935\u093F\u0927\u093E\u0928 \u092E\u0902\u0921\u0933 \u0938\u091A\u093F\u0935\u093E\u0932\u092F");
      const allowedLocations = isONGC ? ["Mumbai", "Panvel", "Uran", "Nhava", "Outstation"] : ["Mumbai", "Outstation"];
      const cleanedRates = JSON.parse(JSON.stringify(newCompany.work_rates));
      if (!isModalVidhan) {
        Object.keys(cleanedRates).forEach((category) => {
          if (typeof cleanedRates[category] === "object" && cleanedRates[category] !== null && category !== "Storage") {
            Object.keys(cleanedRates[category]).forEach((subKey) => {
              const isAllowed = allowedLocations.some((loc) => subKey.includes(loc));
              if (!isAllowed) {
                delete cleanedRates[category][subKey];
              }
            });
          }
        });
      }
      const payloadToSave = { ...newCompany, work_rates: cleanedRates };
      if (editingCompanyId) {
        const response = await updateCompany(editingCompanyId, payloadToSave);
        const data = response.data.data;
        setCompanies((prev) => prev.map((c) => c.id === editingCompanyId ? data : c));
        setSnackbar({ open: true, message: "Company updated successfully!", severity: "success" });
      } else {
        const response = await createCompany(payloadToSave);
        const data = response.data.data;
        setCompanies((prev) => [...prev, data]);
        setFormData((prev) => ({ ...prev, company_id: data.id }));
        setSnackbar({ open: true, message: "Company added successfully!", severity: "success" });
      }
      setIsCompanyModalOpen(false);
    } catch (error) {
      console.error("Failed to save company:", error);
      setSnackbar({ open: true, message: "Failed to save company data.", severity: "error" });
    }
  };
  const selectedCompany = companies.find((c) => c.id === formData.company_id) || null;
  const selectedCompanyNameStr = selectedCompany?.company_name?.toUpperCase() || "";
  const isONGCSelected = selectedCompany?.requires_po_number === true || selectedCompanyNameStr.includes("ONGC") || selectedCompanyNameStr.includes("OIL & NATURAL GAS") || selectedCompanyNameStr.includes("OIL AND NATURAL GAS");
  const isVidhanMandalSelected = selectedCompany?.uses_marathi_labels === true || selectedCompany?.company_name?.includes("\u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0935\u093F\u0927\u093E\u0928 \u092E\u0902\u0921\u0933 \u0938\u091A\u093F\u0935\u093E\u0932\u092F") || false;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payloadToSubmit = JSON.parse(JSON.stringify(formData));
      if (payloadToSubmit.workItems && payloadToSubmit.workItems.length > 0) {
        const commonFields = {
          eventName: payloadToSubmit.workItems[0].eventName,
          eventVenue: payloadToSubmit.workItems[0].eventVenue,
          eventTime: payloadToSubmit.workItems[0].eventTime,
          contactPerson: payloadToSubmit.workItems[0].contactPerson,
          contactNumber: payloadToSubmit.workItems[0].contactNumber,
          poNpo: payloadToSubmit.workItems[0].poNpo,
          customVenue: payloadToSubmit.workItems[0].customVenue,
          roomNumber: payloadToSubmit.workItems[0].roomNumber
        };
        payloadToSubmit.workItems = payloadToSubmit.workItems.map((item) => ({
          ...item,
          ...commonFields
        }));
      }
      if (!isONGCSelected) {
        payloadToSubmit.workItems = payloadToSubmit.workItems.map((item) => ({
          ...item,
          poNpo: "N/A"
        }));
      }
      if (isVidhanMandalSelected) {
        payloadToSubmit.workItems = payloadToSubmit.workItems.map((item) => ({
          ...item,
          contactPerson: "",
          contactNumber: ""
        }));
      } else {
        payloadToSubmit.workItems = payloadToSubmit.workItems.map((item) => ({
          ...item,
          roomNumber: ""
        }));
      }
      const newTeamMembers = [];
      const seenNames = new Set(historicalPersonnel.map((p) => p.name.toLowerCase()));
      payloadToSubmit.workItems.forEach((item) => {
        (item.personnel || []).forEach((p) => {
          const pName = p.name?.trim();
          const pNumber = p.number?.trim();
          if (pName && pNumber && !seenNames.has(pName.toLowerCase())) {
            seenNames.add(pName.toLowerCase());
            newTeamMembers.push({ name: pName, number: pNumber });
          }
        });
      });
      if (newTeamMembers.length > 0) {
        await upsertTeam(newTeamMembers);
        fetchTeamData();
      }
      if (editData) {
        await API.put(`/workOrders/${formData.id}`, payloadToSubmit);
        setSnackbar({ open: true, message: "Work Order updated successfully!", severity: "success" });
        setTimeout(() => navigate("/reports"), 1e3);
      } else {
        await createWorkOrder(payloadToSubmit);
        setSnackbar({ open: true, message: "Work Order created successfully!", severity: "success" });
        setFormData({
          entryNumber: "",
          eventDate: "",
          vendor: "ICOMP SYSTEMS",
          company_id: "",
          workItems: [{ eventName: "", poNpo: "", eventTime: "", eventVenue: "", contactPerson: "", contactNumber: "", roomNumber: "", workMain: "", workSub: "", quantity: 1, customVenue: "", customWorkMain: "", customRate: "", dimensions: [{ length: "", breadth: "", qty: 1 }], assemblyDetails: [{ assemblyType: "", members: [""] }], personnel: [{ name: "", number: "" }] }]
        });
        fetchLatestEntry();
      }
    } catch (error) {
      console.error("Failed to save work order:", error);
      const serverError = error.response?.data?.error;
      const msg = Array.isArray(serverError) ? serverError.join(", ") : serverError || "Failed to save work order. Please ensure all required fields are filled correctly.";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };
  const isEntryNumberDuplicate = existingEntryNumbers.includes(String(formData.entryNumber)) && (!editData || String(editData.entryNumber) !== String(formData.entryNumber));
  return /* @__PURE__ */ React.createElement(Container, { component: Paper, sx: { p: 4, mt: 4 } }, /* @__PURE__ */ React.createElement(Typography, { variant: "h4", gutterBottom: true, align: "center" }, editData ? "Edit Event Data" : "Event Data Entry"), /* @__PURE__ */ React.createElement(Box, { component: "form", onSubmit: handleSubmit }, /* @__PURE__ */ React.createElement(Grid, { container: true, spacing: 3 }, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 3 }, /* @__PURE__ */ React.createElement(FormControl, { fullWidth: true, required: true }, /* @__PURE__ */ React.createElement(InputLabel, null, "Vendor"), /* @__PURE__ */ React.createElement(Select, { name: "vendor", value: formData.vendor, label: "Vendor", onChange: handleMainChange }, vendors.map((v) => /* @__PURE__ */ React.createElement(MenuItem, { key: v, value: v }, v))))), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(FormControl, { fullWidth: true }, /* @__PURE__ */ React.createElement(InputLabel, null, "Select Company"), /* @__PURE__ */ React.createElement(
    Select,
    {
      name: "company_id",
      value: formData.company_id,
      label: "Select Company",
      onChange: handleMainChange,
      renderValue: (selectedId) => {
        if (!selectedId) return "";
        const selectedComp = companies.find((c) => c.id === selectedId);
        return selectedComp ? selectedComp.company_name : "";
      }
    },
    /* @__PURE__ */ React.createElement(MenuItem, { value: "", onClick: handleOpenAddCompany }, /* @__PURE__ */ React.createElement("em", null, "+ Add New Company")),
    companies.map((c) => /* @__PURE__ */ React.createElement(MenuItem, { key: c.id, value: c.id, sx: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, c.company_name, /* @__PURE__ */ React.createElement(
      IconButton,
      {
        type: "button",
        size: "small",
        onClick: (e) => handleEditCompanyClick(e, c),
        sx: { ml: 2, padding: "2px" }
      },
      /* @__PURE__ */ React.createElement(EditIcon, { fontSize: "small", color: "action" })
    )))
  ))), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 3 }, /* @__PURE__ */ React.createElement(
    TextField,
    {
      name: "entryNumber",
      label: "Entry Number",
      required: true,
      fullWidth: true,
      error: isEntryNumberDuplicate,
      value: formData.entryNumber,
      onChange: handleMainChange,
      helperText: isEntryNumberDuplicate ? "This entry number is already used!" : latestEntry ? `Last entry was: ${latestEntry}` : "Enter the first entry number."
    }
  )), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(TextField, { name: "eventName", label: isVidhanMandalSelected ? "\u0915\u093E\u092E\u093E\u091A\u0947 \u0928\u093E\u0902\u0935" : "Event Name", required: true, fullWidth: true, value: formData.workItems[0].eventName, onChange: (e) => handleWorkItemChange(0, e) })), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(FormControl, { fullWidth: true, required: true }, /* @__PURE__ */ React.createElement(InputLabel, null, isVidhanMandalSelected ? "\u0915\u093E\u092E\u093E\u091A\u0947 \u0938\u094D\u0925\u0933" : "Event Venue"), /* @__PURE__ */ React.createElement(
    Select,
    {
      name: "eventVenue",
      value: formData.workItems[0].eventVenue,
      label: isVidhanMandalSelected ? "\u0920\u093F\u0915\u093E\u0923 \u0928\u093F\u0935\u0921\u093E" : "Event Venue",
      onChange: (e) => {
        if (e.target.value === "__add_venue__") {
          handleWorkItemChange(0, { target: { name: "eventVenue", value: "" } });
        } else {
          handleWorkItemChange(0, e);
        }
      },
      renderValue: (selected) => selected
    },
    /* @__PURE__ */ React.createElement(MenuItem, { value: "__add_venue__", onClick: () => {
      setEditingVenueOldName(null);
      setNewVenueText("");
      setIsVenueModalOpen(true);
    } }, /* @__PURE__ */ React.createElement("em", null, "+ Add Venue")),
    localVenues.map((v) => /* @__PURE__ */ React.createElement(MenuItem, { key: v, value: v, sx: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, v, /* @__PURE__ */ React.createElement(
      IconButton,
      {
        type: "button",
        size: "small",
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          setEditingVenueOldName(v);
          setNewVenueText(v);
          setIsVenueModalOpen(true);
        },
        sx: { ml: 2, padding: "2px" }
      },
      /* @__PURE__ */ React.createElement(EditIcon, { fontSize: "small", color: "action" })
    )))
  ))), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(TextField, { name: "eventDate", label: isVidhanMandalSelected ? "\u0915\u093E\u092E\u093E\u091A\u093E \u0926\u093F\u0928\u093E\u0902\u0915" : "Event Date", type: "date", required: true, fullWidth: true, InputLabelProps: { shrink: true }, value: formData.eventDate, onChange: handleMainChange })), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(TextField, { name: "eventTime", label: "Event Time", type: "time", required: true, fullWidth: true, InputLabelProps: { shrink: true }, value: formData.workItems[0].eventTime, onChange: (e) => handleWorkItemChange(0, e) })), isVidhanMandalSelected ? /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 12 }, /* @__PURE__ */ React.createElement(
    TextField,
    {
      name: "roomNumber",
      label: "\u0915\u0915\u094D\u0937 \u0915\u094D\u0930\u092E\u093E\u0902\u0915",
      required: true,
      fullWidth: true,
      value: formData.workItems[0].roomNumber || "",
      onChange: (e) => handleWorkItemChange(0, e)
    }
  )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(
    Autocomplete,
    {
      freeSolo: true,
      options: Array.from(/* @__PURE__ */ new Set([
        ...historicalContacts.map((c) => c.name),
        ...formData.workItems.map((wi) => wi.contactPerson).filter(Boolean)
      ])),
      inputValue: formData.workItems[0].contactPerson || "",
      onInputChange: (e, newValue) => handleWorkItemChange(0, { target: { name: "contactPerson", value: newValue || "" } }),
      renderInput: (params) => /* @__PURE__ */ React.createElement(
        TextField,
        {
          ...params,
          label: "Contact Person",
          required: true,
          fullWidth: true
        }
      )
    }
  )), /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(
    TextField,
    {
      name: "contactNumber",
      label: "Contact Number",
      required: true,
      fullWidth: true,
      type: "text",
      inputProps: { inputMode: "numeric" },
      value: formData.workItems[0].contactNumber,
      onChange: (e) => handleWorkItemChange(0, e)
    }
  ))), isONGCSelected && /* @__PURE__ */ React.createElement(Grid, { item: true, xs: 12, sm: 6 }, /* @__PURE__ */ React.createElement(FormControl, { fullWidth: true, required: true }, /* @__PURE__ */ React.createElement(InputLabel, null, "PO/NPO"), /* @__PURE__ */ React.createElement(Select, { name: "poNpo", value: formData.workItems[0].poNpo, label: "PO/NPO", onChange: (e) => handleWorkItemChange(0, e) }, /* @__PURE__ */ React.createElement(MenuItem, { value: "PO" }, "PO"), /* @__PURE__ */ React.createElement(MenuItem, { value: "NPO" }, "NPO"))))), formData.workItems.map((item, index) => {
    return /* @__PURE__ */ React.createElement(
      WorkOrderItem,
      {
        key: index,
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
      }
    );
  }), /* @__PURE__ */ React.createElement(Button, { type: "button", startIcon: /* @__PURE__ */ React.createElement(AddCircleOutlineIcon, null), onClick: () => {
    addWorkItem();
    setExpandedItem(formData.workItems.length);
  }, sx: { mt: 2 } }, "Add Another Item"), /* @__PURE__ */ React.createElement(Button, { type: "submit", fullWidth: true, variant: "contained", size: "large", sx: { mt: 3 }, disabled: submitting || isEntryNumberDuplicate }, submitting ? /* @__PURE__ */ React.createElement(CircularProgress, { size: 24, color: "inherit" }) : editData ? "Update The Data" : "Save The Data")), /* @__PURE__ */ React.createElement(
    CompanyModal,
    {
      isCompanyModalOpen,
      setIsCompanyModalOpen,
      editingCompanyId,
      newCompany,
      setNewCompany,
      handleSaveCompany,
      getFilteredSubWorks
    }
  ), /* @__PURE__ */ React.createElement(Snackbar, { open: snackbar.open, autoHideDuration: 6e3, onClose: () => setSnackbar((s) => ({ ...s, open: false })) }, /* @__PURE__ */ React.createElement(Alert, { onClose: () => setSnackbar((s) => ({ ...s, open: false })), severity: snackbar.severity, sx: { width: "100%" } }, snackbar.message)), /* @__PURE__ */ React.createElement(
    VenueModal,
    {
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
    }
  ));
};
export default WorkOrder;
