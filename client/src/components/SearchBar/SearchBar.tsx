import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      onSearch(trimmed);
    }
  };

  return (
    <div className="search-hero">
      <h1 className="search-title">Find music by mood</h1>
      <p className="search-subtitle">Describe what music you want to hear  AI will find the best match</p>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="field has-addons" style={{ justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div className="control has-icons-left is-expanded">
            <input
              className="input is-medium is-rounded"
              type="text"
              placeholder="Calm music for studying..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <span className="icon is-left">
              <i className="fas fa-search"></i>
            </span>
          </div>
          <div className="control">
            <button
              className={`button is-danger is-medium is-rounded ${isLoading ? 'is-loading' : ''}`}
              type="submit"
              disabled={isLoading || query.trim().length < 2}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            >
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
