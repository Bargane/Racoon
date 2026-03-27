import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <AppBar position="static" color="default" elevation={1}>
            <Toolbar>
                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 700 }}
                >
                    🦝 Racoon
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button component={RouterLink} to="/studios" color="inherit">Studios</Button>
                    <Button component={RouterLink} to="/map" color="inherit">Carte</Button>
                    {user ? (
                        <>
                            <Button component={RouterLink} to="/dashboard" color="inherit">
                                Mes réservations
                            </Button>
                            {user.role === 'owner' && (
                                <>
                                    <Button component={RouterLink} to="/owner/dashboard" color="inherit">
                                        Mon tableau de bord
                                    </Button>
                                    <Button component={RouterLink} to="/studios/new" color="inherit">
                                        Mon studio
                                    </Button>
                                </>
                            )}
                            <Button onClick={handleLogout} color="inherit">Déconnexion</Button>
                        </>
                    ) : (
                        <>
                            <Button component={RouterLink} to="/login" color="inherit">Connexion</Button>
                            <Button component={RouterLink} to="/register" variant="contained" disableElevation>
                                S'inscrire
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
