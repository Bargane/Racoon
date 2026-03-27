import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudioCreate from './pages/StudioCreate';
import StudioDetail from './pages/StudioDetail';
import AvailabilityManager from './pages/AvailabilityManager';
import Studios from './pages/Studios';
import BookingConfirm from './pages/BookingConfirm';

const theme = createTheme({
    palette: {
        primary: { main: '#2a7a5a' },
        secondary: { main: '#8c9298' },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: { borderRadius: 10 },
});

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/studios" element={<Studios />} />
                        <Route path="/studios/:id" element={<StudioDetail />} />
                        <Route path="/studios/new" element={
                            <ProtectedRoute><StudioCreate /></ProtectedRoute>
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
    );
}
