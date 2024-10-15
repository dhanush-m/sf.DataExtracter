import React, { useState, useEffect } from 'react';
import DataDisplay from './DataDisplay';

const DataExtraction = ({ accessToken, subdomain }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/extract/content-assets?accessToken=${accessToken}&subdomain=${subdomain}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Try to parse complete JSON objects from the buffer
          let bracketCount = 0;
          let startIndex = buffer.indexOf('{');
          for (let i = startIndex; i < buffer.length; i++) {
            if (buffer[i] === '{') bracketCount++;
            if (buffer[i] === '}') bracketCount--;
            
            if (bracketCount === 0 && startIndex !== -1) {
              try {
                const json = JSON.parse(buffer.slice(startIndex, i + 1));
                displayData(json);
                buffer = buffer.slice(i + 1);
                startIndex = buffer.indexOf('{');
                i = startIndex - 1;
              } catch (e) {
                // Incomplete JSON, continue buffering
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [accessToken, subdomain]);

  function displayData(json) {
    if (json && json.data && Array.isArray(json.data)) {
      setAssets(prevAssets => [...prevAssets, ...json.data]);
      if (json.page) setCurrentPage(json.page);
      if (json.totalCount) setTotalCount(json.totalCount);
    }
  }

  return (
    <div>
      <h2>Content Assets</h2>
      {loading && <p>Loading...</p>}
      {!loading && assets.length > 0 && (
        <DataDisplay data={assets} />
      )}
      {currentPage > 0 && totalCount > 0 && (
        <p>Loaded {assets.length} of {totalCount} assets</p>
      )}
    </div>
  );
};

export default DataExtraction;
