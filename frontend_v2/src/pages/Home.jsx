import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, TextField, Button, InputAdornment,
    Card, CardContent, CardActionArea, Chip, CircularProgress, Alert, Grid, Container,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import api from '../api';
import Layout from '../components/Layout';

const PLACEHOLDERS = [
    "Un studio de répèt avec batterie pour 4 musiciens ce weekend…",
    "Une salle de danse contemporaine dans le 11ème…",
    "Studio pas cher avec piano, disponible en semaine…",
];

const STEPS = [
    {
        icon: <AutoAwesomeIcon fontSize="large" />,
        title: "Décris ta recherche",
        desc: "Dis à l'IA ce dont tu as besoin : type de salle, équipement, budget, créneau.",
    },
    {
        icon: <SearchIcon fontSize="large" />,
        title: "Choisis ton studio",
        desc: "Compare les studios recommandés, leurs tarifs et créneaux disponibles.",
    },
    {
        icon: <FlashOnIcon fontSize="large" />,
        title: "Réserve en 30 secondes",
        desc: "Confirme en quelques clics. Pas de téléphone, pas d'email.",
    },
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
            setError("L'assistant est momentanément indisponible. Réessayez dans un instant.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            {/* Hero — full-bleed avec marges négatives */}
            <Box sx={{
                background: 'linear-gradient(160deg, #1a4a35 0%, #2a7a5a 100%)',
                color: 'white',
                py: { xs: 8, md: 12 },
                px: { xs: 2, md: 4 },
                mx: { xs: -2, md: -4 },
                mt: { xs: -2, md: -4 },
                textAlign: 'center',
                mb: 8,
            }}>
                <Typography
                    variant="overline"
                    sx={{ opacity: 0.75, letterSpacing: 4, fontSize: '0.7rem', display: 'block', mb: 1 }}
                >
                    Studios de répétition · Paris
                </Typography>
                <Typography
                    variant="h2"
                    fontWeight={800}
                    sx={{ fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' }, lineHeight: 1.15, mb: 2 }}
                >
                    Trouvez votre studio,<br />répétez maintenant.
                </Typography>
                <Typography
                    variant="h6"
                    sx={{ opacity: 0.8, mb: 5, fontWeight: 400, fontSize: { xs: '1rem', md: '1.2rem' } }}
                >
                    Musique, danse, théâtre — réservez en moins de 30 secondes.
                </Typography>

                {/* Search bar */}
                <Box
                    component="form"
                    onSubmit={handleSearch}
                    sx={{
                        maxWidth: 660,
                        mx: 'auto',
                        display: 'flex',
                        gap: 1,
                        bgcolor: 'rgba(255,255,255,0.12)',
                        borderRadius: 3,
                        p: '6px',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}
                >
                    <TextField
                        fullWidth
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder={placeholder}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                            sx: {
                                color: 'white',
                                '& fieldset': { border: 'none' },
                                '& input::placeholder': { color: 'rgba(255,255,255,0.55)', opacity: 1 },
                            },
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disableElevation
                        disabled={loading}
                        sx={{
                            minWidth: { xs: 56, sm: 130 },
                            bgcolor: 'white',
                            color: '#2a7a5a',
                            fontWeight: 700,
                            borderRadius: 2,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                            '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.5)' },
                        }}
                    >
                        {loading
                            ? <CircularProgress size={22} sx={{ color: '#2a7a5a' }} />
                            : <><SearchIcon sx={{ display: { xs: 'block', sm: 'none' } }} /><Box sx={{ display: { xs: 'none', sm: 'block' } }}>Rechercher</Box></>
                        }
                    </Button>
                </Box>

                <Button
                    component={RouterLink}
                    to="/studios"
                    sx={{ mt: 2.5, color: 'rgba(255,255,255,0.65)', '&:hover': { color: 'white' }, textTransform: 'none' }}
                    size="small"
                >
                    Parcourir tous les studios →
                </Button>
            </Box>

            {/* Alertes */}
            {error && <Alert severity="warning" sx={{ maxWidth: 660, mx: 'auto', mb: 3 }}>{error}</Alert>}
            {message && <Alert severity="info" sx={{ maxWidth: 660, mx: 'auto', mb: 3 }}>{message}</Alert>}

            {/* Résultats */}
            {results && (
                <Box sx={{ mb: 8 }}>
                    <Typography variant="h6" fontWeight={700} mb={3}>
                        {results.length} studio{results.length > 1 ? 's' : ''} recommandé{results.length > 1 ? 's' : ''} ✨
                    </Typography>
                    <Grid container spacing={3}>
                        {results.map(studio => (
                            <Grid item xs={12} sm={6} md={4} key={studio.id}>
                                <StudioCard studio={studio} onClick={() => navigate(`/studios/${studio.id}`)} showAiBadge />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Comment ça marche */}
            {!results && (
                <Container maxWidth="md" disableGutters sx={{ mb: 10 }}>
                    <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>
                        Comment ça marche ?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" mb={5}>
                        Trois étapes, moins de 30 secondes.
                    </Typography>
                    <Grid container spacing={4}>
                        {STEPS.map((step, i) => (
                            <Grid item xs={12} md={4} key={i}>
                                <Box sx={{ textAlign: 'center', px: 1 }}>
                                    <Box sx={{
                                        width: 60, height: 60, borderRadius: '50%',
                                        bgcolor: 'primary.main', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        mx: 'auto', mb: 2,
                                    }}>
                                        {step.icon}
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>{step.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            )}
        </Layout>
    );
}

export function StudioCard({ studio, onClick, showAiBadge }) {
    const rooms = studio.rooms || [];
    const types = rooms.map(r => r.room_type);
    const hasMusic = types.includes('music');
    const hasDance = types.includes('dance');
    const isMixed = hasMusic && hasDance;

    const headerBg = isMixed
        ? 'linear-gradient(135deg, #1a3a5e 0%, #2a5aaa 100%)'
        : hasDance
            ? 'linear-gradient(135deg, #3d1a6e 0%, #7b2fbe 100%)'
            : 'linear-gradient(135deg, #1a4a35 0%, #2a7a5a 100%)';

    const HeaderIcon = hasDance && !hasMusic ? SelfImprovementIcon : MusicNoteIcon;

    return (
        <Card elevation={0} sx={{
            border: '1px solid', borderColor: 'divider',
            height: '100%', borderRadius: 3, overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.2s',
            '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
        }}>
            {/* Header coloré */}
            <Box sx={{
                height: 80,
                background: headerBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <HeaderIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 44 }} />
            </Box>

            <CardActionArea onClick={onClick}>
                <CardContent sx={{ pt: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flex: 1 }}>
                            {studio.name}
                        </Typography>
                        {showAiBadge && (
                            <Chip
                                icon={<AutoAwesomeIcon style={{ fontSize: 11 }} />}
                                label="IA"
                                size="small"
                                color="primary"
                                sx={{ ml: 1, flexShrink: 0, height: 18, fontSize: '0.62rem' }}
                            />
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
                        📍 {studio.arrondissement || studio.address}
                    </Typography>
                    {studio.price_range && (
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                            {studio.price_range}
                        </Typography>
                    )}
                    {studio.relevance_reason && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                            {studio.relevance_reason}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
