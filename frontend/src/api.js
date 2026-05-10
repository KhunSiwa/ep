import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const api = axios.create({
	baseURL: API_BASE,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Attach token automatically
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers = config.headers || {};
		config.headers['Authorization'] = `Bearer ${token}`;
	}
	return config;
});

// Response interceptor to throw cleaner errors
api.interceptors.response.use(
	(res) => res,
	(err) => {
		if (err.response && err.response.data) {
			return Promise.reject(err.response.data);
		}
		return Promise.reject({ error: err.message });
	}
);

export default api;