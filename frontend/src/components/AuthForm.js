import React, { useState } from 'react';

const AuthForm = ({ onAuthenticate }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [accountMID, setAccountMID] = useState('');
  const [accessToken, setAccessToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, clientSecret, subdomain, accountMID }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      onAuthenticate(data.accessToken, subdomain);
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Client ID"
          required
        />
        <input
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Client Secret"
          required
        />
        <input
          type="text"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          placeholder="Subdomain"
          required
        />
        <input
          type="text"
          value={accountMID}
          onChange={(e) => setAccountMID(e.target.value)}
          placeholder="Account MID"
          required
        />
        <button type="submit">Authenticate</button>
      </form>
      {accessToken && (
        <div>
          <h3>Access Token:</h3>
          <p>{accessToken}</p>
        </div>
      )}
    </div>
  );
};

export default AuthForm;