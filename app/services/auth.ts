interface LoginResponse {
    token: string;
    user: {
        id: number;
        username: string;
    };
}

const API_URL = 'http://localhost:5000/api';

export const login = async (
    username: string,
    password: string
): Promise<LoginResponse> => {
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
        throw error;
    }
};

export const register = async (
    username: string,
    password: string
): Promise<LoginResponse> => {
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
        throw error;
    }
};
