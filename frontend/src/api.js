import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function getAuthToken() {
	const token = localStorage.getItem('token')?.trim();
	if (!token || token === 'undefined' || token === 'null') return null;
	return token;
}

const api = axios.create({
	baseURL: API_BASE,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Attach token automatically
api.interceptors.request.use((config) => {
	const token = getAuthToken();
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
		if (err.response?.status === 401) {
			localStorage.removeItem('token');
			if (window.location.pathname !== '/login') {
				window.location.assign('/login');
			}
		}
		if (err.response && err.response.data) {
			return Promise.reject(err.response.data);
		}
		return Promise.reject({ error: err.message });
	}
);

export default api;
