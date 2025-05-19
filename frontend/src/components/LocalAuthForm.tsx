import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogContent,
  DialogContentText,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PasswordRequirements = ({ password }: { password: string }) => {
  const requirements = [
    {
      met: password.length >= 8,
      text: 'Al menos 8 caracteres',
    },
    {
      met: /[A-Z]/.test(password),
      text: 'Al menos una mayúscula',
    },
    {
      met: /[a-z]/.test(password),
      text: 'Al menos una minúscula',
    },
    {
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      text: 'Al menos un carácter especial',
    },
  ];

  return (
    <List dense sx={{ mt: 1 }}>
      {requirements.map((req, index) => (
        <ListItem key={index} sx={{ py: 0 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {req.met ? (
              <CheckCircleOutlineIcon color="success" fontSize="small" />
            ) : (
              <ErrorOutlineIcon color="error" fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={req.text}
            sx={{
              color: req.met ? 'success.main' : 'text.secondary',
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
              },
            }}
          />
        </ListItem>
      ))}
    </List>
  );
};

const LocalAuthForm: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    name: false,
  });
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setTouched({ email: false, password: false, name: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched({
      ...touched,
      [e.target.name]: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all fields as touched on submit
    setTouched({
      email: true,
      password: true,
      name: tabValue === 1,
    });

    // Validate required fields
    if (!formData.email || !formData.password || (tabValue === 1 && !formData.name)) {
      return;
    }

    try {
      const endpoint = tabValue === 0 ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la autenticación');
      }

      // After successful login/register, get the user data
      const userResponse = await axios.get('/api/auth/me', { withCredentials: true });
      setUser(userResponse.data);

      if (tabValue === 1) {
        // Si es registro, mostrar mensaje y cambiar a pestaña de login
        setSuccessMessage('Se ha registrado satisfactoriamente');
        setTabValue(0);
        // Limpiar el formulario
        setFormData({
          email: '',
          password: '',
          name: '',
        });
      } else {
        // Si es login, redirigir al mapa
        window.location.href = '/map';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la autenticación');
    }
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 400, width: '100%', mx: 'auto' }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Iniciar Sesión" />
        <Tab label="Registrarse" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mx: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TabPanel value={tabValue} index={0}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            margin="normal"
            required
            error={touched.email && !formData.email}
            helperText={touched.email && !formData.email ? "Por favor ingrese su correo electrónico" : ""}
          />
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            margin="normal"
            required
            error={touched.password && !formData.password}
            helperText={touched.password && !formData.password ? "Por favor ingrese su contraseña" : ""}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Iniciar Sesión
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TextField
            fullWidth
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            margin="normal"
            required
            error={touched.name && !formData.name}
            helperText={touched.name && !formData.name ? "Por favor ingrese su nombre" : ""}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={handleBlur}
            margin="normal"
            required
            error={touched.email && !formData.email}
            helperText={touched.email && !formData.email ? "Por favor ingrese su correo electrónico" : ""}
          />
          <TextField
            fullWidth
            label="Contraseña"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            onBlur={handleBlur}
            margin="normal"
            required
            error={touched.password && !formData.password}
            helperText={touched.password && !formData.password ? "Por favor ingrese su contraseña" : ""}
          />
          <PasswordRequirements password={formData.password} />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Registrarse
          </Button>
        </TabPanel>
      </form>

      <Dialog
        open={!!successMessage}
        onClose={() => setSuccessMessage('')}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
        PaperProps={{
          sx: {
            minWidth: '300px',
            textAlign: 'center',
            padding: '20px',
          },
        }}
      >
        <DialogContent>
          <DialogContentText 
            id="success-dialog-description" 
            sx={{ 
              textAlign: 'center', 
              fontSize: '1.2rem',
              color: 'success.main',
              fontWeight: 'bold',
            }}
          >
            {successMessage}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default LocalAuthForm; 