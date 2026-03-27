import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.username, form.password);
            navigate('/');
        } catch {
            setError('Identifiants incorrects.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6 }}>
                <Typography variant="h5" fontWeight={700} mb={3}>Connexion</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Nom d'utilisateur" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                    <TextField label="Mot de passe" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                    <Button type="submit" variant="contained" size="large" disableElevation disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                    <Typography variant="body2" textAlign="center">
                        Pas encore de compte ? <RouterLink to="/register">S'inscrire</RouterLink>
                    </Typography>
                </Box>
            </Box>
        </Layout>
    );
}
