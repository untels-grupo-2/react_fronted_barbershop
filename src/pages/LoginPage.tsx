import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.post('/api/autenticacion/login', { username, password });
      saveSession(data.data.token, data.data.refreshToken, username);
      navigate('/dashboard');
    } catch {
      setError('Credenciales incorrectas. Verifica usuario y contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f5f5f5', px: 1.25 }}>
      <Card sx={{ width: '100%', maxWidth: 400, p: { xs: 0.5, sm: 2 }, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2.5, fontSize: { xs: '1.12rem', sm: '1.5rem' }, lineHeight: 1.25 }}>
            Diamond BarberHub — Admin
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField label="Usuario" fullWidth margin="normal" value={username} onChange={(e) => setUsername(e.target.value)} />
          <TextField label="Contraseña" type="password" fullWidth margin="normal" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleLogin} disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
