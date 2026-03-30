import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('jwt');
    console.log(`[Axios Interceptor] URL: ${config.url} | Token exists: ${!!token}`);
    if (token) {
        if (config.headers && typeof config.headers.set === 'function') {
            config.headers.set('Authorization', `Bearer ${token}`);
            console.log("[Axios Interceptor] Header attached via .set()");
        } else {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("[Axios Interceptor] Header attached via assignment");
        }
    }
    console.log(`[Axios Interceptor] Final Auth Header for ${config.url}:`, config.headers?.get?.('Authorization') || config.headers?.Authorization);
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;
