import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5001/api';

function Home() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [search, companies]);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_URL}/companies`);
      // Filter out Unknown company
      const validCompanies = res.data.filter(c => c.name !== 'Unknown');
      setCompanies(validCompanies);
      setFilteredCompanies(validCompanies);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (companyName) => {
    navigate(`/company/${encodeURIComponent(companyName)}`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">Find Your Dream Job</h1>
        <p className="home-subtitle">Browse companies and job categories</p>
        
        {user?.skills && user.skills.length > 0 && (
          <div className="skills-preview" style={{ marginTop: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Your Skills:</span>
            {user.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        )}
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="companies-grid">


        {/* Regular Company Cards */}
        {filteredCompanies.map((company, index) => (
          <div
            key={index}
            className="company-card"
            onClick={() => handleCompanyClick(company.name)}
          >
            <img
              src={company.logo}
              alt={company.name}
              className="company-logo"
              onError={(e) => {
                // Show generic company icon if logo not found (user will add logos)
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23e0e0e0" width="80" height="80"/><text x="50%" y="50%" font-size="40" text-anchor="middle" dy=".3em">🏢</text></svg>';
              }}
            />
            <h3 className="company-name">{company.name}</h3>
            <div className="company-meta">
              <span className="company-jobs-badge">{company.jobCount} jobs</span>
            </div>
            {company.locations && company.locations.length > 0 && (
              <div className="company-locations">
                📍 {company.locations.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
          No companies found matching your search.
        </p>
      )}
    </div>
  );
}

export default Home;
