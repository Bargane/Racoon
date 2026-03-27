import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const login = useCallback(async (username, password) => {
        const { data } = await api.post('/api/auth/login/', { username, password });
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        const me = await api.get('/api/auth/me/', {
            headers: { Authorization: `Bearer ${data.access}` },
        });
        localStorage.setItem('user', JSON.stringify(me.data));
        setUser(me.data);
    }, []);

    const register = useCallback(async (formData) => {
        const { data } = await api.post('/api/auth/register/', formData);
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
