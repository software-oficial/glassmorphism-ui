import axios from 'axios';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

class ApiClient {
    private baseUrl: string;
    private tenantId: string = 'default_tenant';
    private userId: string = 'admin_user';

    constructor() {
        // Usamos ruta relativa para que el proxy del servidor maneje la petición y evite el CORS
        this.baseUrl = '/api';
    }

    async executeCommand<T = any>(command: string, params: any = {}): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseUrl}/command`;
            const response = await axios.post(url, 
            {
                command,
                params
            }, 
            {
                headers: {
                    'X-Tenant-ID': this.tenantId,
                    'X-User-ID': this.userId,
                    'Content-Type': 'application/json'
                }
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

    setTenant(tenantId: string) {
        this.tenantId = tenantId;
    }

    setUserId(userId: string) {
        this.userId = userId;
    }
}

export const api = new ApiClient();

