import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Button, CircularProgress, Alert, Divider, Chip
} from '@mui/material';
import api from '../api';
import Layout from '../components/Layout';

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('access')}` };
}

export default function BookingConfirm() {
    const { studioId, slotId } = useParams();
    const navigate = useNavigate();
    const [slot, setSlot] = useState(null);
    const [studio, setStudio] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get(`/api/studios/${studioId}/`),
            api.get(`/api/studios/${studioId}/availability/`),
        ]).then(([sRes, aRes]) => {
            setStudio(sRes.data);
            const found = aRes.data.find(s => String(s.id) === String(slotId));
            if (!found) setError('Créneau introuvable ou déjà réservé.');
            else setSlot(found);
        }).catch(() => setError('Impossible de charger les informations.'));
    }, [studioId, slotId]);

    const confirm = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('/api/bookings/', { slot: slotId }, { headers: authHeaders() });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.slot?.[0] || err.response?.data?.detail || 'Erreur lors de la réservation.');
        } finally {
            setLoading(false);
        }
    };

    if (error) return <Layout><Alert severity="error">{error}</Alert></Layout>;
    if (!slot || !studio) return <Layout><CircularProgress /></Layout>;

    const start = new Date(slot.start_time);
    const end = new Date(slot.end_time);
    const durationH = (end - start) / 3600000;

    return (
        <Layout>
            <Box sx={{ maxWidth: 480, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>Confirmer la réservation</Typography>

                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, my: 3 }}>
                    <Typography variant="h6" fontWeight={600}>{studio.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{studio.address}</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body1">
                        <strong>Date :</strong> {start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Horaire :</strong> {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Durée :</strong> {durationH}h
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" color="primary">
                        Total estimé : {studio.price_range || 'Sur devis'}
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disableElevation
                    onClick={confirm}
                    disabled={loading}
                >
                    {loading ? 'Réservation en cours...' : 'Confirmer la réservation'}
                </Button>
                <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate(-1)}>
                    Annuler
                </Button>
            </Box>
        </Layout>
    );
}
