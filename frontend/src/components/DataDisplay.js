import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';
import './DataDisplay.css'; // Add this import

const DataDisplay = ({ data, type }) => {
  if (!data || Object.keys(data).length === 0) {
    return <Typography variant="body1">No data available</Typography>;
  }

  const renderTable = () => {
    if (type === 'dataExtensions') {
      return renderDataExtensionsTable();
    }
    return renderGenericTable();
  };

  const renderDataExtensionsTable = () => {
    // Parse the SOAP response
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(data, "text/xml");
    const results = xmlDoc.getElementsByTagName("Results");
    const dataExtensions = Array.from(results).map(result => ({
      Name: result.getElementsByTagName("Name")[0]?.textContent || '',
      CustomerKey: result.getElementsByTagName("CustomerKey")[0]?.textContent || '',
      ObjectID: result.getElementsByTagName("ObjectID")[0]?.textContent || '',
      IsSendable: result.getElementsByTagName("IsSendable")[0]?.textContent === 'true',
      SendableSubscriberField: result.getElementsByTagName("SendableSubscriberField.Name")[0]?.textContent || '',
    }));

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Customer Key</TableCell>
              <TableCell>Object ID</TableCell>
              <TableCell>Is Sendable</TableCell>
              <TableCell>Sendable Subscriber Field</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataExtensions.map((de, index) => (
              <TableRow key={index}>
                <TableCell>{de.Name}</TableCell>
                <TableCell>{de.CustomerKey}</TableCell>
                <TableCell>{de.ObjectID}</TableCell>
                <TableCell>{de.IsSendable ? 'Yes' : 'No'}</TableCell>
                <TableCell>{de.SendableSubscriberField}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderGenericTable = () => {
    const headers = Object.keys(data[0] || {});
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell key={index}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header, cellIndex) => (
                  <TableCell key={cellIndex}>{item[header]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <div className="data-display">
      <Typography variant="h6" gutterBottom>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Typography>
      <div className="table-container">
        <table>
          {renderTable()}
        </table>
      </div>
    </div>
  );
};

export default DataDisplay;