import { View, Text, ActivityIndicator } from 'react-native';
import axios from 'axios';

const BASE_URL = 'http://192.168.43.95:3000/api/';
// const BASE_URL = 'https://jsonplaceholder.typicode.com';
// const BASE_URL = 'http://192.168.1.123:3000/api';
//const BASE_URL = 'http://192.168.1.123:3000/api';
//const BASE_URL = 'https://lsbackend.laxmipanditservices.com/api';
//const BASE_URL = 'http://192.168.1.121:3000/api';
//const BASE_URL = 'https://bikeclinicbackend.luknos.com/api';


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiClient1 = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

apiClient.interceptors.request.use((config) => {
  if (config.method === 'get') {
    const url = new URL(config.url, 'http://dummybase'); // dummy base required for relative URLs
    url.searchParams.set('_ts', Date.now());
    config.url = url.pathname + url.search;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Define common API methods
const _get = (url, config = {}) => {
  return apiClient.get(url, config);
};

const _delete = (url, config = {}) => {
  return apiClient.delete(url, config);
};

const _put = (url, data = {}, config = {}) => {
  return apiClient.put(url, data, config);
};

const _post = (url, data = {}, config = {}) => {
  return apiClient.post(url, data, config);
};

const _postCustom = (url, data = {}, config = {}) => {
  return apiClient1.post(url, data, config);
};

// Loader function

// Export API methods
export default { _get, _delete, _put, _post, _postCustom }; 
