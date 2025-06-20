import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from './LogoutButton';
import Logo from "../../img/logo_bookeat.png";
import LogoWhite from "../../img/logo_bookeat_white.png";

const pages = ['Inicio', 'Sobre Nosotros'];

function ResponsiveAppBar() {
  const { user } = useAuth();
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
    // TODO: Add navigation logic
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar 
      position="sticky" 
      color="primary"
      sx={{
        height: { xs: 56, sm: 64 }, 
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth={false} sx={{ height: '100%' }}>
        <Toolbar 
          disableGutters 
          sx={{ 
            height: '100%', 
            minHeight: 'unset !important', 
            display: 'flex', 
            alignItems: 'center', 
            px: { xs: 1, sm: 2 }, 
          }}
        >
          {/* MOBILE - Hamburger Menu Icon */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mr: 1 }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuItem onClick={() => { handleCloseNavMenu(); /* navigate to home */ }}>
                <Box 
            sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              flexGrow: 1, 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 0.5,
            }}
          >
            <Box
            component="img"
            sx={{
            height: 56,
            }}
            alt="BookEat Logo"
            src={LogoWhite}
            />
          </Box>
              </MenuItem>
              {pages.map((page) => (
                <MenuItem key={page} onClick={() => { handleCloseNavMenu(); /* navigate to page */ }}>
                  <Typography textAlign="center">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* DESKTOP - BookEat Logo and Title as a Button */}
          <Button
            component="a"
            href="/"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center', 
              textTransform: 'none',
              padding: {md: '6px 12px', lg: '8px 16px'}, 
              marginRight: 2, 
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            
            <Box
            component="img"
            sx={{
            height: 64,
            }}
            alt="BookEat Logo"
            src={Logo}
            />
          </Button>
          
          {/* MOBILE - Centered BookEat Logo and Title */}
          <Box 
            sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              flexGrow: 1, 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: 0.5,
            }}
          >
            <Box
            component="img"
            sx={{
            height: 56,
            }}
            alt="BookEat Logo"
            src={Logo}
            />
          </Box>

          

          {/* DESKTOP - Navigation Pages */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center', 
              justifyContent: 'flex-start', 
              gap: { md: 0.5, lg: 1 }, 
            }}
          >
            {pages.map((page) => (
              <Button
                key={page}
                onClick={() => { handleCloseNavMenu(); /* navigate */ }}
                sx={{ 
                  color: 'white !important', 
                  padding: {md: '6px 12px', lg: '8px 16px'}, 
                  display: 'inline-flex', 
                  alignItems: 'center',   
                  minHeight: '36px', 
                  fontSize: { md: '0.875rem', lg: '1rem' }, 
                  textTransform: 'none', 
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  }
                }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* User Avatar and Menu */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Abrir configuración">
              <IconButton 
                onClick={handleOpenUserMenu} 
                sx={{ p: { xs: 0.5, sm: 1 } }}
              >
                <Avatar 
                  alt={user?.email || 'Usuario'}
                  src={user?.picture}
                  sx={{ 
                    width: { xs: 32, sm: 40 }, 
                    height: { xs: 32, sm: 40 },
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    backgroundColor: user?.picture ? 'transparent' : 'secondary.main',
                    fontWeight: 600,
                    color: 'primary.contrastText',
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar-user"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <LogoutButton />
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;
