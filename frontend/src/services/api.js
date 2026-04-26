import axios from "axios";

const api = axios.create({
    baseURL : 'http://localhost:8080/api',
    headers : {
        'Content-Type' : 'application/json'
    }
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      // Don't redirect on public pages (register, login, home)
      if (path !== '/login' && path !== '/register' && path !== '/') {
        console.warn("Session expired or unauthorized. Logging out...");
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;