import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Investor API functions
export const investorApi = {
  // Get all investors with optional filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.geography) params.append('geography', filters.geography);
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.stage) params.append('stage', filters.stage);
    if (filters.cheque_size) params.append('cheque_size', filters.cheque_size);
    
    const response = await API.get(`/investors?${params.toString()}`);
    return response.data;
  },

  // Get new investors (last 24 hours)
  getNew: async () => {
    const response = await API.get('/investors/new');
    return response.data;
  },

  // Get filter options
  getFilters: async () => {
    const response = await API.get('/investors/filters');
    return response.data;
  },

  // Create new investor
  create: async (investor) => {
    const response = await API.post('/investors', investor);
    return response.data;
  },

  // Update investor
  update: async (id, investor) => {
    const response = await API.put(`/investors/${id}`, investor);
    return response.data;
  },

  // Delete investor
  delete: async (id) => {
    const response = await API.delete(`/investors/${id}`);
    return response.data;
  },

  // Extract investors from content using AI
  extract: async (content) => {
    const response = await API.post('/extract-investors', { content });
    return response.data;
  },

  // Export to Excel
  exportExcel: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.geography) params.append('geography', filters.geography);
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.stage) params.append('stage', filters.stage);
    
    const response = await API.get(`/investors/export?${params.toString()}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'investor_database.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
