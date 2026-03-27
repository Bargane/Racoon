import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Navbar() {
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
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button component={RouterLink} to="/studios" color="inherit">
                        Studios
                    </Button>
                    <Button component={RouterLink} to="/login" color="inherit">
                        Connexion
                    </Button>
                    <Button component={RouterLink} to="/register" variant="contained" disableElevation>
                        S'inscrire
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
