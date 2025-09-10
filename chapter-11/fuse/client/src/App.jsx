import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

function App() {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('hybrid');
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userFeedback, setUserFeedback] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  const userId = 'demo_user';

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit: 5 }),
      });
      const data = await response.json();
      setRecommendations(data.results || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode: searchMode, userId }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (documentId, action) => {
    try {
      // Optimistic update
      setUserFeedback((prev) => ({
        ...prev,
        [`${documentId}_${action}`]: true,
      }));

      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, documentId, action }),
      });

      // Reload recommendations after feedback
      loadRecommendations();
    } catch (err) {
      console.error('Feedback error:', err);
      // Revert optimistic update on error
      setUserFeedback((prev) => {
        const updated = { ...prev };
        delete updated[`${documentId}_${action}`];
        return updated;
      });
    }
  };

  const ResultItem = ({ item, showActions = true }) => (
    <div className="result-item" key={item.id}>
      <div className="result-header">
        <h3 className="result-title">{item.title}</h3>
        {item.score !== undefined && (
          <span className="result-score">
            {typeof item.score === 'number'
              ? item.score.toFixed(3)
              : item.score}
          </span>
        )}
      </div>
      <p className="result-description">{item.description}</p>
      {item.tags && item.tags.length > 0 && (
        <div className="result-tags">
          {item.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      {showActions && (
        <div className="result-actions">
          <button
            className={`action-button ${
              userFeedback[`${item.id}_like`] ? 'liked' : ''
            }`}
            onClick={() => handleFeedback(item.id, 'like')}
          >
            👍 Like
          </button>
          <button
            className={`action-button ${
              userFeedback[`${item.id}_save`] ? 'saved' : ''
            }`}
            onClick={() => handleFeedback(item.id, 'save')}
          >
            📎 Save
          </button>
          <button
            className={`action-button ${
              userFeedback[`${item.id}_not_relevant`] ? 'not-relevant' : ''
            }`}
            onClick={() => handleFeedback(item.id, 'not_relevant')}
          >
            👎 Not Relevant
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="App">
      <header>
        <h1>🔍 FUSE</h1>
        <p>Find, Understand, Search, Enhance</p>
      </header>

      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="search-input"
          />

          <div className="search-modes">
            <button
              type="button"
              className={`mode-button ${
                searchMode === 'keyword' ? 'active' : ''
              }`}
              onClick={() => setSearchMode('keyword')}
            >
              Keyword
            </button>
            <button
              type="button"
              className={`mode-button ${
                searchMode === 'vector' ? 'active' : ''
              }`}
              onClick={() => setSearchMode('vector')}
            >
              Semantic
            </button>
            <button
              type="button"
              className={`mode-button ${
                searchMode === 'hybrid' ? 'active' : ''
              }`}
              onClick={() => setSearchMode('hybrid')}
            >
              Hybrid
            </button>
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={loading || !query.trim()}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="main-content">
        <div className="search-results-section">
          <div className="section-header">
            <h2 className="section-title">🔍 Search Results</h2>
            <p className="section-description">
              Results from your {searchMode} search{query && ` for "${query}"`}
            </p>
          </div>

          {results.length > 0 && (
            <div className="results-container">
              <div className="results-meta">
                {results.length} result{results.length !== 1 ? 's' : ''} •{' '}
                {searchMode.charAt(0).toUpperCase() + searchMode.slice(1)} mode
              </div>
              {results.map((item) => (
                <ResultItem key={item.id} item={item} showActions={true} />
              ))}
            </div>
          )}

          {!loading && hasSearched && query && results.length === 0 && (
            <div className="no-results">
              No results found for "{query}". Try a different search term or
              mode.
            </div>
          )}

          {!hasSearched && (
            <div className="no-search">
              <p>👆 Enter a search term above to see results</p>
              <p className="search-tips">
                <strong>Try searching for:</strong>
                <br />
                • "javascript" (keyword matching)
                <br />
                • "coding" (semantic similarity)
                <br />• "ML" vs "machine learning" (compare modes)
              </p>
            </div>
          )}
        </div>

        <div className="recommendations-section">
          <div className="section-header">
            <h2 className="section-title">⭐ Personalized For You</h2>
            <p className="section-description">
              Recommendations based on your interactions
            </p>
          </div>

          {recommendations.length > 0 ? (
            <div className="recommendations-container">
              <div className="results-meta">
                {recommendations.length} recommendation
                {recommendations.length !== 1 ? 's' : ''} • Updated in real-time
              </div>
              {recommendations.map((item) => (
                <ResultItem
                  key={`rec-${item.id}`}
                  item={item}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="no-recommendations">
              <p>👍 No personalized recommendations yet</p>
              <p className="interaction-tips">
                <strong>Build your profile by:</strong>
                <br />
                • Liking relevant documents
                <br />
                • Saving interesting content
                <br />
                • Marking irrelevant results
                <br />• Watch this section update in real-time!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
