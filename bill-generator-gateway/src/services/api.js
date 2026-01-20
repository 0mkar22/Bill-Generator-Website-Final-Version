import axios from 'axios';
import keycloak from '../keycloak';

const API = axios.create({ baseURL: '/api' });

// Add Interceptor to attach Token
API.interceptors.request.use((config) => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

export const createWorkOrder = (workOrderData) => API.post('/workOrders', workOrderData);
export const getWorkOrders = () => API.get('/workOrders');
// ... export other functions ...

export default API;