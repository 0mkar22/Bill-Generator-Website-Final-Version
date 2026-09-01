import axios from 'axios';
import { supabase } from '../supabase';

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api'
});

API.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const createWorkOrder = (workOrderData) => API.post('/workOrders', workOrderData);
export const getWorkOrders = () => API.get('/workOrders');

export const getCompanies = () => API.get('/companies');
export const createCompany = (data) => API.post('/companies', data);
export const updateCompany = (id, data) => API.put(`/companies/${id}`, data);

export const getTeam = () => API.get('/team');
export const upsertTeam = (data) => API.post('/team', data);

export default API;

export const updateInvoiceStatus = (id, status) => API.patch(`/invoices/${id}/status`, { status });
export const getPayouts = () => API.get('/personnelPayouts');
export const createPayout = (data) => API.post('/personnelPayouts', data);
export const deletePayout = (id) => API.delete(`/personnelPayouts/${id}`);

export const updatePayout = (id, data) => API.put(`/personnelPayouts/${id}`, data);
