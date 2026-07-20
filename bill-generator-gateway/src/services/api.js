import axios from 'axios';
import { supabase } from '../supabase';

// We are explicitly setting the full URL with /api to prevent any path dropping
const API = axios.create({ 
  baseURL: 'https://bill-generator-backend-lh3k.onrender.com/api' 
});

// Add Interceptor to attach Supabase Token
API.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const createWorkOrder = (workOrderData) => API.post('/workOrders', workOrderData);
export const getWorkOrders = () => API.get('/workOrders');

// ... (Export any other API functions you have like getInvoices, etc.)

export default API;