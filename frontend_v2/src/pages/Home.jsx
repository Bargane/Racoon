import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, InputAdornment,
    Card, CardContent, CardActionArea, Chip, CircularProgress, Alert, Grid
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import api from '../api';
import Layout from '../components/Layout';

const PLACEHOLDERS = [
    "Un studio de répèt avec batterie pour 4 musiciens ce weekend…",
    "Une salle de danse contemporaine dans le 11ème…",
    "Studio pas cher avec piano, disponible en semaine…",
];

export default function Home() {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [placeholder] = useState(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setLoading(true);
        setError('');
        setResults(null);
        setMessage('');
        try {
            const { data } = await api.post('/api/recommend/', { prompt });
            if (data.type === 'search_results') {
                setResults(data.results);
            } else {
                setMessage(data.message || '');
            }
        } catch {
            setError('L\'assistant est momentanément indisponible. Réessayez dans un instant.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Box sx={{ textAlign: 'center', py: { xs: 4, md: 8 } }}>
                <Typography variant="h3" fontWeight={800} gutterBottom>
                    Trouvez votre studio à Paris
                </Typography>
                <Typography variant="h6" color="text.secondary" mb={5}>
                    Répétez, créez, enregistrez — réservez en moins de 30 secondes.
                </Typography>

                <Box
                    component="form"
                    onSubmit={handleSearch}
                    sx={{ maxWidth: 640, mx: 'auto', display: 'flex', gap: 1 }}
                >
                    <TextField
                        fullWidth
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder={placeholder}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AutoAwesomeIcon color="primary" fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disableElevation
                        disabled={loading}
                        startIcon={loading ? null : <SearchIcon />}
                        sx={{ minWidth: 120 }}
                    >
                        {loading ? <CircularProgress size={22} color="inherit" /> : 'Chercher'}
                    </Button>
                </Box>

                <Button component={RouterLink} to="/studios" sx={{ mt: 1 }} color="inherit" size="small">
                    Parcourir tous les studios →
                </Button>
            </Box>

            {error && <Alert severity="warning" sx={{ maxWidth: 640, mx: 'auto', mb: 3 }}>{error}</Alert>}

            {message && (
                <Box sx={{ maxWidth: 640, mx: 'auto', mb: 3 }}>
                    <Alert severity="info">{message}</Alert>
                </Box>
            )}

            {results && (
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                    <Typography variant="subtitle1" fontWeight={600} mb={2}>
                        {results.length} studio{results.length > 1 ? 's' : ''} recommandé{results.length > 1 ? 's' : ''} par l'IA
                    </Typography>
                    <Grid container spacing={2}>
                        {results.map(studio => (
                            <Grid item xs={12} sm={6} md={4} key={studio.id}>
                                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                                    <CardActionArea onClick={() => navigate(`/studios/${studio.id}`)} sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>
                                                    {studio.name}
                                                </Typography>
                                                <Chip
                                                    icon={<AutoAwesomeIcon style={{ fontSize: 13 }} />}
                                                    label="IA"
                                                    size="small"
                                                    color="primary"
                                                    sx={{ ml: 1, flexShrink: 0 }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {studio.address}
                                            </Typography>
                                            {studio.price_range && (
                                                <Typography variant="body2" fontWeight={600} color="primary" gutterBottom>
                                                    {studio.price_range}
                                                </Typography>
                                            )}
                                            {studio.relevance_reason && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {studio.relevance_reason}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Layout>
    );
}
