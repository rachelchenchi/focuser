import React, { createContext, useState, useContext, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null;
    userStats: UserStats;
    setUserStats: (stats: UserStats) => void;
    login: (token: string, user: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface UserStats {
    totalSessions: number;
    totalFocusTime: number;
    coins: number;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [userStats, setUserStats] = useState<UserStats>({
        totalSessions: 0,
        totalFocusTime: 0,
        coins: 0
    });

    const login = (newToken: string, newUser: any) => {
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const fetchUserStats = async (token: string) => {
        try {
            const response = await fetch('http://localhost:5000/api/user/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setUserStats(data);
        } catch (error) {
            console.error('Failed to fetch user stats:', error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchUserStats(token);
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, token, user, userStats, setUserStats, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
