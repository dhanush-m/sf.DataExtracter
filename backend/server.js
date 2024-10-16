require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
let port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

async function getAccessToken(clientId, clientSecret, subdomain, accountMID) {
  const tokenUrl = `https://${subdomain}.auth.marketingcloudapis.com/v2/token`;
  const data = {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    account_id: accountMID
  };

  try {
    console.log('Requesting access token for subdomain:', subdomain);
    const response = await axios.post(tokenUrl, data);
    console.log('Access token generated successfully');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.response ? error.response.data : error.message);
    throw error;
  }
}

app.post('/api/login', async (req, res) => {
  const { clientId, clientSecret, subdomain, accountMID } = req.body;

  console.log('Login attempt received:', { subdomain, clientId: clientId.slice(0, 5) + '...', accountMID });

  if (!clientId || !clientSecret || !subdomain || !accountMID) {
    console.error('Missing required fields for login');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const accessToken = await getAccessToken(clientId, clientSecret, subdomain, accountMID);
    res.json({ accessToken, subdomain });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

async function fetchDataExtensions(accessToken, subdomain) {
  const soapUrl = `https://${subdomain}.soap.marketingcloudapis.com/Service.asmx`;
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
    <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <s:Header>
        <a:Action s:mustUnderstand="1">Retrieve</a:Action>
        <a:To s:mustUnderstand="1">${soapUrl}</a:To>
        <fueloauth xmlns="http://exacttarget.com">${accessToken}</fueloauth>
      </s:Header>
      <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
        <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">
          <RetrieveRequest>
            <ObjectType>DataExtension</ObjectType>
            <Properties>ObjectID</Properties>
            <Properties>CustomerKey</Properties>
            <Properties>Name</Properties>
            <Properties>IsSendable</Properties>
            <Properties>SendableSubscriberField.Name</Properties>
          </RetrieveRequest>
        </RetrieveRequestMsg>
      </s:Body>
    </s:Envelope>`;

  try {
    const response = await axios.post(soapUrl, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml',
        'SOAPAction': 'Retrieve'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data extensions:', error);
    throw error;
  }
}

async function fetchSFMCData(accessToken, subdomain, endpoint) {
  const baseUrl = `https://${subdomain}.rest.marketingcloudapis.com/`;
  const url = `${baseUrl}${endpoint}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
}

app.get('/api/extract/:type', async (req, res) => {
  const { type } = req.params;
  const { accessToken, subdomain } = req.query;

  try {
    let data;
    switch (type) {
      case 'dataExtensions':
        data = await fetchDataExtensions(accessToken, subdomain);
        break;
      case 'lists':
        data = await fetchSFMCData(accessToken, subdomain, 'hub/v1/lists');
        break;
      case 'triggeredSends':
        data = await fetchSFMCData(accessToken, subdomain, 'messaging/v1/messageDefinitionSends');
        break;
      case 'automations':
        data = await fetchSFMCData(accessToken, subdomain, 'automation/v1/automations');
        break;
      case 'journeys':
        data = await fetchSFMCData(accessToken, subdomain, 'interaction/v1/interactions');
        break;
      case 'content':
        data = await fetchSFMCData(accessToken, subdomain, 'asset/v1/content/assets');
        break;
      case 'emails':
        data = await fetchSFMCData(accessToken, subdomain, 'asset/v1/content/assets?type=htmlemail');
        break;
      case 'users':
        data = await fetchSFMCData(accessToken, subdomain, 'platform/v1/accounts/{{accountId}}/users');
        break;
      case 'sendClassifications':
        data = await fetchSFMCData(accessToken, subdomain, 'email/v1/sendClassifications');
        break;
      default:
        throw new Error('Invalid data type');
    }
    res.json(data);
  } catch (error) {
    console.error(`Error extracting ${type}:`, error);
    res.status(500).json({ error: `Data extraction failed for ${type}`, details: error.message });
  }
});

function startServer() {
  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying the next one...`);
      port++;
      server.close();
      startServer();
    } else {
      console.error(err);
    }
  });
}

startServer();