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
            primary: { main: '#2a7a5a', light: '#3da373', dark: '#1d5740' },
            secondary: { main: '#f5a623', light: '#f7ba55', dark: '#c07d0a' },
            background: {
                default: mode === 'light' ? '#f8f9fa' : '#0f1a15',
                paper: mode === 'light' ? '#ffffff' : '#1a2b22',
            },
            text: {
                primary: mode === 'light' ? '#1a2420' : '#e8f0ec',
                secondary: mode === 'light' ? '#5a7068' : '#8aab9a',
            },
        },
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h1: { fontWeight: 800, letterSpacing: '-1px' },
            h2: { fontWeight: 800, letterSpacing: '-0.5px' },
            h3: { fontWeight: 700, letterSpacing: '-0.5px' },
            h4: { fontWeight: 700 },
            h5: { fontWeight: 700 },
            h6: { fontWeight: 600 },
            button: { fontWeight: 600, textTransform: 'none' },
        },
        shape: { borderRadius: 10 },
        spacing: 8,
        components: {
            MuiButton: {
                defaultProps: { disableElevation: true },
                styleOverrides: {
                    root: { borderRadius: 8, padding: '8px 20px' },
                    sizeSmall: { padding: '5px 14px', fontSize: '0.8rem' },
                    sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
                },
            },
            MuiCard: {
                defaultProps: { elevation: 0 },
                styleOverrides: {
                    root: ({ theme }) => ({
                        border: `1px solid ${theme.palette.divider}`,
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
                    }),
                },
            },
            MuiTextField: {
                defaultProps: { size: 'small' },
            },
            MuiChip: {
                styleOverrides: { root: { fontWeight: 600 } },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.mode === 'light'
                            ? 'rgba(255,255,255,0.85)'
                            : 'rgba(26,43,34,0.85)',
                    }),
                },
            },
        },
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
