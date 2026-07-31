import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  InputBase,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  Badge,
  Button,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Translate as TranslateIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { DbStatusDialog } from './DbStatusDialog';

interface HeaderProps {
  onToggleMobileDrawer: () => void;
  drawerWidth: number;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileDrawer, drawerWidth }) => {
  const { mode, toggleTheme, language, toggleLanguage } = useThemeContext();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dbOpen, setDbOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch('/api/db/status');
        const data = await res.json();
        setDbConnected(!!data.connected);
      } catch {
        setDbConnected(false);
      }
    };
    checkDb();
    const timer = setInterval(checkDb, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64, px: { xs: 1.5, sm: 3 } }}>
          {/* Left Side: Mobile Hamburger & Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onToggleMobileDrawer}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="subtitle1"
              sx={{
                display: { xs: 'block', sm: 'none' },
                fontWeight: 800,
                color: 'primary.main',
                letterSpacing: '-0.02em',
                fontSize: '0.95rem',
              }}
            >
              FENI CREATION
            </Typography>

            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                bgcolor: mode === 'light' ? '#f1f5f9' : '#0f172a',
                px: 2,
                py: 0.6,
                borderRadius: '20px',
                width: { sm: 200, md: 280 },
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              <InputBase
                placeholder={language === 'gu' ? 'શોધો (બિલ, પાર્ટી...)' : 'Search Bill, Party...'}
                sx={{ fontSize: '0.88rem', width: '100%' }}
              />
            </Box>
          </Box>

          {/* Right Side Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.5 } }}>
            {/* Gujarati / English Toggle Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<TranslateIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              onClick={toggleLanguage}
              sx={{
                borderRadius: '20px',
                fontWeight: 700,
                px: { xs: 1, sm: 1.5 },
                py: 0.3,
                fontSize: { xs: '0.72rem', sm: '0.8rem' },
                borderColor: 'primary.light',
                minWidth: 'auto',
              }}
            >
              {language === 'en' ? 'ગુજરાતી' : 'English'}
            </Button>

          {/* Light / Dark Mode Toggle */}
          <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'light' ? <DarkModeIcon color="primary" /> : <LightModeIcon sx={{ color: '#ecc94b' }} />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={2} color="secondary">
                <NotificationsIcon color="action" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile Avatar */}
          <Box sx={{ ml: 1 }}>
            <Tooltip title="Account Settings">
              <IconButton onClick={handleMenuOpen} size="small">
                <Avatar
                  sx={{
                    width: 38,
                    height: 38,
                    bgcolor: 'primary.main',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                  }}
                >
                  {user?.name ? user.name.charAt(0) : 'F'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 3,
                  sx: { mt: 1, borderRadius: 2, minWidth: 200 },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {user?.name || 'Admin'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {user?.email || 'fenicreation001@gmail.com'}
                </Typography>
              </Box>
              <MenuItem onClick={handleMenuClose}>
                <PersonIcon fontSize="small" sx={{ mr: 1.5 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); logout(); }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1.5, color: 'error.main' }} />
                <Typography color="error.main">Logout</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
    <DbStatusDialog open={dbOpen} onClose={() => setDbOpen(false)} />
  </>
  );
};
