import { createTheme } from '@mui/material/styles';

const temaPrincipal = createTheme({
  // Breakpoints personalizados
  breakpoints: {
    values: {
      xs: 0,      // Extra small devices (phones)
      sm: 600,    // Small devices (large phones, small tablets)
      md: 900,    // Medium devices (tablets)
      lg: 1200,   // Large devices (desktops)
      xl: 1536,   // Extra large devices (large desktops)
    },
  },
  
  // Tipografía responsive
  typography: {
    fontSize: 14,
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: 'clamp(1.75rem, 4vw, 3rem)',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 'clamp(1.25rem, 3vw, 2rem)',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: 'clamp(1.125rem, 2.5vw, 1.75rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 'clamp(1rem, 2vw, 1.5rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: 'clamp(0.875rem, 1.8vw, 1.25rem)',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: 'clamp(0.75rem, 1.3vw, 0.875rem)',
      lineHeight: 1.5,
    },
    button: {
      fontSize: 'clamp(0.875rem, 1.8vw, 1rem)',
      fontWeight: 500,
      textTransform: 'none',
    },
  },

  palette: {
    mode: 'light', 
    primary: {
      main: '#ff3b59',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  
  shape: {
    borderRadius: 12,
  },

  // Spacing responsive - usa rem para escalado
  spacing: (factor: number) => `${0.25 * factor}rem`,

  // Sombras más suaves
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.08),0px 1px 1px 0px rgba(0,0,0,0.06),0px 1px 3px 0px rgba(0,0,0,0.04)',
    '0px 3px 1px -2px rgba(0,0,0,0.08),0px 2px 2px 0px rgba(0,0,0,0.06),0px 1px 5px 0px rgba(0,0,0,0.04)',
    '0px 3px 3px -2px rgba(0,0,0,0.08),0px 3px 4px 0px rgba(0,0,0,0.06),0px 1px 8px 0px rgba(0,0,0,0.04)',
    '0px 2px 4px -1px rgba(0,0,0,0.08),0px 4px 5px 0px rgba(0,0,0,0.06),0px 1px 10px 0px rgba(0,0,0,0.04)',
    '0px 3px 5px -1px rgba(0,0,0,0.08),0px 5px 8px 0px rgba(0,0,0,0.06),0px 1px 14px 0px rgba(0,0,0,0.04)',
    '0px 3px 5px -1px rgba(0,0,0,0.08),0px 6px 10px 0px rgba(0,0,0,0.06),0px 1px 18px 0px rgba(0,0,0,0.04)',
    '0px 4px 5px -2px rgba(0,0,0,0.08),0px 7px 10px 1px rgba(0,0,0,0.06),0px 2px 16px 1px rgba(0,0,0,0.04)',
    '0px 5px 5px -3px rgba(0,0,0,0.08),0px 8px 10px 1px rgba(0,0,0,0.06),0px 3px 14px 2px rgba(0,0,0,0.04)',
    '0px 5px 6px -3px rgba(0,0,0,0.08),0px 9px 12px 1px rgba(0,0,0,0.06),0px 3px 16px 2px rgba(0,0,0,0.04)',
    '0px 6px 6px -3px rgba(0,0,0,0.08),0px 10px 14px 1px rgba(0,0,0,0.06),0px 4px 18px 3px rgba(0,0,0,0.04)',
    '0px 6px 7px -4px rgba(0,0,0,0.08),0px 11px 15px 1px rgba(0,0,0,0.06),0px 4px 20px 3px rgba(0,0,0,0.04)',
    '0px 7px 8px -4px rgba(0,0,0,0.08),0px 12px 17px 2px rgba(0,0,0,0.06),0px 5px 22px 4px rgba(0,0,0,0.04)',
    '0px 7px 8px -4px rgba(0,0,0,0.08),0px 13px 19px 2px rgba(0,0,0,0.06),0px 5px 24px 4px rgba(0,0,0,0.04)',
    '0px 7px 9px -4px rgba(0,0,0,0.08),0px 14px 21px 2px rgba(0,0,0,0.06),0px 5px 26px 4px rgba(0,0,0,0.04)',
    '0px 8px 9px -5px rgba(0,0,0,0.08),0px 15px 22px 2px rgba(0,0,0,0.06),0px 6px 28px 5px rgba(0,0,0,0.04)',
    '0px 8px 10px -5px rgba(0,0,0,0.08),0px 16px 24px 2px rgba(0,0,0,0.06),0px 6px 30px 5px rgba(0,0,0,0.04)',
    '0px 8px 11px -5px rgba(0,0,0,0.08),0px 17px 26px 2px rgba(0,0,0,0.06),0px 6px 32px 5px rgba(0,0,0,0.04)',
    '0px 9px 11px -5px rgba(0,0,0,0.08),0px 18px 28px 2px rgba(0,0,0,0.06),0px 7px 34px 6px rgba(0,0,0,0.04)',
    '0px 9px 12px -6px rgba(0,0,0,0.08),0px 19px 29px 2px rgba(0,0,0,0.06),0px 7px 36px 6px rgba(0,0,0,0.04)',
    '0px 10px 13px -6px rgba(0,0,0,0.08),0px 20px 31px 3px rgba(0,0,0,0.06),0px 8px 38px 7px rgba(0,0,0,0.04)',
    '0px 10px 13px -6px rgba(0,0,0,0.08),0px 21px 33px 3px rgba(0,0,0,0.06),0px 8px 40px 7px rgba(0,0,0,0.04)',
    '0px 10px 14px -6px rgba(0,0,0,0.08),0px 22px 35px 3px rgba(0,0,0,0.06),0px 8px 42px 7px rgba(0,0,0,0.04)',
    '0px 11px 14px -7px rgba(0,0,0,0.08),0px 23px 36px 3px rgba(0,0,0,0.06),0px 9px 44px 8px rgba(0,0,0,0.04)',
    '0px 11px 15px -7px rgba(0,0,0,0.08),0px 24px 38px 3px rgba(0,0,0,0.06),0px 9px 46px 8px rgba(0,0,0,0.04)',
  ],

  components: {
   
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          height: '56px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(8px)',
          borderRadius: 0, 
          [theme.breakpoints.up('sm')]: {
            height: '64px',
          },
        }),
      },
    },
    
    // Buttons completamente responsive
    MuiButton: { 
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 24,  
          textTransform: 'none',
          fontWeight: 500,
          minHeight: '44px', // Touch target
          padding: theme.spacing(1, 2),
          fontSize: 'clamp(0.875rem, 1.8vw, 1rem)',
          transition: 'all 0.2s ease-in-out',
          [theme.breakpoints.up('sm')]: {
            padding: theme.spacing(1.5, 3),
            minHeight: '48px',
          },
          [theme.breakpoints.up('md')]: {
            padding: theme.spacing(1.5, 4),
          },
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(255, 59, 89, 0.3)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        }),
        sizeSmall: ({ theme }) => ({
          padding: theme.spacing(0.5, 1.5),
          minHeight: '36px',
          fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
        }),
        sizeLarge: ({ theme }) => ({
          padding: theme.spacing(2, 4),
          minHeight: '52px',
          fontSize: 'clamp(1rem, 2vw, 1.125rem)',
          [theme.breakpoints.up('md')]: {
            padding: theme.spacing(2.5, 5),
          },
        }),
      },
    },

    // Container responsive
    MuiContainer: {
      styleOverrides: {
        root: ({ theme }) => ({
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
          [theme.breakpoints.up('sm')]: {
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
          },
          [theme.breakpoints.up('lg')]: {
            paddingLeft: theme.spacing(4),
            paddingRight: theme.spacing(4),
          },
        }),
      },
    },

    // Typography responsive
    MuiTypography: {
      styleOverrides: {
        root: {
          wordBreak: 'break-word',
        },
        h1: {
          marginBottom: '1.5rem',
        },
        h2: {
          marginBottom: '1.25rem',
        },
        h3: {
          marginBottom: '1rem',
        },
        h4: {
          marginBottom: '0.875rem',
        },
        h5: {
          marginBottom: '0.75rem',
        },
        h6: {
          marginBottom: '0.625rem',
        },
      },
    },

    // Paper responsive
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.spacing(1.5),
          [theme.breakpoints.up('md')]: {
            borderRadius: theme.spacing(2),
          },
        }),
      },
    },

    // Card responsive
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.spacing(2),
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          },
        }),
      },
    },

    // IconButton responsive
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          minWidth: '44px',
          minHeight: '44px',
          [theme.breakpoints.up('sm')]: {
            minWidth: '48px',
            minHeight: '48px',
          },
        }),
      },
    },

    // TextField responsive
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.spacing(1),
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
          },
        }),
      },
    },

    // Chip responsive
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: 'clamp(0.75rem, 1.3vw, 0.875rem)',
          height: 'auto',
          padding: theme.spacing(0.5, 1),
          '& .MuiChip-label': {
            padding: theme.spacing(0.5),
          },
        }),
      },
    },

    // Avatar responsive
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          width: '40px',
          height: '40px',
          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
          [theme.breakpoints.up('sm')]: {
            width: '44px',
            height: '44px',
          },
        }),
      },
    },

    // Menu responsive
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.spacing(1.5),
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
        }),
      },
    },

    // MenuItem responsive
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
          minHeight: '44px',
          padding: theme.spacing(1.5, 2),
          [theme.breakpoints.up('sm')]: {
            minHeight: '48px',
          },
        }),
      },
    },
  },
});

export default temaPrincipal;
// El tema principal responsive de la aplicación. Define colores, tipografía, espaciado y componentes que se adaptan automáticamente a diferentes dispositivos.