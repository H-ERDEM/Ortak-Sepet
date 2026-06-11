/**
 * @file apiIstemcisi.js
 * @description Sunucuya atılan HTTP isteklerini (Axios ve customFetch wrapper'ı ile) kolaylaştıran,
 * CORS ve session cookie/kimlik doğrulama ayarlarını (`withCredentials`) yöneten ortak API istemcisidir.
 */
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Unified Axios client for session-based request authorization
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Custom Fetch wrapper to automatically include credentials and base URL
export const customFetch = async (url, options = {}) => {
  const absoluteUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  
  const mergedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return fetch(absoluteUrl, mergedOptions);
};

export { BASE_URL };
export default apiClient;
