import { useEffect, useState } from 'react';
import {
    Box, Typography, Chip, Button, Divider, CircularProgress, Alert, Tab, Tabs, Paper
} from '@mui/material';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('access')}` };
}

const STATUS_COLORS = { pending: 'warning', confirmed: 'success', cancelled: 'default' };
const STATUS_LABELS = { pending: 'En attente', confirmed: 'Confirmée', cancelled: 'Annulée' };

export default function OwnerDashboard() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [error, setError] = useState('');

    const fetchBookings = () => {
        api.get('/api/owner/bookings/', { headers: authHeaders() })
            .then(r => setBookings(r.data))
            .catch(() => setError('Impossible de charger les réservations.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    const updateStatus = async (id, newStatus) => {
        await api.patch(`/api/bookings/${id}/`, { status: newStatus }, { headers: authHeaders() });
        fetchBookings();
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const upcoming = bookings.filter(b => new Date(b.slot.start_time) > now && b.status !== 'cancelled');
    const pending = bookings.filter(b => b.status === 'pending' && new Date(b.slot.start_time) > now);
    const past = bookings.filter(b => new Date(b.slot.start_time) <= now || b.status === 'cancelled');

    const monthRevenue = bookings
        .filter(b => {
            const d = new Date(b.slot.start_time);
            return b.status === 'confirmed' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + Number(b.total_price), 0);

    const displayed = tab === 0 ? upcoming : past;

    return (
        <Layout>
            <Box sx={{ maxWidth: 750, mx: 'auto' }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    Tableau de bord — {user?.username}
                </Typography>

                {/* Résumé */}
                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2, flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" color="text.secondary">Ce mois (confirmées)</Typography>
                        <Typography variant="h5" fontWeight={700} color="primary">{monthRevenue.toFixed(2)}€</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2, flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" color="text.secondary">À venir</Typography>
                        <Typography variant="h5" fontWeight={700}>{upcoming.length}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2, flex: 1, minWidth: 160 }}>
                        <Typography variant="body2" color="text.secondary">En attente</Typography>
                        <Typography variant="h5" fontWeight={700} color="warning.main">{pending.length}</Typography>
                    </Paper>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                    <Tab label={`À venir (${upcoming.length})`} />
                    <Tab label={`Passées (${past.length})`} />
                </Tabs>

                {loading ? <CircularProgress /> : displayed.length === 0 ? (
                    <Typography color="text.secondary">Aucune réservation.</Typography>
                ) : (
                    displayed.map(b => {
                        const start = new Date(b.slot.start_time);
                        const end = new Date(b.slot.end_time);
                        const isPending = b.status === 'pending' && start > now;
                        return (
                            <Box key={b.id} sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {b.artist.username}
                                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                                {b.artist.email}
                                            </Typography>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            {' · '}
                                            {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            {' – '}
                                            {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                        <Typography variant="body2">
                                            Montant : <strong>{Number(b.total_price).toFixed(2)}€</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Chip label={STATUS_LABELS[b.status]} color={STATUS_COLORS[b.status]} size="small" />
                                        {isPending && (
                                            <>
                                                <Button size="small" variant="contained" disableElevation onClick={() => updateStatus(b.id, 'confirmed')}>
                                                    Confirmer
                                                </Button>
                                                <Button size="small" color="error" onClick={() => updateStatus(b.id, 'cancelled')}>
                                                    Refuser
                                                </Button>
                                            </>
                                        )}
                                    </Box>
                                </Box>
                                <Divider sx={{ mt: 2 }} />
                            </Box>
                        );
                    })
                )}
            </Box>
        </Layout>
    );
}
