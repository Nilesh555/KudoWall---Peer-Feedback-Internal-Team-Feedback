import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

/**
 * Primary Axios Instance configured with HTTP-only credentials support
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryToken = localStorage.getItem('access_token') || null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAccessToken = () => inMemoryToken;

// ==============================================================================
// REQUEST INTERCEPTOR
// Injects Authorization: Bearer <token> header for authenticated endpoints
// ==============================================================================
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================================================================
// RESPONSE INTERCEPTOR
// Handles 401 Unauthorized errors with seamless token refresh and request retries
// ==============================================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not intercept refresh or login requests to avoid infinite retry loops
    const isAuthUrl =
      originalRequest.url?.includes('/accounts/login/') ||
      originalRequest.url?.includes('/accounts/token/refresh/') ||
      originalRequest.url?.includes('/accounts/signup/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${baseURL}/api/accounts/token/refresh/`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data?.access_token;
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        // Dispatch global logout event when refresh token is expired or invalid
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==============================================================================
// AUTHENTICATION API
// ==============================================================================
export const authService = {
  signup: async (userData) => {
    const res = await api.post('/api/accounts/signup/', userData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/api/accounts/login/', credentials);
    if (res.data?.access_token) {
      setAccessToken(res.data.access_token);
    }
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/api/accounts/logout/');
    } finally {
      setAccessToken(null);
    }
  },

  refreshToken: async () => {
    const res = await axios.post(
      `${baseURL}/api/accounts/token/refresh/`,
      {},
      { withCredentials: true }
    );
    const newAccessToken = res.data?.access_token;
    if (newAccessToken) {
      setAccessToken(newAccessToken);
    }
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post('/api/accounts/forgot-password/', { email });
    return res.data;
  },

  resetPassword: async (payload) => {
    const res = await api.post('/api/accounts/reset-password/', payload);
    return res.data;
  },

  verifyEmail: async (payload) => {
    const res = await api.post('/api/accounts/verify-email/', payload);
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await api.get('/api/profile/');
    return res.data;
  },
};

// ==============================================================================
// USERS API
// ==============================================================================
export const userService = {
  getProfile: async () => {
    const res = await api.get('/api/profile/');
    return res.data;
  },

  searchUsers: async (search = '', options = {}) => {
    const params = { search: search.trim(), ...options };
    const res = await api.get('/api/users/', { params });
    return res.data;
  },

  getUsers: async (params = {}) => {
    const res = await api.get('/api/users/', { params });
    return res.data;
  },

  getDepartments: async () => {
    const res = await api.get('/api/accounts/departments/');
    return res.data;
  },
};

// ==============================================================================
// KUDOS API
// ==============================================================================
export const kudosService = {
  createKudos: async (payload) => {
    const res = await api.post('/api/kudos/', payload);
    return res.data;
  },

  giveKudos: async (payload) => {
    const res = await api.post('/api/kudos/', payload);
    return res.data;
  },

  getKudosFeed: async (params = {}) => {
    const res = await api.get('/api/kudos/', { params });
    return res.data;
  },

  getFeed: async (params = {}) => {
    const res = await api.get('/api/kudos/', { params });
    return res.data;
  },

  getKudo: async (id) => {
    const res = await api.get(`/api/kudos/${id}/`);
    return res.data;
  },
};

// ==============================================================================
// REACTIONS API
// ==============================================================================
export const reactionService = {
  addReaction: async (kudosId, reactionType) => {
    const res = await api.post(`/api/kudos/${kudosId}/reactions/`, {
      reaction_type: reactionType,
    });
    return res.data;
  },

  removeReaction: async (kudosId, reactionType) => {
    const res = await api.delete(`/api/kudos/${kudosId}/reactions/`, {
      data: { reaction_type: reactionType },
    });
    return res.data;
  },

  getReactions: async (kudosId) => {
    const res = await api.get(`/api/kudos/${kudosId}/reactions/`);
    return res.data;
  },
};

// ==============================================================================
// LEADERBOARD API
// ==============================================================================
export const leaderboardService = {
  getLeaderboard: async (params = {}) => {
    const res = await api.get('/api/leaderboard/', { params });
    return res.data;
  },
};

// Direct Individual Named Exports matching assessment requirements
export const signup = authService.signup;
export const login = authService.login;
export const logout = authService.logout;
export const refreshToken = authService.refreshToken;
export const forgotPassword = authService.forgotPassword;
export const resetPassword = authService.resetPassword;
export const verifyEmail = authService.verifyEmail;
export const emailVerification = authService.verifyEmail;

export const getProfile = userService.getProfile;
export const searchUsers = userService.searchUsers;
export const getUsers = userService.getUsers;

export const createKudos = kudosService.createKudos;
export const getKudosFeed = kudosService.getKudosFeed;

export const addReaction = reactionService.addReaction;
export const removeReaction = reactionService.removeReaction;

export const getLeaderboard = leaderboardService.getLeaderboard;

// Unified API Service Export
export const apiService = {
  // Authentication
  signup: authService.signup,
  login: authService.login,
  logout: authService.logout,
  refreshToken: authService.refreshToken,
  forgotPassword: authService.forgotPassword,
  resetPassword: authService.resetPassword,
  verifyEmail: authService.verifyEmail,
  emailVerification: authService.verifyEmail,

  // Users
  getProfile: userService.getProfile,
  searchUsers: userService.searchUsers,
  getUsers: userService.getUsers,
  getDepartments: userService.getDepartments,

  // Kudos
  createKudos: kudosService.createKudos,
  giveKudos: kudosService.giveKudos,
  getKudosFeed: kudosService.getKudosFeed,
  getFeed: kudosService.getFeed,
  getKudo: kudosService.getKudo,

  // Reactions
  addReaction: reactionService.addReaction,
  removeReaction: reactionService.removeReaction,
  getReactions: reactionService.getReactions,

  // Leaderboard
  getLeaderboard: leaderboardService.getLeaderboard,
};

export default apiService;
