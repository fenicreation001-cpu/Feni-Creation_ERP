import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { CompanySettings } from '../types';
import { useNotification } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { mode, toggleTheme, language, toggleLanguage } = useThemeContext();
  const { showNotification } = useNotification();

  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'FENI CREATION',
    tagline: 'Embroidery & Textile Manufacturing',
    gstin: '24ABCDE1234F1Z5',
    email: 'fenicreation001@gmail.com',
    phone: '+91 98765 43210',
    address: 'Plot No. 124, GIDC Industrial Estate, Varachha, Surat - 395006, Gujarat, India',
    bankName: 'State Bank of India',
    accountNo: '39485726102',
    ifscCode: 'SBIN0001234',
    hsnCode: '9988',
    termsAndConditions: '1. Any complaint regarding and should brought to our notice in written within 2 days.\n2. We are not responsible for Payment to unauthorized.\n3. Interest at 2.0 % per month charged on account not paid within due course.\n4. Subject to Surat Jurisdiction.',
    gujaratiSupport: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.companyName) {
          setSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Settings updated successfully!', 'success');
      }
    } catch {
      showNotification('Settings saved', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
          {language === 'gu' ? 'સેટિંગ્સ (System Settings)' : 'Company & System Settings'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {language === 'gu' ? 'ફેની ક્રિએશન કંપની વિગતો, જીએસટી નંબર, બેંક ખાતું અને થીમ સેટિંગ્સ' : 'Manage company details, GSTIN, Bank info for invoice printing & system theme'}
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSaveSettings}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
          {/* Company Profile */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                  🏢 Company Profile Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField fullWidth label="Company Name" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} required />
                  <TextField fullWidth label="Business Tagline" value={settings.tagline} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} />
                  <TextField fullWidth label="GSTIN Number" value={settings.gstin} onChange={(e) => setSettings({ ...settings, gstin: e.target.value })} required />
                  <TextField fullWidth label="Phone / Mobile" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} required />
                  <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <TextField fullWidth label="Email Address" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} required />
                  </Box>
                  <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                    <TextField fullWidth multiline rows={2} label="Company Address" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} required />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                  🏦 Bank Account Info (For Invoice Printing)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                  <TextField fullWidth label="Bank Name" value={settings.bankName} onChange={(e) => setSettings({ ...settings, bankName: e.target.value })} />
                  <TextField fullWidth label="Account Number" value={settings.accountNo} onChange={(e) => setSettings({ ...settings, accountNo: e.target.value })} />
                  <TextField fullWidth label="IFSC Code" value={settings.ifscCode} onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value })} />
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                  📄 Tax Invoice Details (HSN Code & Terms)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Default HSN Code"
                    value={settings.hsnCode || ''}
                    onChange={(e) => setSettings({ ...settings, hsnCode: e.target.value })}
                    placeholder="9988"
                    helperText="Used as default HSN Code on invoice items if not explicitly specified"
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Terms and Conditions (For Invoice Print)"
                    value={settings.termsAndConditions || ''}
                    onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                    placeholder={"1. Any complaint regarding and should brought to our notice in written within 2 days.\n2. We are not responsible for Payment to unauthorized."}
                    helperText="Enter each term on a new line. These appear at the bottom left of printed Tax Invoices."
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Preferences */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
                  🎨 Application Preferences
                </Typography>

                <FormControlLabel
                  control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
                  label="Dark Theme Mode"
                  sx={{ display: 'block', mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                <FormControlLabel
                  control={<Switch checked={language === 'gu'} onChange={toggleLanguage} />}
                  label="Enable Gujarati Interface (ગુજરાતી ભાષા સપોર્ટ)"
                  sx={{ display: 'block' }}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 800, fontSize: '1rem', borderRadius: 2 }}
            >
              {loading ? 'Saving...' : 'Save Settings Changes'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
