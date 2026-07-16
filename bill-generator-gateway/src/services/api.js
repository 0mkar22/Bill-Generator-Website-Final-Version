import axios from 'axios';
import { supabase } from '../supabase';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || '/api' 
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
// ... export other functions ...

export default API;