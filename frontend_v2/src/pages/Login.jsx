import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Divider, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const TEST_ACCOUNTS = [
    { label: 'Artiste', username: 'artist1', password: 'test1234' },
    { label: 'Propriétaire', username: 'owner1', password: 'test1234' },
];

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

    const fillAccount = (account) => {
        setForm({ username: account.username, password: account.password });
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6 }}>
                <Typography variant="h5" fontWeight={700} mb={3}>Connexion</Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Nom d'utilisateur"
                        value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        required
                    />
                    <TextField
                        label="Mot de passe"
                        type="password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        required
                    />
                    <Button type="submit" variant="contained" size="large" disableElevation disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                    <Typography variant="body2" textAlign="center">
                        Pas encore de compte ? <RouterLink to="/register">S'inscrire</RouterLink>
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }}>
                    <Typography variant="caption" color="text.secondary">Comptes de test</Typography>
                </Divider>

                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                        Cliquez pour remplir automatiquement — mot de passe : <strong>test1234</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {TEST_ACCOUNTS.map(account => (
                            <Button
                                key={account.username}
                                variant="outlined"
                                size="small"
                                onClick={() => fillAccount(account)}
                                sx={{ flex: 1, textTransform: 'none', fontSize: '0.75rem' }}
                            >
                                {account.label}<br />
                                <Typography component="span" variant="caption" color="text.secondary">
                                    {account.username}
                                </Typography>
                            </Button>
                        ))}
                    </Box>
                </Paper>
            </Box>
        </Layout>
    );
}
