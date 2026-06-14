import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status !== 404) {
      const message = error.response?.data?.detail || error.message || '请求失败';
      console.error('API Error:', message);
    }
    return Promise.reject(new Error(error.response?.data?.detail || error.message || '请求失败'));
  }
);

export const api = {
  auth: {
    sendCode: (data) => apiClient.post('/auth/send-code', data),
    verifyCode: (data) => apiClient.post('/auth/verify-code', data),
    me: (token) => apiClient.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  },

  projects: {
    list: (userId) => apiClient.get('/projects', { params: { user_id: userId } }),
    get: (projectId) => apiClient.get(`/projects/${projectId}`),
    create: (data) => apiClient.post('/projects', data),
    update: (projectId, data) => apiClient.put(`/projects/${projectId}`, data),
    delete: (projectId) => apiClient.delete(`/projects/${projectId}`),
    getUnits: (projectId) => apiClient.get(`/projects/${projectId}/units`),
    createUnit: (data) => apiClient.post('/projects/units', data),
    updateUnit: (unitId, data) => apiClient.put(`/projects/units/${unitId}`, data),
    deleteUnit: (unitId) => apiClient.delete(`/projects/units/${unitId}`),
    getTextSections: (projectId) => apiClient.get(`/projects/${projectId}/text-sections`),
    createTextSection: (data) => apiClient.post('/projects/text-sections', data),
    updateTextSection: (sectionId, data) => apiClient.put(`/projects/text-sections/${sectionId}`, data),
    deleteTextSection: (sectionId) => apiClient.delete(`/projects/text-sections/${sectionId}`),
    complete: (projectId, data) => apiClient.post(`/projects/${projectId}/complete`, data),
    getCompletedList: (userId) => apiClient.get('/projects/completed/list', { params: { user_id: userId } }),
    getCompleted: (projectId) => apiClient.get(`/projects/completed/${projectId}`),
    deleteCompleted: (projectId) => apiClient.delete(`/projects/completed/${projectId}`),
  },
  
  exhibits: {
    list: (params) => apiClient.get('/exhibits', { params }),
    getAll: () => apiClient.get('/exhibits/all'),
    search: (keyword) => apiClient.get('/exhibits/search', { params: { keyword } }),
    get: (exhibitId) => apiClient.get(`/exhibits/${exhibitId}`),
    create: (data) => apiClient.post('/exhibits', data),
    update: (exhibitId, data) => apiClient.put(`/exhibits/${exhibitId}`, data),
    delete: (exhibitId) => apiClient.delete(`/exhibits/${exhibitId}`),
    createBatch: (data) => apiClient.post('/exhibits/batch', data),
    deleteAll: () => apiClient.delete('/exhibits/all'),
  },
  
  ai: {
    generateNarrative: (data) => apiClient.post('/ai/narrative', data),
    generateUnits: (data) => apiClient.post('/ai/units', data),
    recommendExhibits: (data) => apiClient.post('/ai/recommend', data),
    recommendExhibitsBatch: (data) => apiClient.post('/ai/recommend-batch', data),
    generateTextSection: (data) => apiClient.post('/ai/text-section', data),
    generatePreface: (exhibitionTitle, unitCount, narrative, narrativeRhythm) => 
      apiClient.post('/ai/preface', {}, { params: { exhibition_title: exhibitionTitle, unit_count: unitCount, narrative_title: narrative?.title || '', narrative_desc: narrative?.desc || '', narrative_rhythm: narrativeRhythm ? JSON.stringify(narrativeRhythm) : '' } }),
    generateEpilogue: (exhibitionTitle, unitCount, narrative, narrativeRhythm) => 
      apiClient.post('/ai/epilogue', {}, { params: { exhibition_title: exhibitionTitle, unit_count: unitCount, narrative_title: narrative?.title || '', narrative_desc: narrative?.desc || '', narrative_rhythm: narrativeRhythm ? JSON.stringify(narrativeRhythm) : '' } }),
    generateOutline: (data) => apiClient.post('/ai/outline', data),
    health: () => apiClient.get('/ai/health'),
  },
  
  health: () => apiClient.get('/health'),
};

export default api;
