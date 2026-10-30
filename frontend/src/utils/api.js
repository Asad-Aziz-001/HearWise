import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use(config => {
  const token = getToken();  // ✅ token through sessionStorage
  
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;