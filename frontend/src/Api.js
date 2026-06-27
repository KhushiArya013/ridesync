import axios from "axios";
export const BASE_URL = "https://ridesync-backend-rlsh.onrender.com";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("cr_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r.data,
  err => Promise.reject(err.response?.data || err)
);


export const ridesAPI = {
  create: (data) => api.post('/rides', data),
  list: (params) => api.get('/rides', { params }),
  available: () => api.get('/rides/available'),
  get: (id) => api.get(`/rides/${id}`),
  accept: (id) => api.patch(`/rides/${id}/accept`),
  start: (id) => api.patch(`/rides/${id}/start`),
  complete: (id) => api.patch(`/rides/${id}/complete`),
  cancel: (id, reason) => api.patch(`/rides/${id}/cancel`, { reason }),
  rate: (id, stars, feedback) => api.post(`/rides/${id}/rate`, { stars, feedback }),
}

export const driversAPI = {
  online: () => api.get('/drivers/online'),
  setStatus: (isOnline) => api.patch('/drivers/status', { isOnline }),
  updateLocation: (lat, lng) => api.patch('/drivers/location', { lat, lng }),
  dashboard: (id) => api.get(`/drivers/${id}/dashboard`),
}

export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  hourly: () => api.get('/analytics/hourly'),
  weekly: () => api.get('/analytics/weekly'),
  locations: () => api.get('/analytics/popular-locations'),
}

export const usersAPI = {
  profile: () => api.get('/users/profile'),
  update: (data) => api.patch('/users/profile', data),
}

export default api