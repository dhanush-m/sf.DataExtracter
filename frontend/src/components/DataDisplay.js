import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const DataDisplay = ({ data, type }) => {
  console.log('DataDisplay received data:', data);
  console.log('DataDisplay received type:', type);

  const processData = (inputData) => {
    if (!inputData) return null;
    if (typeof inputData === 'string') {
      try {
        return JSON.parse(inputData);
      } catch (error) {
        console.error('Failed to parse data string:', error);
        return null;
      }
    }
    if (Array.isArray(inputData)) return inputData;
    if (typeof inputData === 'object') {
      // Check if the data is nested inside an object
      const possibleArrays = Object.values(inputData).filter(Array.isArray);
      if (possibleArrays.length > 0) return possibleArrays[0];
    }
    return null;
  };

  const processedData = processData(data);

  if (!processedData || processedData.length === 0) {
    console.warn('No valid data available for', type);
    return <Typography>No data available for {type}</Typography>;
  }

  const headers = ['S.No', ...Object.keys(processedData[0])];

  return (
    <TableContainer component={Paper}>
      <Typography variant="h6" gutterBottom>
        {type} Data
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {processedData.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              {headers.slice(1).map((header) => (
                <TableCell key={`${index}-${header}`}>
                  {item[header] !== undefined && item[header] !== null
                    ? typeof item[header] === 'object'
                      ? JSON.stringify(item[header])
                      : String(item[header])
                    : 'N/A'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataDisplay;
