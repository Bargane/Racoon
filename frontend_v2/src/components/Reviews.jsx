import { useEffect, useState } from 'react';
import { Box, Typography, Rating, TextField, Button, Alert, Divider, Avatar } from '@mui/material';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('access')}` };
}

export default function Reviews({ studioId }) {
    const { user } = useAuth();
    const [data, setData] = useState({ average: null, count: 0, reviews: [] });
    const [form, setForm] = useState({ rating: 0, comment: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const fetchReviews = () =>
        api.get(`/api/studios/${studioId}/reviews/`).then(r => setData(r.data));

    useEffect(() => { fetchReviews(); }, [studioId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post(`/api/studios/${studioId}/reviews/`, form, { headers: authHeaders() });
            setSuccess(true);
            setForm({ rating: 0, comment: '' });
            fetchReviews();
        } catch (err) {
            setError(err.response?.data?.detail || 'Erreur lors de l\'envoi.');
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Avis</Typography>
                {data.average && (
                    <>
                        <Rating value={data.average} precision={0.1} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                            {data.average}/5 ({data.count} avis)
                        </Typography>
                    </>
                )}
            </Box>

            {data.reviews.map(r => (
                <Box key={r.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 13 }}>
                            {r.artist.username[0].toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{r.artist.username}</Typography>
                        <Rating value={r.rating} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">
                            {new Date(r.created_at).toLocaleDateString('fr-FR')}
                        </Typography>
                    </Box>
                    {r.comment && <Typography variant="body2" sx={{ mt: 0.5, ml: 4.5 }}>{r.comment}</Typography>}
                    <Divider sx={{ mt: 1.5 }} />
                </Box>
            ))}

            {user && !success && (
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Laisser un avis</Typography>
                    {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
                    <Rating
                        value={form.rating}
                        onChange={(_, v) => setForm(f => ({ ...f, rating: v }))}
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Votre commentaire (optionnel)"
                        value={form.comment}
                        onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                        sx={{ mb: 1 }}
                    />
                    <Button type="submit" variant="outlined" size="small" disabled={!form.rating}>
                        Publier
                    </Button>
                </Box>
            )}
            {success && <Alert severity="success">Avis publié !</Alert>}
        </Box>
    );
}
