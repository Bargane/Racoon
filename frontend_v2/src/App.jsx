import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ColorModeContext } from './context/ColorModeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudioCreate from './pages/StudioCreate';
import StudioDetail from './pages/StudioDetail';
import AvailabilityManager from './pages/AvailabilityManager';
import Studios from './pages/Studios';
import BookingConfirm from './pages/BookingConfirm';
import Dashboard from './pages/Dashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import Payment from './pages/Payment';
import StudioMap from './pages/StudioMap';

export default function App() {
    const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'light');

    const colorMode = useMemo(() => ({
        mode,
        toggle: () => setMode(m => {
            const next = m === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', next);
            return next;
        }),
    }), [mode]);

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: { main: '#2a7a5a' },
            secondary: { main: '#8c9298' },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        shape: { borderRadius: 10 },
    }), [mode]);

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/studios" element={<Studios />} />
                            <Route path="/map" element={<StudioMap />} />
                            <Route path="/studios/:id" element={<StudioDetail />} />
                            <Route path="/studios/new" element={
                                <ProtectedRoute><StudioCreate /></ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                                <ProtectedRoute><Dashboard /></ProtectedRoute>
                            } />
                            <Route path="/bookings/:bookingId/pay" element={
                                <ProtectedRoute><Payment /></ProtectedRoute>
                            } />
                            <Route path="/owner/dashboard" element={
                                <ProtectedRoute><OwnerDashboard /></ProtectedRoute>
                            } />
                            <Route path="/studios/:studioId/book/:slotId" element={
                                <ProtectedRoute><BookingConfirm /></ProtectedRoute>
                            } />
                            <Route path="/studios/:id/availability" element={
                                <ProtectedRoute><AvailabilityManager /></ProtectedRoute>
                            } />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </ColorModeContext.Provider>
    );
}
