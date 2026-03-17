import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/env';
import { useAuth } from '../hooks/useAuth';

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
      text: 'Al menos 8 caracteres'
    },
    {
      met: /[A-Z]/.test(password),
      text: 'Al menos una mayuscula'
    },
    {
      met: /[a-z]/.test(password),
      text: 'Al menos una minuscula'
    },
    {
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      text: 'Al menos un caracter especial'
    }
  ];

  return (
    <List dense sx={{ mt: 1 }}>
      {requirements.map((requirement, index) => (
        <ListItem key={index} sx={{ py: 0 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            {requirement.met ? (
              <CheckCircleOutlineIcon color="success" fontSize="small" />
            ) : (
              <ErrorOutlineIcon color="error" fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={requirement.text}
            sx={{
              color: requirement.met ? 'success.main' : 'text.secondary',
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem'
              }
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
    name: ''
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    name: false
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const withBase = (path: string) => new URL(path, API_BASE_URL).toString();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setTouched({ email: false, password: false, name: false });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setTouched((current) => ({
      ...current,
      [event.target.name]: true
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setTouched({
      email: true,
      password: true,
      name: tabValue === 1
    });

    if (!formData.email || !formData.password || (tabValue === 1 && !formData.name)) {
      return;
    }

    try {
      if (tabValue === 0) {
        await login(formData.email, formData.password);
        navigate('/map', { replace: true });
      } else {
        const response = await fetch(withBase('/api/auth/register'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData),
          credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Error en el registro');
        }

        setSuccessMessage('Se ha registrado satisfactoriamente');
        setTabValue(0);
        setFormData({
          email: '',
          password: '',
          name: ''
        });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error en la autenticacion');
    }
  };

  return (
    <Paper elevation={3} sx={{ maxWidth: 420, width: '100%', mx: 'auto', borderRadius: 4 }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Tab label="Iniciar sesion" />
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
            helperText={touched.email && !formData.email ? 'Por favor ingresa tu email' : ''}
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
            helperText={
              touched.password && !formData.password ? 'Por favor ingresa tu contraseña' : ''
            }
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, color: '#fff' }}>
            Iniciar sesion
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
            helperText={touched.name && !formData.name ? 'Por favor ingresa tu nombre' : ''}
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
            helperText={touched.email && !formData.email ? 'Por favor ingresa tu email' : ''}
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
            helperText={
              touched.password && !formData.password ? 'Por favor ingresa tu contraseña' : ''
            }
          />
          <PasswordRequirements password={formData.password} />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, color: '#fff' }}>
            Registrarse
          </Button>
        </TabPanel>
      </form>

      <Dialog
        open={Boolean(successMessage)}
        onClose={() => setSuccessMessage('')}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
        PaperProps={{
          sx: {
            minWidth: '300px',
            textAlign: 'center',
            padding: '20px'
          }
        }}
      >
        <DialogContent>
          <DialogContentText
            id="success-dialog-description"
            sx={{
              textAlign: 'center',
              fontSize: '1.2rem',
              color: 'success.main',
              fontWeight: 'bold'
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
