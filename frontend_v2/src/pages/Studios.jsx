import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, TextField, MenuItem, Button, Grid,
    Card, CardContent, CardActionArea, Chip, CircularProgress
} from '@mui/material';
import api from '../api';
import Layout from '../components/Layout';

const ROOM_TYPES = [
    { value: '', label: 'Tous' },
    { value: 'music', label: 'Musique' },
    { value: 'dance', label: 'Danse' },
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

    return (
        <Layout>
            {/* Barre de filtres */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4, alignItems: 'flex-end' }}>
                <TextField select label="Type" value={filters.type} onChange={set('type')} sx={{ minWidth: 130 }}>
                    {ROOM_TYPES.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
                <TextField
                    label="Date"
                    type="date"
                    value={filters.date}
                    onChange={set('date')}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 160 }}
                />
                <TextField
                    label="Personnes (min)"
                    type="number"
                    value={filters.capacity}
                    onChange={set('capacity')}
                    sx={{ width: 150 }}
                    inputProps={{ min: 1 }}
                />
                <TextField
                    label="Budget max (€/h)"
                    type="number"
                    value={filters.price_max}
                    onChange={set('price_max')}
                    sx={{ width: 160 }}
                    inputProps={{ min: 0 }}
                />
                <Button variant="contained" disableElevation onClick={() => search()}>
                    Rechercher
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : studios.length === 0 ? (
                <Typography color="text.secondary">Aucun studio trouvé.</Typography>
            ) : (
                <>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                        {studios.length} studio{studios.length > 1 ? 's' : ''} trouvé{studios.length > 1 ? 's' : ''}
                    </Typography>
                    <Grid container spacing={2}>
                        {studios.map(studio => (
                            <Grid item xs={12} sm={6} md={4} key={studio.id}>
                                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                                    <CardActionArea onClick={() => navigate(`/studios/${studio.id}`)} sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                                                {studio.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {studio.address}
                                            </Typography>
                                            {studio.arrondissement && (
                                                <Chip label={studio.arrondissement} size="small" sx={{ mb: 1 }} />
                                            )}
                                            {studio.price_range && (
                                                <Typography variant="body2" fontWeight={600} color="primary">
                                                    {studio.price_range}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}
        </Layout>
    );
}
