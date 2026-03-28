import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Chip, Button, CircularProgress, Alert,
    Grid, Divider, Stack,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EuroIcon from '@mui/icons-material/Euro';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Reviews from '../components/Reviews';

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

    if (error) return (
        <Layout>
            <Alert
                severity="error"
                sx={{ maxWidth: 600, mx: 'auto', mt: 4, borderRadius: '12px' }}
            >
                {error}
            </Alert>
        </Layout>
    );

    if (!studio) return (
        <Layout>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
                <CircularProgress sx={{ color: 'primary.main' }} />
            </Box>
        </Layout>
    );

    const isOwner = user?.id === studio.owner?.id;

    return (
        <Layout>
            {/* ── Header ──────────────────────────────────────────────── */}
            <Box sx={{
                background: 'linear-gradient(160deg, #0a1a12 0%, #0f2d1c 60%, #1a3a26 100%)',
                borderRadius: '20px',
                px: { xs: 3, md: 5 },
                py: { xs: 4, md: 5 },
                mb: 4,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-60%',
                    right: '-10%',
                    width: '500px',
                    height: '400px',
                    background: 'radial-gradient(ellipse, rgba(34,197,94,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                },
            }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        {studio.arrondissement && (
                            <Chip
                                label={studio.arrondissement}
                                size="small"
                                sx={{
                                    mb: 2,
                                    bgcolor: 'rgba(34,197,94,0.12)',
                                    color: '#86efac',
                                    border: '1px solid rgba(34,197,94,0.25)',
                                    fontWeight: 600,
                                    fontSize: '0.72rem',
                                    letterSpacing: 0.5,
                                    height: 24,
                                }}
                            />
                        )}
                        <Typography
                            variant="h3"
                            fontWeight={800}
                            sx={{
                                color: 'white',
                                letterSpacing: '-0.03em',
                                fontSize: { xs: '1.8rem', md: '2.5rem' },
                                lineHeight: 1.1,
                                mb: 1.5,
                            }}
                        >
                            {studio.name}
                        </Typography>
                        {studio.address && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <LocationOnIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    {studio.address}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Owner actions */}
                    {isOwner && (
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => navigate(`/studios/${id}/edit`)}
                                size="small"
                                sx={{
                                    borderColor: 'rgba(255,255,255,0.2)',
                                    color: 'rgba(255,255,255,0.7)',
                                    '&:hover': {
                                        borderColor: 'rgba(255,255,255,0.5)',
                                        bgcolor: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                    },
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Modifier
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={handleDelete}
                                size="small"
                                sx={{
                                    borderColor: 'rgba(239,68,68,0.3)',
                                    color: 'rgba(239,68,68,0.7)',
                                    '&:hover': {
                                        borderColor: 'rgba(239,68,68,0.7)',
                                        bgcolor: 'rgba(239,68,68,0.05)',
                                        color: '#ef4444',
                                    },
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                }}
                            >
                                Supprimer
                            </Button>
                        </Stack>
                    )}
                </Box>
            </Box>

            {/* ── Body ────────────────────────────────────────────────── */}
            <Grid container spacing={4} alignItems="flex-start">
                {/* Left col — infos */}
                <Grid item xs={12} md={7}>
                    {studio.description && (
                        <Box sx={{
                            p: 3.5,
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            mb: 3,
                        }}>
                            <Typography
                                variant="overline"
                                sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.68rem', fontWeight: 700, display: 'block', mb: 1.5 }}
                            >
                                À PROPOS
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                                {studio.description}
                            </Typography>
                        </Box>
                    )}

                    {/* Contact info */}
                    {(studio.phone || studio.email || studio.website) && (
                        <Box sx={{
                            p: 3.5,
                            borderRadius: '16px',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                        }}>
                            <Typography
                                variant="overline"
                                sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.68rem', fontWeight: 700, display: 'block', mb: 2 }}
                            >
                                CONTACT
                            </Typography>
                            <Stack spacing={2}>
                                {studio.phone && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{
                                            width: 32, height: 32, borderRadius: '8px',
                                            bgcolor: 'action.hover',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{studio.phone}</Typography>
                                    </Box>
                                )}
                                {studio.email && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{
                                            width: 32, height: 32, borderRadius: '8px',
                                            bgcolor: 'action.hover',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">{studio.email}</Typography>
                                    </Box>
                                )}
                                {studio.website && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{
                                            width: 32, height: 32, borderRadius: '8px',
                                            bgcolor: 'action.hover',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <LanguageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        </Box>
                                        <Typography
                                            component="a"
                                            href={studio.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="body2"
                                            sx={{
                                                color: 'primary.main',
                                                textDecoration: 'none',
                                                '&:hover': { textDecoration: 'underline' },
                                            }}
                                        >
                                            {studio.website}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    )}
                </Grid>

                {/* Right col — sidebar */}
                <Grid item xs={12} md={5}>
                    <Box sx={{
                        p: 3.5,
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        top: 80,
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                        },
                    }}>
                        {/* Prix */}
                        {studio.price_range && (
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                    <EuroIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                        Tarif
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="h4"
                                    fontWeight={800}
                                    sx={{
                                        background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {studio.price_range}
                                </Typography>
                            </Box>
                        )}

                        <Divider sx={{ mb: 3, opacity: 0.5 }} />

                        {/* CTA */}
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<CalendarMonthIcon />}
                            onClick={() => navigate(`/studios/${id}/bookings`)}
                            disableElevation
                            sx={{
                                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                color: 'white',
                                fontWeight: 700,
                                borderRadius: '12px',
                                py: 1.5,
                                fontSize: '1rem',
                                letterSpacing: 0.2,
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                boxShadow: '0 4px 16px rgba(34,197,94,0.25)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
                                },
                                '&:active': { transform: 'translateY(0)' },
                            }}
                        >
                            Voir les créneaux
                        </Button>

                        <Typography
                            variant="caption"
                            color="text.disabled"
                            sx={{ display: 'block', textAlign: 'center', mt: 1.5, fontSize: '0.72rem' }}
                        >
                            Réservation instantanée · Sans engagement
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* ── Avis ────────────────────────────────────────────────── */}
            <Box sx={{ mt: 6 }}>
                <Divider sx={{ mb: 4, opacity: 0.5 }} />
                <Typography
                    variant="overline"
                    sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.68rem', fontWeight: 700, display: 'block', mb: 3 }}
                >
                    AVIS
                </Typography>
                <Reviews studioId={id} />
            </Box>
        </Layout>
    );
}
