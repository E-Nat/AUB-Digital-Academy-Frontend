// ==========================================
// AUB Digital Academy - Centralized API Client
// Handles authentication headers, timeouts, and standardized error normalization
// ==========================================

(function (global) {
    'use strict';

    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.protocol === 'file:';
    
    const DEFAULT_API_BASE = (isLocal && window.location.port !== '5000') 
        ? 'http://localhost:5000/api' 
        : '/api';

    class ApiClient {
        constructor(baseUrl = DEFAULT_API_BASE) {
            this.baseUrl = baseUrl;
            this.defaultTimeoutMs = 2500;
        }

        getAuthToken() {
            let token = localStorage.getItem('aub_auth_token') || 
                        localStorage.getItem('token') || 
                        sessionStorage.getItem('aub_auth_token') || 
                        sessionStorage.getItem('token') || '';
            
            if (!token && global.AdminStore && typeof global.AdminStore.ensureDefaultAdminSession === 'function') {
                try {
                    global.AdminStore.ensureDefaultAdminSession();
                    token = localStorage.getItem('aub_auth_token') || sessionStorage.getItem('aub_auth_token') || '';
                } catch (e) {}
            }
            return token;
        }

        getHeaders(customHeaders = {}) {
            const token = this.getAuthToken();
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...customHeaders
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            return headers;
        }

        async request(endpoint, options = {}) {
            const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
            const timeoutMs = options.timeout || this.defaultTimeoutMs;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const fetchOptions = {
                method: options.method || 'GET',
                headers: this.getHeaders(options.headers),
                signal: controller.signal,
                ...options
            };

            if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
                fetchOptions.body = JSON.stringify(options.body);
            }

            try {
                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);

                let data = null;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json().catch(() => null);
                } else {
                    data = await response.text().catch(() => null);
                }

                if (!response.ok) {
                    const errorMsg = (data && data.message) ? data.message : `Request failed with status ${response.status}`;
                    const error = new Error(errorMsg);
                    error.status = response.status;
                    error.data = data;
                    error.isApiError = true;
                    if (response.status === 409 || (data && data.field === 'programCode')) {
                        error.isDuplicate = true;
                        error.field = data?.field || 'programCode';
                    }
                    if (response.status === 401) {
                        error.isUnauthorized = true;
                    }
                    throw error;
                }

                return data;
            } catch (err) {
                clearTimeout(timeoutId);

                if (err.name === 'AbortError') {
                    const timeoutError = new Error('Connection timed out. Please try again.');
                    timeoutError.isTimeout = true;
                    timeoutError.isNetworkError = true;
                    throw timeoutError;
                }

                if (err.name === 'TypeError' || (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')))) {
                    const netError = new Error('Connection error. Please check your connection and try again.');
                    netError.isNetworkError = true;
                    throw netError;
                }

                throw err;
            }
        }

        get(endpoint, options = {}) {
            return this.request(endpoint, { ...options, method: 'GET' });
        }

        post(endpoint, body, options = {}) {
            return this.request(endpoint, { ...options, method: 'POST', body });
        }

        put(endpoint, body, options = {}) {
            return this.request(endpoint, { ...options, method: 'PUT', body });
        }

        patch(endpoint, body, options = {}) {
            return this.request(endpoint, { ...options, method: 'PATCH', body });
        }

        delete(endpoint, options = {}) {
            return this.request(endpoint, { ...options, method: 'DELETE' });
        }
    }

    const apiClient = new ApiClient();
    global.ApiClient = ApiClient;
    global.apiClient = apiClient;

})(typeof window !== 'undefined' ? window : this);
