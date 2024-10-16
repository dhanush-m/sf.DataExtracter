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
  const [extractedData, setExtractedData] = useState({});
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
    setSelectedDataType(type);
    try {
      const response = await axios.get(`http://localhost:5000/api/extract/${type}`, {
        params: { accessToken, subdomain }
      });
      // For data extensions, pass the raw response data
      if (type === 'dataExtensions') {
        setExtractedData(response.data);
      } else {
        // For other types, assume the response is already in the correct format
        setExtractedData(response.data);
      }
      setLoading(false);
    } catch (error) {
      setError(`Failed to extract ${type}. Please try again.`);
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
          <Button variant="outlined" onClick={() => handleExtract('Automations')} disabled={loading}>
            Automations
          </Button>
          {/* Add more buttons for other data types */}
        </div>
      )}
      {extractedData && Object.keys(extractedData).length > 0 && (
        <DataDisplay data={extractedData} type={selectedDataType} />
      )}
    </Container>
  );
}

export default App;