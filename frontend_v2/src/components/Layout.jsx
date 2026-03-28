import { Box, Container } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Container
                    maxWidth="lg"
                    sx={{
                        px: { xs: 2, sm: 3, md: 4 },
                        py: { xs: 3, md: 5 },
                        maxWidth: '1200px !important',
                    }}
                >
                    {children}
                </Container>
            </Box>
            <Footer />
        </Box>
    );
}
