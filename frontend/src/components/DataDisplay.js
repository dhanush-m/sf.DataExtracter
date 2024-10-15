import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

const DataDisplay = ({ data, type }) => {
  if (!data || data.length === 0) {
    return <Typography>No data available for {type}</Typography>;
  }

  const headers = ['S.No', ...Object.keys(data[0])];

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
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              {headers.slice(1).map((header) => (
                <TableCell key={`${index}-${header}`}>
                  {typeof item[header] === 'object'
                    ? JSON.stringify(item[header])
                    : String(item[header])}
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
