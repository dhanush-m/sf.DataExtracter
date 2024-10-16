import React, { useState, useEffect } from 'react';

const DataExtraction = ({ accessToken, subdomain }) => {
  const [extractionType, setExtractionType] = useState('');
  const [extractedData, setExtractedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const extractData = async () => {
    if (!extractionType) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/extract/${extractionType}?accessToken=${accessToken}&subdomain=${subdomain}&page=${page}&pageSize=50`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      setExtractedData(prevData => [...prevData, ...result.data]);
      setHasMore(result.hasMore);
      setPage(result.currentPage);
    } catch (error) {
      console.error('Error extracting data:', error);
      setError('Failed to extract data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (extractionType) {
      setExtractedData([]);
      setPage(1);
      setHasMore(true);
      extractData();
    }
  }, [extractionType]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
      extractData();
    }
  };

  return (
    <div>
      <h2>Data Extraction</h2>
      <select value={extractionType} onChange={(e) => setExtractionType(e.target.value)}>
        <option value="">Select extraction type</option>
        <option value="automations">Automations</option>
        <option value="dataExtensions">Data Extensions</option>
        <option value="lists">Lists</option>
        <option value="triggeredSends">Triggered Sends</option>
        <option value="journeys">Journeys</option>
        <option value="content">Content</option>
        <option value="emails">Emails</option>
        <option value="users">Users</option>
        <option value="sendClassifications">Send Classifications</option>
        <option value="subscribers">Subscribers</option>
      </select>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {extractedData.length > 0 && (
        <div>
          <h3>Extracted Data:</h3>
          <pre>{JSON.stringify(extractedData, null, 2)}</pre>
          {hasMore && (
            <button onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DataExtraction;
