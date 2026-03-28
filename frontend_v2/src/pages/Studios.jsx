import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, MenuItem, Button, Grid,
    Chip, CircularProgress, Paper, Stack,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import api from '../api';
import Layout from '../components/Layout';
import { StudioCard } from './Home';

const ROOM_TYPES = [
    { value: '', label: 'Tous types' },
    { value: 'music', label: '🎸 Musique' },
    { value: 'dance', label: '💃 Danse' },
];

export default function Studios() {
    const navigate = useNavigate();
    const [studios, setStudios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', date: '', capacity: '', price_max: '' });

    const search = (f = filters) => {
        setLoading(true);
        const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
        api.get('/api/studios/', { params })
            .then(r => setStudios(r.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => { search(); }, []);

    const set = (field) => (e) => setFilters(f => ({ ...f, [field]: e.target.value }));

    const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <Layout>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={800} gutterBottom>Studios à Paris</Typography>
                <Typography variant="body2" color="text.secondary">
                    {studios.length > 0 && !loading ? `${studios.length} studio${studios.length > 1 ? 's' : ''} disponible${studios.length > 1 ? 's' : ''}` : 'Chargement...'}
                </Typography>
            </Box>

            {/* Filtres */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2, mb: 4 }}>
                <Stack direction="row" alignItems="center" gap={1} mb={2}>
                    <TuneIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>Filtres</Typography>
                    {activeFiltersCount > 0 && (
                        <Chip
                            label={activeFiltersCount}
                            size="small"
                            color="primary"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                    )}
                </Stack>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <TextField
                        select label="Type" value={filters.type} onChange={set('type')}
                        size="small" sx={{ minWidth: 150 }}
                    >
                        {ROOM_TYPES.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                    </TextField>
                    <TextField
                        label="Date" type="date" value={filters.date} onChange={set('date')}
                        size="small" InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
                    />
                    <TextField
                        label="Personnes (min)" type="number" value={filters.capacity} onChange={set('capacity')}
                        size="small" sx={{ width: 150 }} inputProps={{ min: 1 }}
                    />
                    <TextField
                        label="Budget max (€/h)" type="number" value={filters.price_max} onChange={set('price_max')}
                        size="small" sx={{ width: 160 }} inputProps={{ min: 0 }}
                    />
                    <Button variant="contained" disableElevation onClick={() => search()} sx={{ fontWeight: 600 }}>
                        Rechercher
                    </Button>
                    {activeFiltersCount > 0 && (
                        <Button
                            variant="text" color="inherit" size="small"
                            onClick={() => { const f = { type: '', date: '', capacity: '', price_max: '' }; setFilters(f); search(f); }}
                        >
                            Réinitialiser
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Résultats */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                </Box>
            ) : studios.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>Aucun studio trouvé</Typography>
                    <Typography variant="body2" color="text.secondary">Essayez de modifier vos filtres.</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {studios.map(studio => (
                        <Grid item xs={12} sm={6} md={4} key={studio.id}>
                            <StudioCard studio={studio} onClick={() => navigate(`/studios/${studio.id}`)} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Layout>
    );
}
