import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, Button, CircularProgress, Alert } from '@mui/material';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function StudioDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [studio, setStudio] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/api/studios/${id}/`)
            .then(r => setStudio(r.data))
            .catch(() => setError('Studio introuvable.'));
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Supprimer ce studio ?')) return;
        const token = localStorage.getItem('access');
        await api.delete(`/api/studios/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
        navigate('/studios');
    };

    if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;
    if (!studio) return <Layout><CircularProgress /></Layout>;

    const isOwner = user?.id === studio.owner?.id;

    return (
        <Layout>
            <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>{studio.name}</Typography>
                <Typography color="text.secondary" gutterBottom>{studio.address}</Typography>
                {studio.arrondissement && <Chip label={studio.arrondissement} size="small" sx={{ mb: 2 }} />}
                {studio.price_range && <Typography><strong>Tarif :</strong> {studio.price_range}</Typography>}
                {studio.description && <Typography sx={{ mt: 2 }}>{studio.description}</Typography>}
                {studio.phone && <Typography sx={{ mt: 1 }}><strong>Tél :</strong> {studio.phone}</Typography>}
                {studio.email && <Typography><strong>Email :</strong> {studio.email}</Typography>}
                {studio.website && <Typography><strong>Site :</strong> <a href={studio.website} target="_blank" rel="noopener noreferrer">{studio.website}</a></Typography>}

                {isOwner && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                        <Button variant="outlined" onClick={() => navigate(`/studios/${id}/edit`)}>Modifier</Button>
                        <Button variant="outlined" color="error" onClick={handleDelete}>Supprimer</Button>
                    </Box>
                )}
            </Box>
        </Layout>
    );
}
