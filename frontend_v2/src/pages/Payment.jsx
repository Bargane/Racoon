import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, Alert, Divider, CircularProgress, InputAdornment
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import api from '../api';
import Layout from '../components/Layout';

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('access')}` };
}

function formatCardNumber(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
}

export default function Payment() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [form, setForm] = useState({ card_number: '', expiry: '', cvv: '', cardholder: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get(`/api/bookings/${bookingId}/`, { headers: authHeaders() })
            .then(r => setBooking(r.data))
            .catch(() => setError('Réservation introuvable.'));
    }, [bookingId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post(`/api/bookings/${bookingId}/pay/`, {
                card_number: form.card_number.replace(/\s/g, ''),
                expiry: form.expiry,
                cvv: form.cvv,
            }, { headers: authHeaders() });
            navigate('/dashboard?paid=1');
        } catch (err) {
            setError(err.response?.data?.detail || 'Paiement refusé. Vérifiez vos informations.');
        } finally {
            setLoading(false);
        }
    };

    if (!booking) return <Layout><CircularProgress /></Layout>;

    const start = new Date(booking.slot.start_time);

    return (
        <Layout>
            <Box sx={{ maxWidth: 460, mx: 'auto', mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <LockIcon fontSize="small" color="success" />
                    <Typography variant="h6" fontWeight={700}>Paiement sécurisé</Typography>
                </Box>

                {/* Résumé commande */}
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">Réservation</Typography>
                    <Typography fontWeight={600}>
                        {start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {' · '}
                        {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography fontWeight={700}>Total</Typography>
                        <Typography fontWeight={700} color="primary">{Number(booking.total_price).toFixed(2)}€</Typography>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Titulaire de la carte"
                        value={form.cardholder}
                        onChange={e => setForm(f => ({ ...f, cardholder: e.target.value }))}
                        required
                        autoComplete="cc-name"
                    />
                    <TextField
                        label="Numéro de carte"
                        value={form.card_number}
                        onChange={e => setForm(f => ({ ...f, card_number: formatCardNumber(e.target.value) }))}
                        required
                        autoComplete="cc-number"
                        inputProps={{ inputMode: 'numeric' }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><CreditCardIcon color="disabled" /></InputAdornment>
                        }}
                        placeholder="1234 5678 9012 3456"
                    />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="MM/AA"
                            value={form.expiry}
                            onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))}
                            required
                            autoComplete="cc-exp"
                            inputProps={{ inputMode: 'numeric' }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            label="CVV"
                            value={form.cvv}
                            onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            required
                            autoComplete="cc-csc"
                            inputProps={{ inputMode: 'numeric', maxLength: 4 }}
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disableElevation
                        disabled={loading}
                        startIcon={<LockIcon />}
                    >
                        {loading ? 'Traitement...' : `Payer ${Number(booking.total_price).toFixed(2)}€`}
                    </Button>
                    <Typography variant="caption" color="text.secondary" textAlign="center">
                        Vos données sont chiffrées et ne sont pas stockées.
                    </Typography>
                </Box>
            </Box>
        </Layout>
    );
}
