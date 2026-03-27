import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'artist' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(' ') : 'Erreur lors de l\'inscription.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6 }}>
                <Typography variant="h5" fontWeight={700} mb={3}>Créer un compte</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ToggleButtonGroup
                        value={form.role}
                        exclusive
                        onChange={(_, v) => v && setForm(f => ({ ...f, role: v }))}
                        fullWidth
                    >
                        <ToggleButton value="artist">Artiste</ToggleButton>
                        <ToggleButton value="owner">Propriétaire de studio</ToggleButton>
                    </ToggleButtonGroup>
                    <TextField label="Nom d'utilisateur" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                    <TextField label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    <TextField label="Mot de passe" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                    <Button type="submit" variant="contained" size="large" disableElevation disabled={loading}>
                        {loading ? 'Inscription...' : 'Créer mon compte'}
                    </Button>
                    <Typography variant="body2" textAlign="center">
                        Déjà un compte ? <RouterLink to="/login">Se connecter</RouterLink>
                    </Typography>
                </Box>
            </Box>
        </Layout>
    );
}
