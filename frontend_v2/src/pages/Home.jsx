import { Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Home() {
    return (
        <Layout>
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                    Trouvez votre studio à Paris
                </Typography>
                <Typography variant="h6" color="text.secondary" mb={4}>
                    Répétez, créez, enregistrez — réservez en moins de 30 secondes.
                </Typography>
                <Button
                    component={RouterLink}
                    to="/studios"
                    variant="contained"
                    size="large"
                    disableElevation
                >
                    Chercher un studio
                </Button>
            </Box>
        </Layout>
    );
}
