import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Typography, Button, TextField, Alert, Chip, CircularProgress, Divider
} from '@mui/material';
import api from '../api';
import Layout from '../components/Layout';

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('access')}` };
}

export default function AvailabilityManager() {
    const { id } = useParams();
    const [slots, setSlots] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState({ room: '', start_time: '', end_time: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchSlots = () =>
        api.get(`/api/studios/${id}/availability/`).then(r => setSlots(r.data));

    const fetchRooms = () =>
        api.get(`/api/studios/${id}/`).then(r => setRooms(r.data.rooms || []));

    useEffect(() => {
        fetchSlots();
        fetchRooms();
    }, [id]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post(`/api/studios/${id}/availability/`, form, { headers: authHeaders() });
            setForm(f => ({ ...f, start_time: '', end_time: '' }));
            fetchSlots();
        } catch (err) {
            const data = err.response?.data;
            setError(data ? Object.values(data).flat().join(' ') : 'Erreur.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (slotId) => {
        await api.delete(`/api/studios/${id}/availability/${slotId}/`, { headers: authHeaders() });
        setSlots(s => s.filter(sl => sl.id !== slotId));
    };

    // Groupe les créneaux par date
    const grouped = slots.reduce((acc, slot) => {
        const date = new Date(slot.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        (acc[date] = acc[date] || []).push(slot);
        return acc;
    }, {});

    return (
        <Layout>
            <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                <Typography variant="h5" fontWeight={700} mb={3}>Gérer les disponibilités</Typography>

                <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
                    {rooms.length > 0 && (
                        <TextField
                            select
                            label="Salle"
                            value={form.room}
                            onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                            SelectProps={{ native: true }}
                            required
                            sx={{ minWidth: 180 }}
                        >
                            <option value="" />
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </TextField>
                    )}
                    <TextField
                        label="Début"
                        type="datetime-local"
                        value={form.start_time}
                        onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        required
                    />
                    <TextField
                        label="Fin"
                        type="datetime-local"
                        value={form.end_time}
                        onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        required
                    />
                    <Button type="submit" variant="contained" disableElevation disabled={loading}>
                        Ajouter
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {Object.keys(grouped).length === 0 ? (
                    <Typography color="text.secondary">Aucun créneau disponible.</Typography>
                ) : (
                    Object.entries(grouped).map(([date, daySlots]) => (
                        <Box key={date} mb={3}>
                            <Typography variant="subtitle1" fontWeight={600} mb={1}>{date}</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {daySlots.map(slot => {
                                    const start = new Date(slot.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                    const end = new Date(slot.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <Chip
                                            key={slot.id}
                                            label={`${start} – ${end}`}
                                            onDelete={() => handleDelete(slot.id)}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    );
                                })}
                            </Box>
                            <Divider sx={{ mt: 2 }} />
                        </Box>
                    ))
                )}
            </Box>
        </Layout>
    );
}
