interface AuthResponse {
    token: string;
    user: {
        id: number;
        username: string;
    };
}

// 修改 API 地址
const API_URL = 'http://localhost:5000/api';  // 确保这是正确的后端地址

export const login = async (
    username: string,
    password: string
): Promise<AuthResponse> => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Network error');
    }
};

export const register = async (
    username: string,
    password: string
): Promise<AuthResponse> => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Network error');
    }
};
