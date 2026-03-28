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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../api';
import Layout from '../components/Layout';

const PLACEHOLDERS = [
    "Un studio de répèt avec batterie pour 4 musiciens ce weekend…",
    "Une salle de danse contemporaine dans le 11ème…",
    "Studio pas cher avec piano, disponible en semaine…",
];

const STEPS = [
    {
        icon: <AutoAwesomeIcon sx={{ fontSize: 22 }} />,
        title: "Décris ta recherche",
        desc: "Dis à l'IA ce dont tu as besoin : type de salle, équipement, budget, créneau.",
        gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    },
    {
        icon: <SearchIcon sx={{ fontSize: 22 }} />,
        title: "Choisis ton studio",
        desc: "Compare les studios recommandés, leurs tarifs et créneaux disponibles.",
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    },
    {
        icon: <FlashOnIcon sx={{ fontSize: 22 }} />,
        title: "Réserve en 30 secondes",
        desc: "Confirme en quelques clics. Pas de téléphone, pas d'email.",
        gradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
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
            {/* ── Hero ──────────────────────────────────────────────── */}
            <Box sx={{
                background: 'linear-gradient(160deg, #0a1a12 0%, #0f2d1c 40%, #1a3a26 100%)',
                color: 'white',
                borderRadius: { xs: 0, md: '24px' },
                py: { xs: 8, md: 14 },
                px: { xs: 3, md: 6 },
                mx: { xs: -2, sm: -3, md: -4 },
                mt: { xs: -3, md: -5 },
                mb: 8,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-40%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '700px',
                    height: '400px',
                    background: 'radial-gradient(ellipse, rgba(34,197,94,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                },
            }}>
                {/* Eyebrow */}
                <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '100px',
                    border: '1px solid rgba(34,197,94,0.3)',
                    bgcolor: 'rgba(34,197,94,0.08)',
                    mb: 3,
                }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                    <Typography variant="caption" sx={{ color: '#86efac', letterSpacing: 1, fontWeight: 600, fontSize: '0.7rem' }}>
                        STUDIOS DE RÉPÉTITION · PARIS
                    </Typography>
                </Box>

                {/* Title */}
                <Typography
                    variant="h1"
                    sx={{
                        fontSize: { xs: '2.2rem', sm: '3rem', md: '4rem', lg: '4.5rem' },
                        fontWeight: 800,
                        lineHeight: 1.1,
                        letterSpacing: '-0.03em',
                        mb: 2.5,
                        '& span': {
                            background: 'linear-gradient(90deg, #22c55e 0%, #86efac 50%, #22c55e 100%)',
                            backgroundSize: '200% auto',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        },
                    }}
                >
                    Trouvez votre studio,<br />
                    <span>répétez maintenant.</span>
                </Typography>

                <Typography
                    variant="h6"
                    sx={{
                        opacity: 0.6,
                        mb: 6,
                        fontWeight: 400,
                        fontSize: { xs: '1rem', md: '1.15rem' },
                        maxWidth: 480,
                        mx: 'auto',
                        lineHeight: 1.6,
                    }}
                >
                    Musique, danse, théâtre — réservez en moins de 30 secondes grâce à l'IA.
                </Typography>

                {/* Search bar */}
                <Box
                    component="form"
                    onSubmit={handleSearch}
                    sx={{
                        maxWidth: 680,
                        mx: 'auto',
                        display: 'flex',
                        gap: '6px',
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        p: '6px',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        '&:focus-within': {
                            borderColor: 'rgba(34,197,94,0.5)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 3px rgba(34,197,94,0.1)',
                        },
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
                                    <AutoAwesomeIcon sx={{ color: '#22c55e', fontSize: 18 }} />
                                </InputAdornment>
                            ),
                            sx: {
                                color: 'white',
                                fontSize: '0.95rem',
                                '& fieldset': { border: 'none' },
                                '& input::placeholder': { color: 'rgba(255,255,255,0.4)', opacity: 1 },
                                '& input': { py: 1.25 },
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
                            minWidth: { xs: 52, sm: 140 },
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            color: 'white',
                            fontWeight: 700,
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            letterSpacing: 0.3,
                            flexShrink: 0,
                            transition: 'opacity 0.2s, transform 0.1s',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                transform: 'scale(1.02)',
                            },
                            '&:active': { transform: 'scale(0.98)' },
                            '&.Mui-disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
                        }}
                    >
                        {loading
                            ? <CircularProgress size={20} sx={{ color: 'white' }} />
                            : <>
                                <SearchIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: 20 }} />
                                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
                                    Rechercher
                                </Box>
                              </>
                        }
                    </Button>
                </Box>

                {/* Browse link */}
                <Button
                    component={RouterLink}
                    to="/studios"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}
                    sx={{
                        mt: 3,
                        color: 'rgba(255,255,255,0.45)',
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        letterSpacing: 0.2,
                        transition: 'color 0.2s',
                        '&:hover': { color: 'rgba(255,255,255,0.8)', bgcolor: 'transparent' },
                    }}
                >
                    Parcourir tous les studios
                </Button>
            </Box>

            {/* ── Alertes ───────────────────────────────────────────── */}
            {error && (
                <Alert
                    severity="warning"
                    sx={{
                        maxWidth: 680,
                        mx: 'auto',
                        mb: 4,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'warning.light',
                    }}
                >
                    {error}
                </Alert>
            )}
            {message && (
                <Alert
                    severity="info"
                    sx={{
                        maxWidth: 680,
                        mx: 'auto',
                        mb: 4,
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: 'info.light',
                    }}
                >
                    {message}
                </Alert>
            )}

            {/* ── Résultats IA ──────────────────────────────────────── */}
            {results && (
                <Box sx={{ mb: 10 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                        <Box sx={{
                            px: 1.5, py: 0.5, borderRadius: '8px',
                            bgcolor: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.2)',
                        }}>
                            <AutoAwesomeIcon sx={{ fontSize: 14, color: '#22c55e', verticalAlign: 'middle', mr: 0.5 }} />
                            <Typography component="span" variant="caption" sx={{ color: '#22c55e', fontWeight: 700 }}>
                                IA
                            </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={700}>
                            {results.length} studio{results.length > 1 ? 's' : ''} recommandé{results.length > 1 ? 's' : ''}
                        </Typography>
                    </Box>
                    <Grid container spacing={3}>
                        {results.map(studio => (
                            <Grid item xs={12} sm={6} md={4} key={studio.id}>
                                <StudioCard studio={studio} onClick={() => navigate(`/studios/${studio.id}`)} showAiBadge />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* ── Comment ça marche ─────────────────────────────────── */}
            {!results && (
                <Container maxWidth="md" disableGutters sx={{ mb: 12 }}>
                    {/* Section header */}
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography
                            variant="overline"
                            sx={{
                                color: 'primary.main',
                                letterSpacing: 3,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                display: 'block',
                                mb: 1,
                            }}
                        >
                            SIMPLE ET RAPIDE
                        </Typography>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            sx={{ letterSpacing: '-0.02em', mb: 1.5 }}
                        >
                            Comment ça marche ?
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
                            Trois étapes, moins de 30 secondes.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {STEPS.map((step, i) => (
                            <Grid item xs={12} md={4} key={i}>
                                <Box sx={{
                                    p: 3.5,
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    height: '100%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                                        borderColor: 'primary.main',
                                    },
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        background: step.gradient,
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                    },
                                    '&:hover::after': { opacity: 1 },
                                }}>
                                    {/* Step number */}
                                    <Typography
                                        sx={{
                                            position: 'absolute',
                                            top: 16,
                                            right: 20,
                                            fontSize: '3rem',
                                            fontWeight: 900,
                                            color: 'divider',
                                            lineHeight: 1,
                                            userSelect: 'none',
                                        }}
                                    >
                                        {i + 1}
                                    </Typography>

                                    {/* Icon */}
                                    <Box sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: '12px',
                                        background: step.gradient,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 2.5,
                                        color: 'white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    }}>
                                        {step.icon}
                                    </Box>

                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.01em' }}>
                                        {step.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                        {step.desc}
                                    </Typography>
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

    const headerGradient = isMixed
        ? 'linear-gradient(135deg, #1a3a5e 0%, #1d4ed8 100%)'
        : hasDance
            ? 'linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)'
            : 'linear-gradient(135deg, #052e16 0%, #166534 100%)';

    const HeaderIcon = hasDance && !hasMusic ? SelfImprovementIcon : MusicNoteIcon;

    return (
        <Card
            elevation={0}
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                bgcolor: 'background.paper',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
                    borderColor: 'primary.main',
                },
            }}
        >
            {/* Header */}
            <Box sx={{
                height: 90,
                background: headerGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)',
                },
            }}>
                <HeaderIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: 56 }} />
                {showAiBadge && (
                    <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        px: 1,
                        py: 0.25,
                        borderRadius: '6px',
                        bgcolor: 'rgba(0,0,0,0.35)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4,
                    }}>
                        <AutoAwesomeIcon sx={{ color: '#22c55e', fontSize: 10 }} />
                        <Typography sx={{ color: '#86efac', fontSize: '0.62rem', fontWeight: 700, lineHeight: 1 }}>
                            IA
                        </Typography>
                    </Box>
                )}
            </Box>

            <CardActionArea onClick={onClick} sx={{ flexGrow: 1 }}>
                <CardContent sx={{ pt: 2, pb: '16px !important', px: 2.5 }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        noWrap
                        sx={{ mb: 0.75, letterSpacing: '-0.01em', lineHeight: 1.3 }}
                    >
                        {studio.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                        <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.8rem' }}>
                            {studio.arrondissement || studio.address}
                        </Typography>
                    </Box>

                    {studio.price_range && (
                        <Box sx={{
                            display: 'inline-block',
                            px: 1.25,
                            py: 0.4,
                            borderRadius: '8px',
                            bgcolor: 'rgba(34,197,94,0.08)',
                            border: '1px solid rgba(34,197,94,0.2)',
                        }}>
                            <Typography variant="body2" fontWeight={700} sx={{ color: '#16a34a', fontSize: '0.82rem' }}>
                                {studio.price_range}
                            </Typography>
                        </Box>
                    )}

                    {studio.relevance_reason && (
                        <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{
                                fontStyle: 'italic',
                                display: 'block',
                                mt: 1,
                                lineHeight: 1.5,
                                fontSize: '0.72rem',
                            }}
                        >
                            {studio.relevance_reason}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
