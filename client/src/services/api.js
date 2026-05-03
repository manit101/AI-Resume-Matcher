import axios from 'axios';

// Create Axios instance with base URL pointing to our Express server
const API = axios.create({
  baseURL: 'https://ai-resume-matcher-mihk.onrender.com/api',
});

// Interceptor to attach Firebase dummy token for auth middleware
API.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer DUMMY_TOKEN`;
  return config;
});

export const createJobDescription = async (title, description, requirements) => {
  const response = await API.post('/jds', { title, description, requirements });
  return response.data;
};

export const getJobDescriptions = async () => {
  const response = await API.get('/jds');
  return response.data;
};

export const uploadResume = async (fileName, fileUrl) => {
  const response = await API.post('/resumes', { fileName, fileUrl });
  return response.data;
};

export const getMatchResults = async (jobId) => {
  const response = await API.get(`/matches/${jobId}`);
  return response.data;
};

export const updateAction = async (matchId, action) => {
  const response = await API.post(`/matches/${matchId}/action`, { action });
  return response.data;
};
