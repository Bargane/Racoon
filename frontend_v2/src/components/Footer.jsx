import { Box, Typography, Link } from '@mui/material';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                py: 2,
                px: 3,
                mt: 'auto',
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 2,
                justifyContent: 'center',
                flexWrap: 'wrap',
            }}
        >
            <Typography variant="body2" color="text.secondary">
                © 2026 Racoon
            </Typography>
            <Typography variant="body2" color="text.secondary">·</Typography>
            <Link href="mailto:bastien.beffa@gmail.com" variant="body2" color="text.secondary">
                Contact
            </Link>
        </Box>
    );
}
