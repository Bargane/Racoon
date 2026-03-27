import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';
import Layout from '../components/Layout';

// Fix icône Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PARIS = [48.8566, 2.3522];

export default function StudioMap() {
    const navigate = useNavigate();
    const [studios, setStudios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userPos, setUserPos] = useState(null);

    useEffect(() => {
        api.get('/api/studios/')
            .then(r => setStudios(r.data.filter(s => s.latitude && s.longitude)))
            .finally(() => setLoading(false));
    }, []);

    const locateMe = () => {
        navigator.geolocation.getCurrentPosition(
            pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
            () => alert('Géolocalisation non disponible.')
        );
    };

    if (loading) return <Layout><CircularProgress /></Layout>;

    return (
        <Layout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                    {studios.length} studio{studios.length > 1 ? 's' : ''} sur la carte
                </Typography>
                <Button startIcon={<MyLocationIcon />} onClick={locateMe} variant="outlined" size="small">
                    Me localiser
                </Button>
            </Box>

            <Box sx={{ height: '70vh', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <MapContainer
                    center={userPos || PARIS}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {studios.map(s => (
                        <Marker key={s.id} position={[s.latitude, s.longitude]}>
                            <Popup>
                                <strong>{s.name}</strong><br />
                                {s.address}<br />
                                {s.price_range && <span>{s.price_range}<br /></span>}
                                <button
                                    onClick={() => navigate(`/studios/${s.id}`)}
                                    style={{ marginTop: 6, cursor: 'pointer' }}
                                >
                                    Voir le studio
                                </button>
                            </Popup>
                        </Marker>
                    ))}
                    {userPos && (
                        <Marker position={userPos}>
                            <Popup>Vous êtes ici</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </Box>
        </Layout>
    );
}
