import React, { useState } from 'react';
import { Container, Typography, Button, TextField, CircularProgress, Alert } from '@mui/material';
import DataDisplay from './components/DataDisplay';
import axios from 'axios';

function App() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [accountMID, setAccountMID] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [selectedDataType, setSelectedDataType] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setAuthSuccess(false);
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        clientId,
        clientSecret,
        subdomain,
        accountMID
      });
      setAccessToken(response.data.accessToken);
      setAuthSuccess(true);
      setLoading(false);
    } catch (error) {
      setError('Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleExtract = async (type) => {
    setLoading(true);
    setError('');
    setExtractedData(null);
    setSelectedDataType(type);
    try {
      const response = await axios.get(`http://localhost:5000/api/extract/${type}`, {
        params: {
          accessToken,
          subdomain
        }
      });
      setExtractedData(response.data);
      setLoading(false);
    } catch (error) {
      setError(`Error extracting ${type}: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        SFMC Data Extractor
      </Typography>
      <TextField
        label="Client ID"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Client Secret"
        value={clientSecret}
        onChange={(e) => setClientSecret(e.target.value)}
        fullWidth
        margin="normal"
        type="password"
      />
      <TextField
        label="Subdomain"
        value={subdomain}
        onChange={(e) => setSubdomain(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Account MID"
        value={accountMID}
        onChange={(e) => setAccountMID(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleLogin} disabled={loading}>
        Login
      </Button>
      {loading && <CircularProgress />}
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      {authSuccess && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          Authenticated Successfully
        </Alert>
      )}
      {accessToken && (
        <div>
          <Typography variant="h6" gutterBottom>
            Extract Data
          </Typography>
          <Button variant="outlined" onClick={() => handleExtract('dataExtensions')} disabled={loading}>
            Data Extensions
          </Button>
          <Button variant="outlined" onClick={() => handleExtract('automations')} disabled={loading}>
            Automations
          </Button>
          <Button variant="outlined" onClick={() => handleExtract('subscribers')} disabled={loading}>
            Subscribers
          </Button>
          <Button variant="outlined" onClick={() => handleExtract('sendClassifications')} disabled={loading}>
            Send Classifications
          </Button>
          <Button variant="outlined" onClick={() => handleExtract('journeys')} disabled={loading}>
            Journeys
          </Button>
          <Button variant="outlined" onClick={() => handleExtract('lists')} disabled={loading}>
            Lists
          </Button>
          <Button variant="outlined" onClick={() => handleExtract('content-assets')} disabled={loading}>
            Assets-Content
          </Button>
          {loading && <CircularProgress />}
          {error && (
            <Typography color="error" gutterBottom>
              {error}
            </Typography>
          )}
          {!loading && !error && extractedData && (
            <DataDisplay 
              data={extractedData} 
              type={selectedDataType}
            />
          )}
        </div>
      )}
    </Container>
  );
}

export default App;
