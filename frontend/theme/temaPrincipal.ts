import {createTheme} from '@mui/material/styles';


const temaPrincipal = createTheme({
  palette: {
    primary: {
      main: '#ff3b59',
      contrastText: '#ffffff',
    },
  },
  shape: {
    borderRadius: 12,
    },

    components: {
      MuiButton: { 
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
            root: {
                borderRadius: 24,  
                textTransform: 'none',
            },
        },
      },
    },
});

export default temaPrincipal;
// El tema principal de la aplicación. Se utiliza para definir los colores y estilos globales de la aplicación.