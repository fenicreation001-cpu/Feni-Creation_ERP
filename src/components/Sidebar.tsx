import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ReceiptLong as BillingIcon,
  ShoppingCart as PurchaseIcon,
  Badge as WorkerIcon,
  People as PartyIcon,
  AccountBalanceWallet as PaymentIcon,
  Assessment as ReportIcon,
  Settings as SettingIcon,
  Storefront as LogoIcon,
} from '@mui/icons-material';
import { useThemeContext } from '../context/ThemeContext';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  drawerWidth: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile, drawerWidth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { language } = useThemeContext();

  const navItems = [
    { text: 'Dashboard', guText: 'ડેશબોર્ડ', icon: <DashboardIcon />, path: '/' },
    { text: 'Billing Management', guText: 'બિલિંગ મેનેજમેન્ટ', icon: <BillingIcon />, path: '/billing' },
    { text: 'Material Purchase', guText: 'ખરીદી મેનેજમેન્ટ', icon: <PurchaseIcon />, path: '/purchases' },
    { text: 'Worker Salary (Karigar)', guText: 'કારીગર પગાર (ઉપાડ)', icon: <WorkerIcon />, path: '/workers' },
    { text: 'Party Management', guText: 'પાર્ટી મેનેજમેન્ટ', icon: <PartyIcon />, path: '/parties' },
    { text: 'Payment Management', guText: 'ચુકવણી મેનેજમેન્ટ', icon: <PaymentIcon />, path: '/payments' },
    { text: 'Reports & Export', guText: 'રિપોર્ટ્સ અને એક્સપોર્ટ', icon: <ReportIcon />, path: '/reports' },
    { text: 'Settings', guText: 'સેટિંગ્સ', icon: <SettingIcon />, path: '/settings' },
  ];

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#0f172a', // Slate 900
        color: '#f8fafc',
        py: 2.5,
        px: 2,
      }}
    >
      {/* Brand Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 3 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            bgcolor: '#6366f1', // Indigo 500
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}
        >
          F
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#ffffff', letterSpacing: '-0.02em' }}>
            FENI CREATION
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>
            {language === 'gu' ? 'બિલિંગ અને એકાઉન્ટિંગ' : 'Textile Billing & ERP'}
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <List disablePadding sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={isMobile ? onCloseMobile : undefined}
                sx={{
                  borderRadius: '8px',
                  py: 1,
                  px: 1.8,
                  bgcolor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#818cf8' : '#94a3b8',
                  borderLeft: isActive ? '4px solid #6366f1' : '4px solid transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    '& .MuiListItemIcon-root': {
                      color: '#ffffff',
                    },
                  },
                  transition: 'all 0.15s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#818cf8' : '#64748b',
                    minWidth: 36,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={language === 'gu' ? item.guText : item.text}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: isActive ? '0.01em' : 'normal',
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#1e293b', my: 2 }} />

      {/* Footer / User Profile Badge */}
      <Box sx={{ p: 1.5, bgcolor: '#1e293b', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: '#4f46e5',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        >
          AD
        </Box>
        <Box sx={{ overflow: 'hidden', flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.8rem', lineHeight: 1.2 }} noWrap>
            Feni Admin
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }} noWrap>
            GSTIN: 24ABCDE1234F1Z5
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#0f172a', borderRight: '1px solid #1e293b' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#0f172a', borderRight: '1px solid #1e293b' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};
