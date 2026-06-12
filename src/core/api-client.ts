import axios from 'axios';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'; // Soporta variables de entorno de Railway/Vite
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }

    async executeCommand<T = any>(command: string, params: any = {}): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseUrl}/api/command`;
            const response = await axios.post(url, 
            {
                command,
                params
            });

            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Network error occurred',
                error: error.message
            };
        }
    }

    async post<T = any>(url: string, data: any): Promise<ApiResponse<T>> {
        try {
            const response = await axios.post(`${this.baseUrl}${url}`, data);
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Network error occurred',
                error: error.message
            };
        }
    }
}

export const api = new ApiClient();

