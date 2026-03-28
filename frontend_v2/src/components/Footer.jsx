import { Box, Typography, Link, Container } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                borderTop: '1px solid',
                borderColor: 'divider',
                py: 3,
                mt: 'auto',
            }}
        >
            <Container
                maxWidth="lg"
                sx={{ maxWidth: '1200px !important', px: { xs: 2, sm: 3, md: 4 } }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                }}>
                    {/* Logo */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            width: 28,
                            height: 28,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <MusicNoteIcon sx={{ color: 'white', fontSize: 16 }} />
                        </Box>
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Racoon
                        </Typography>
                    </Box>

                    {/* Centre */}
                    <Typography variant="caption" color="text.disabled" sx={{ letterSpacing: 0.5 }}>
                        © 2026 Racoon — Studios de répétition à Paris
                    </Typography>

                    {/* Contact */}
                    <Link
                        href="mailto:bastien.beffa@gmail.com"
                        variant="caption"
                        underline="hover"
                        sx={{
                            color: 'text.secondary',
                            transition: 'color 0.2s',
                            '&:hover': { color: 'primary.main' },
                        }}
                    >
                        Contact
                    </Link>
                </Box>
            </Container>
        </Box>
    );
}
