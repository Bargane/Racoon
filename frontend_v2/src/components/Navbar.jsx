import { useState } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip,
    Drawer, List, ListItemButton, ListItemText, Divider, Avatar, useMediaQuery, useTheme,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { mode, toggle } = useColorMode();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/'); setDrawerOpen(false); };
    const close = () => setDrawerOpen(false);

    const navLinks = [
        { label: 'Studios', to: '/studios' },
        { label: 'Carte', to: '/map' },
    ];

    const userLinks = user ? [
        { label: 'Mes réservations', to: '/dashboard' },
        ...(user.role === 'owner' ? [
            { label: 'Tableau de bord', to: '/owner/dashboard' },
            { label: 'Mon studio', to: '/studios/new' },
        ] : []),
    ] : [];

    const initials = user ? (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase() : '';

    return (
        <>
            <AppBar position="sticky" color="default" elevation={0}
                sx={{ borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(8px)' }}
            >
                <Toolbar sx={{ gap: 1 }}>
                    {/* Logo */}
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{
                            flexGrow: 1,
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: 800,
                            fontSize: '1.2rem',
                            letterSpacing: '-0.5px',
                        }}
                    >
                        🦝 Racoon
                    </Typography>

                    {/* Desktop nav */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            {navLinks.map(l => (
                                <Button key={l.to} component={RouterLink} to={l.to} color="inherit" sx={{ fontWeight: 500 }}>
                                    {l.label}
                                </Button>
                            ))}
                            {user ? (
                                <>
                                    {userLinks.map(l => (
                                        <Button key={l.to} component={RouterLink} to={l.to} color="inherit" sx={{ fontWeight: 500 }}>
                                            {l.label}
                                        </Button>
                                    ))}
                                    <Avatar
                                        sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem', cursor: 'pointer', ml: 1 }}
                                        onClick={handleLogout}
                                        title="Déconnexion"
                                    >
                                        {initials}
                                    </Avatar>
                                </>
                            ) : (
                                <>
                                    <Button component={RouterLink} to="/login" color="inherit" sx={{ fontWeight: 500 }}>Connexion</Button>
                                    <Button component={RouterLink} to="/register" variant="contained" disableElevation sx={{ fontWeight: 600 }}>
                                        S'inscrire
                                    </Button>
                                </>
                            )}
                            <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
                                <IconButton onClick={toggle} color="inherit" size="small">
                                    {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}

                    {/* Mobile: dark mode + hamburger */}
                    {isMobile && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton onClick={toggle} color="inherit" size="small">
                                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                            </IconButton>
                            <IconButton onClick={() => setDrawerOpen(true)} color="inherit">
                                <MenuIcon />
                            </IconButton>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            <Drawer anchor="right" open={drawerOpen} onClose={close}
                PaperProps={{ sx: { width: 260 } }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                    <Typography fontWeight={800} color="primary.main">🦝 Racoon</Typography>
                    <IconButton onClick={close} size="small"><CloseIcon /></IconButton>
                </Box>
                <Divider />
                <List dense>
                    {navLinks.map(l => (
                        <ListItemButton key={l.to} component={RouterLink} to={l.to} onClick={close}>
                            <ListItemText primary={l.label} />
                        </ListItemButton>
                    ))}
                </List>
                {user && (
                    <>
                        <Divider />
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {user.role === 'owner' ? 'Propriétaire' : 'Artiste'} · {user.username}
                            </Typography>
                        </Box>
                        <List dense>
                            {userLinks.map(l => (
                                <ListItemButton key={l.to} component={RouterLink} to={l.to} onClick={close}>
                                    <ListItemText primary={l.label} />
                                </ListItemButton>
                            ))}
                            <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                                <ListItemText primary="Déconnexion" />
                            </ListItemButton>
                        </List>
                    </>
                )}
                {!user && (
                    <>
                        <Divider />
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button component={RouterLink} to="/login" variant="outlined" fullWidth onClick={close}>Connexion</Button>
                            <Button component={RouterLink} to="/register" variant="contained" fullWidth disableElevation onClick={close}>S'inscrire</Button>
                        </Box>
                    </>
                )}
            </Drawer>
        </>
    );
}
