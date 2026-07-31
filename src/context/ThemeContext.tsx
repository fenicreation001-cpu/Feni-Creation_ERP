import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'en' | 'gu';
  toggleLanguage: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  language: 'en',
  toggleLanguage: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('feni_theme') as 'light' | 'dark') || 'light';
  });

  const [language, setLanguage] = useState<'en' | 'gu'>(() => {
    return (localStorage.getItem('feni_lang') as 'en' | 'gu') || 'en';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('feni_theme', next);
      return next;
    });
  };

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'en' ? 'gu' : 'en';
      localStorage.setItem('feni_lang', next);
      return next;
    });
  };

  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#4f46e5', // Indigo 600 - Professional Polish Primary Accent
          light: '#6366f1',
          dark: '#3730a3',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#0f172a', // Slate 900
          light: '#334155',
          dark: '#020617',
          contrastText: '#ffffff',
        },
        success: {
          main: '#059669', // Emerald 600
          light: '#10b981',
          dark: '#047857',
        },
        warning: {
          main: '#d97706', // Amber 600
          light: '#f59e0b',
          dark: '#b45309',
        },
        error: {
          main: '#e11d48', // Rose 600
          light: '#f43f5e',
          dark: '#be123c',
        },
        background: {
          default: mode === 'light' ? '#f8fafc' : '#0f172a', // Slate 50
          paper: mode === 'light' ? '#ffffff' : '#1e293b',  // White or Slate 800
        },
        text: {
          primary: mode === 'light' ? '#0f172a' : '#f8fafc',
          secondary: mode === 'light' ? '#64748b' : '#94a3b8',
        },
      },
      typography: {
        fontFamily: [
          'Plus Jakarta Sans',
          'Inter',
          'Mukta',
          'Hind Vadodara',
          'Noto Sans Gujarati',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ].join(','),
        h5: {
          fontWeight: 800,
          letterSpacing: '-0.02em',
        },
        h6: {
          fontWeight: 700,
          letterSpacing: '-0.01em',
        },
        subtitle1: {
          fontWeight: 600,
        },
        button: {
          fontWeight: 700,
          textTransform: 'none',
        },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 8,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: mode === 'light' ? '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)' : '0 4px 6px -1px rgba(0,0,0,0.3)',
              borderRadius: 12,
              border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #334155',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            head: {
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: mode === 'light' ? '#64748b' : '#94a3b8',
              backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a',
              borderBottom: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #334155',
            },
            body: {
              borderBottom: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #334155',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              fontWeight: 700,
              borderRadius: 6,
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, language, toggleLanguage }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
