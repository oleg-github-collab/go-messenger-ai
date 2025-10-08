/**
 * API Utility - Centralized API calls with error handling
 * @module core/api
 */

import { Logger } from './logger.js';

const logger = new Logger('API');

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export class Api {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            }
        };

        try {
            logger.debug(`${options.method || 'GET'} ${url}`);

            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new ApiError(
                    data.error || `Request failed with status ${response.status}`,
                    response.status,
                    data
                );
            }

            logger.success(`${options.method || 'GET'} ${url}`, data);
            return data;
        } catch (error) {
            if (error instanceof ApiError) {
                logger.error(`${options.method || 'GET'} ${url} failed:`, error.message);
                throw error;
            }

            logger.error(`${options.method || 'GET'} ${url} network error:`, error);
            throw new ApiError('Network error', 0, error);
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

// Create default API instance
export const api = new Api('/api');

export default Api;
