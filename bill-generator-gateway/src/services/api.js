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

export default API;
