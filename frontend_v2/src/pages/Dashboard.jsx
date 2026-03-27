import { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Chip, Button, Divider, CircularProgress, Alert, Tab, Tabs
} from '@mui/material';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('access')}` };
}

const STATUS_COLORS = { pending: 'warning', confirmed: 'success', cancelled: 'default' };
const STATUS_LABELS = { pending: 'En attente', confirmed: 'Confirmée', cancelled: 'Annulée' };

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [error, setError] = useState('');

    const fetchBookings = () => {
        api.get('/api/bookings/', { headers: authHeaders() })
            .then(r => setBookings(r.data))
            .catch(() => setError('Impossible de charger les réservations.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    const cancel = async (id) => {
        await api.patch(`/api/bookings/${id}/`, { status: 'cancelled' }, { headers: authHeaders() });
        fetchBookings();
    };

    const now = new Date();
    const upcoming = bookings.filter(b => new Date(b.slot.start_time) > now && b.status !== 'cancelled');
    const past = bookings.filter(b => new Date(b.slot.start_time) <= now || b.status === 'cancelled');
    const displayed = tab === 0 ? upcoming : past;

    return (
        <Layout>
            <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    Bonjour, {user?.username}
                </Typography>

                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                    <Tab label={`À venir (${upcoming.length})`} />
                    <Tab label={`Passées (${past.length})`} />
                </Tabs>

                {error && <Alert severity="error">{error}</Alert>}

                {loading ? (
                    <CircularProgress />
                ) : displayed.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography color="text.secondary">Aucune réservation.</Typography>
                        <Button component={RouterLink} to="/studios" variant="contained" disableElevation sx={{ mt: 2 }}>
                            Trouver un studio
                        </Button>
                    </Box>
                ) : (
                    displayed.map(b => {
                        const start = new Date(b.slot.start_time);
                        const end = new Date(b.slot.end_time);
                        const isCancellable = b.status === 'pending' && start > now;
                        return (
                            <Box key={b.id} sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                    <Box>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            component={RouterLink}
                                            to={`/studios/${b.slot.room?.studio}`}
                                            sx={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            {b.slot.room?.studio_name || `Studio #${b.slot.room?.studio}`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            {' · '}
                                            {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            {' – '}
                                            {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                        <Typography variant="body2">
                                            Total : <strong>{Number(b.total_price).toFixed(2)}€</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Chip
                                            label={STATUS_LABELS[b.status]}
                                            color={STATUS_COLORS[b.status]}
                                            size="small"
                                        />
                                        {isCancellable && (
                                            <Button size="small" color="error" onClick={() => cancel(b.id)}>
                                                Annuler
                                            </Button>
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
