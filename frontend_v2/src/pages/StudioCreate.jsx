import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import api from '../api';
import Layout from '../components/Layout';

export default function StudioCreate() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', address: '', arrondissement: '', description: '', price_range: '', email: '', phone: '', website: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('access');
            const { data } = await api.post('/api/studios/', form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            navigate(`/studios/${data.id}`);
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur lors de la création.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" fontWeight={700} mb={3}>Ajouter mon studio</Typography>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Nom du studio" value={form.name} onChange={set('name')} required />
                    <TextField label="Adresse" value={form.address} onChange={set('address')} required />
                    <TextField label="Arrondissement" value={form.arrondissement} onChange={set('arrondissement')} />
                    <TextField label="Description" value={form.description} onChange={set('description')} multiline rows={3} />
                    <TextField label="Tarif (ex: 15-30€/h)" value={form.price_range} onChange={set('price_range')} />
                    <TextField label="Email" type="email" value={form.email} onChange={set('email')} />
                    <TextField label="Téléphone" value={form.phone} onChange={set('phone')} />
                    <TextField label="Site web" value={form.website} onChange={set('website')} />
                    <Button type="submit" variant="contained" size="large" disableElevation disabled={loading}>
                        {loading ? 'Création...' : 'Créer le studio'}
                    </Button>
                </Box>
            </Box>
        </Layout>
    );
}
