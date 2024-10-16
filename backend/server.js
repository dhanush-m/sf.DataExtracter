require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { exec } = require('child_process');
const bldr = require('@basetime/bldr-sfmc');
const xml2js = require('xml2js');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Parse the XML response
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);

    // Extract the data extensions from the parsed result
    const dataExtensions = result['soap:Envelope']['soap:Body'].RetrieveResponseMsg.Results;

    // If dataExtensions is not an array, wrap it in an array
    return Array.isArray(dataExtensions) ? dataExtensions : [xtensions];
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

async function fetchUsers(accessToken, subdomain) {
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
            <ObjectType>AccountUser</ObjectType>
            <QueryAllAccounts>true</QueryAllAccounts>
            <Properties>email</Properties>
            <Properties>ActiveFlag</Properties>
            <Properties>CreatedDate</Properties>
            <Properties>isAPIUser</Properties>
            <Properties>UserID</Properties>
            <Properties>LastSuccessfulLogin</Properties>
            <AssociatedBusinessUnits>
              <BusinessUnit>
                <Properties>Name</Properties>
              </BusinessUnit>
            </AssociatedBusinessUnits>
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

    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);

    const users = result['soap:Envelope']['soap:Body'].RetrieveResponseMsg.Results;
    return Array.isArray(users) ? users : [users];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

async function fetchAutomations(accessToken, subdomain) {
  const restUrl = `https://${subdomain}.rest.marketingcloudapis.com/automation/v1/automations`;
  let allAutomations = [];
  let page = 1;
  let hasMorePages = true;

  try {
    console.log('Fetching users...');
    const users = await fetchUsers(accessToken, subdomain);
    const userMap = new Map(users.map(user => [user.UserID, user]));

    console.log('Fetching automations...');
    while (hasMorePages) {
      const response = await axios.get(restUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $page: page,
          $pageSize: 10000,
          $orderBy: 'ModifiedDate DESC',
          $fields: 'id,name,description,status,createdDate,modifiedDate,lastRunTime,nextRunTime,schedule,createdBy'
        }
      });

      console.log(`Fetched page ${page} of automations:`, response.data);

      const automations = response.data.items || [];
      allAutomations = allAutomations.concat(automations);

      hasMorePages = response.data.page < response.data.pageCount;
      page++;
    }

    console.log(`Total automations fetched: ${allAutomations.length}`);

    // Fetch activities for each automation and add user information
    const automationsWithDetails = await Promise.all(allAutomations.map(async (automation) => {
      let createdByUser = 'Unknown';
      if (automation.createdBy) {
        const user = userMap.get(automation.createdBy);
        createdByUser = user ? user.email : 'Unknown';
      }

      const activitiesUrl = `${restUrl}/${automation.id}/activities`;
      let activities = [];
      try {
        console.log(`Fetching activities for automation ${automation.id}`);
        const activitiesResponse = await axios.get(activitiesUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`Activities response for ${automation.id}:`, activitiesResponse.data);

        activities = await Promise.all((activitiesResponse.data.items || []).map(async (activity) => {
          const activityDetailUrl = `${restUrl}/${automation.id}/activities/${activity.id}`;
          try {
            const detailResponse = await axios.get(activityDetailUrl, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            return detailResponse.data;
          } catch (detailError) {
            console.error(`Error fetching details for activity ${activity.id}:`, detailError.response ? detailError.response.data : detailError.message);
            return activity;
          }
        }));
      } catch (error) {
        console.error(`Error fetching activities for automation ${automation.id}:`, error.response ? error.response.data : error.message);
      }

      return {
        ...automation,
        createdByUser,
        activities
      };
    }));

    console.log('Finished processing all automations');
    return automationsWithDetails;
  } catch (error) {
    console.error('Error fetching automations:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function fetchSubscribers(accessToken, subdomain) {
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
            <ObjectType>Subscriber</ObjectType>
            <Properties>CreatedDate</Properties>
            <Properties>Client.ID</Properties>
            <Properties>EmailAddress</Properties>
            <Properties>SubscriberKey</Properties>
            <Properties>Status</Properties>
            <Properties>UnsubscribedDate</Properties>
            <Properties>EmailTypePreference</Properties>
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

    // Parse the XML response
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);

    // Extract the subscribers from the parsed result
    const subscribers = result['soap:Envelope']['soap:Body'].RetrieveResponseMsg.Results;

    // If subscribers is not an array, wrap it in an array
    return Array.isArray(subscribers) ? subscribers : [subscribers];
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    throw error;
  }
}

async function fetchSendClassifications(accessToken, subdomain) {
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
                <ObjectType>SendClassification</ObjectType>
                <Properties>ObjectID</Properties>
                <Properties>CustomerKey</Properties>
                <Properties>Name</Properties>
                <Properties>Description</Properties>
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

    // Parse the XML response
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);

    // Extract the send classifications from the parsed result
    const sendClassifications = result['soap:Envelope']['soap:Body'].RetrieveResponseMsg.Results;

    // If sendClassifications is not an array, wrap it in an array
    return Array.isArray(sendClassifications) ? sendClassifications : [sendClassifications];
  } catch (error) {
    console.error('Error fetching send classifications:', error);
    throw error;
  }
}

// Add this new function after the other fetch functions

async function fetchJourneys(accessToken, subdomain) {
  const restUrl = `https://${subdomain}.rest.marketingcloudapis.com/interaction/v1/interactions`;
  let allJourneys = [];
  let page = 1;
  let hasMorePages = true;

  try {
    while (hasMorePages) {
      const response = await axios.get(restUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $page: page,
          $pageSize: 1000 // Adjust this value if needed
        }
      });

      const journeys = response.data.items || [];
      allJourneys = allJourneys.concat(journeys);

      // Check if there are more pages
      hasMorePages = response.data.page < response.data.pageCount;
      page++;
    }

    return allJourneys;
  } catch (error) {
    console.error('Error fetching journeys:', error);
    throw error;
  }
}

// Add this new function after the other fetch functions

async function fetchListSoap(accessToken, subdomain) {
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
                <ObjectType>List</ObjectType>
                <Properties>ID</Properties>
                <Properties>ListName</Properties>
                <Properties>Category</Properties> 
                <Properties>Description</Properties>
                <Properties>CreatedDate</Properties>
                <Properties>ModifiedDate</Properties>
                </RetrieveRequest>
            </RetrieveRequestMsg>
        </s:Body>
    </s:Envelope>`;

  try {
    console.log('Sending SOAP request to:', soapUrl);
    console.log('SOAP Envelope:', soapEnvelope);

    const response = await axios.post(soapUrl, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml',
        'SOAPAction': 'Retrieve'
      }
    });

    console.log('SOAP Response:', response.data);

    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(response.data);
    
    console.log('Parsed SOAP Response:', JSON.stringify(result, null, 2));

    const lists = result['soap:Envelope']['soap:Body'].RetrieveResponseMsg.Results;

    return Array.isArray(lists) ? lists : [lists];
  } catch (error) {
    console.error('Error fetching lists:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

// Replace the existing contentAssetsGenerator function with this new function
async function fetchContentAssets(accessToken, subdomain) {
  const restUrl = `https://${subdomain}.rest.marketingcloudapis.com/asset/v1/content/assets`;
  let allAssets = [];
  let page = 1;
  let hasMorePages = true;

  try {
    while (hasMorePages) {
      const response = await axios.get(restUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $page: page,
          $pageSize: 250 // Adjust this value if needed
        }
      });

      const assets = response.data.items || [];
      allAssets = allAssets.concat(assets);

      // Check if there are more pages
      hasMorePages = response.data.page < response.data.pageCount;
      page++;
    }

    return allAssets;
  } catch (error) {
    console.error('Error fetching content assets:', error);
    throw error;
  }
}

// Update the existing /api/extract/:type endpoint
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
        data = await fetchListSoap(accessToken, subdomain);
        break;
      case 'triggeredSends':
        data = await fetchSFMCData(accessToken, subdomain, 'messaging/v1/messageDefinitionSends');
        break;
      case 'automations':
        data = await fetchAutomations(accessToken, subdomain);
        break;
      case 'journeys':
        data = await fetchJourneys(accessToken, subdomain);
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
        data = await fetchSendClassifications(accessToken, subdomain);
        break;
      case 'subscribers':
        data = await fetchSubscribers(accessToken, subdomain);
        break;
      case 'content-assets':
        data = await fetchContentAssets(accessToken, subdomain);
        break;
      default:
        throw new Error('Invalid data type');
    }
    
    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error(`Error extracting ${type}:`, error);
    let errorMessage = `Data extraction failed for ${type}`;
    let errorDetails = error.message;
    
    if (error.response) {
      errorDetails += ` | Status: ${error.response.status} | ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      errorDetails += ` | ${error.code || 'Network error'}`;
    }
    
    res.status(500).json({ error: errorMessage, details: errorDetails });
  }
});

app.post('/sfmc-auth', async (req, res) => {
  const { name, integrationType, parentMID, clientId, clientSecret, authURI } = req.body;
  
  try {
    const result = await bldr.config({
      name,
      integrationType,
      parentMID,
      clientId,
      clientSecret,
      authURI
    });
    res.json({ success: true, message: 'SFMC configuration successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'SFMC configuration failed', error: error.message });
  }
});

app.get('/sfmc-assets', async (req, res) => {
  try {
    const assets = await bldr.getAssets();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve SFMC assets', error: error.message });
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
