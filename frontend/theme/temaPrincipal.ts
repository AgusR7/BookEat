import { createTheme } from '@mui/material/styles';

const temaPrincipal = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#ff734f',
      light: '#ff9b80',
      dark: '#db5636',
      contrastText: '#fffaf7'
    },
    secondary: {
      main: '#1f7666',
      light: '#5ca394',
      dark: '#125447',
      contrastText: '#f4fffc'
    },
    background: {
      default: '#fffaf5',
      paper: '#ffffff'
    },
    text: {
      primary: '#1f2937',
      secondary: '#5b6472'
    },
    divider: 'rgba(15, 23, 42, 0.08)'
  },
  typography: {
    fontFamily: ['"Trebuchet MS"', '"Segoe UI Variable Text"', '"Gill Sans"', 'sans-serif'].join(
      ','
    ),
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 800, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: {
      textTransform: 'none',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 18
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(120deg, rgba(255,115,79,0.96), rgba(255,94,98,0.92))',
          boxShadow: '0 10px 30px rgba(255,115,79,0.24)',
          backdropFilter: 'blur(14px)'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24
        }
      }
    }
  }
});

export default temaPrincipal;
