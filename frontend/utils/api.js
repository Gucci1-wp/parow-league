import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data);
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.post('/auth/change-password', data),
};

// Leagues API
export const leaguesAPI = {
    getAll: () => api.get('/leagues'),
    getById: (id) => api.get(`/leagues/${id}`),
    create: (data) => api.post('/leagues', data),
    getSeasons: (id) => api.get(`/leagues/${id}/seasons`),
    createSeason: (id, data) => api.post(`/leagues/${id}/seasons`, data),
};

// Teams API
export const teamsAPI = {
    getAll: (params) => api.get('/teams', { params }),
    getById: (id) => api.get(`/teams/${id}`),
    create: (data) => api.post('/teams', data),
    addPlayer: (id, data) => api.post(`/teams/${id}/players`, data),
};

// Matches API
export const matchesAPI = {
    getAll: (params) => api.get('/matches', { params }),
    getById: (id) => api.get(`/matches/${id}`),
    create: (data) => api.post('/matches', data),
    submitResult: (id, data) => api.post(`/matches/${id}/result`, data),
    getSchedule: (divisionId, round) => api.get(`/matches/schedule/${divisionId}/${round}`),
};

// Standings API
export const standingsAPI = {
    getByDivision: (divisionId) => api.get(`/standings/division/${divisionId}`),
    getBySeason: (seasonId) => api.get(`/standings/season/${seasonId}`),
};

// Tournaments API
export const tournamentsAPI = {
    getAll: (params) => api.get('/tournaments', { params }),
    getById: (id) => api.get(`/tournaments/${id}`),
    create: (data) => api.post('/tournaments', data),
    generateBracket: (id, data) => api.post(`/tournaments/${id}/generate`, data),
};

// Players API
export const playersAPI = {
    getAll: () => api.get('/players'),
    getById: (id) => api.get(`/players/${id}`),
    create: (data) => api.post('/players', data),
};

// Stats API
export const statsAPI = {
    getTeamStats: (teamId) => api.get(`/stats/teams/${teamId}`),
    getPlayerStats: (playerId, params) => api.get(`/stats/players/${playerId}`, { params }),
};

// Notifications API
export const notificationsAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
