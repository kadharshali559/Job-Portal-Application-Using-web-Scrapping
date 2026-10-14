import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5001/api';

function Company() {
  const { name } = useParams();
  const [company, setCompany] = useState(null);
  const [news, setNews] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchCompanyData();
  }, [name]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      
      // Fetch company details
      const companyRes = await axios.get(`${API_URL}/companies/${encodeURIComponent(name)}`);
      setCompany(companyRes.data);
      
      // Fetch news
      const newsRes = await axios.get(`${API_URL}/news/${encodeURIComponent(name)}`);
      setNews(newsRes.data);
      
      // Filter jobs by user skills
      if (user?.skills?.length > 0) {
        const jobs = companyRes.data.jobs;
        const userSkills = user.skills.map(s => s.toLowerCase());
        
        const scored = jobs.map(job => {
          let score = 0;
          const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
          userSkills.forEach(skill => {
            if (jobText.includes(skill.toLowerCase())) {
              score++;
            }
          });
          return { ...job, matchScore: score };
        });
        
        // ONLY SHOW JOBS THAT MATCH AT LEAST ONE SKILL
        const matchedOnly = scored.filter(job => job.matchScore > 0);
        
        // Sort by match score
        matchedOnly.sort((a, b) => b.matchScore - a.matchScore);
        setMatchedJobs(matchedOnly);
      } else {
        // If no skills, show all jobs
        setMatchedJobs(companyRes.data.jobs);
      }
      
    } catch (err) {
      setError('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (url, jobTitle, companyName) => {
    console.log('Apply button clicked!');
    console.log('URL received:', url);
    
    let targetUrl = url;
    
    // FAILSAFE: If no URL, use Google Search
    if (!targetUrl || targetUrl === 'null' || targetUrl === 'undefined') {
      console.warn('Missing URL, falling back to Google Search');
      const query = `${jobTitle} ${companyName} apply`;
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      // Optional: alert user
      // alert('Direct link missing. Redirecting to Google Search for this job.');
    } else {
      // Ensure URL has protocol
      if (!targetUrl.startsWith('http')) {
          targetUrl = 'https://' + targetUrl;
      }
    }
    
    console.log('Opening URL:', targetUrl);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="company-detail">
        <div className="alert alert-error">{error || 'Company not found'}</div>
        <Link to="/">← Back to companies</Link>
      </div>
    );
  }

  // Group jobs by source
  const naukriJobs = matchedJobs.filter(job => job.source === 'Naukri');
  const iimJobs = matchedJobs.filter(job => job.source === 'IIMJobs');

  return (
    <div className="company-detail">
      <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
        ← Back to companies
      </Link>

      <div className="company-header">
        <img
          src={company.logo}
          alt={company.name}
          className="company-header-logo"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&size=128&background=6366f1&color=fff&bold=true`;
          }}
        />
        <div className="company-header-info">
          <h1>{company.name}</h1>
          <div className="company-header-meta">
            <span>💼 {company.jobCount} open positions</span>
          </div>
        </div>
      </div>

      {/* Jobs Section - Grouped by Source */}
      <section>
        <h2 className="section-title">
          💼 {user?.skills?.length > 0 ? 'Jobs Matching Your Profile' : 'Open Positions'}
        </h2>
        
        {/* Naukri Jobs Section */}
        {naukriJobs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="source-badge source-naukri">Naukri</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                ({naukriJobs.length} jobs)
              </span>
            </h3>
            
            <div className="jobs-list">
              {naukriJobs.map((job, index) => (
                <div key={index} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-company">{company.name}</p>
                    </div>
                    <button 
                      className="btn btn-apply"
                      onClick={() => handleApply(job.applyUrl, job.title, company.name)}
                    >
                      Apply Now →
                    </button>
                  </div>
                  
                  <div className="job-meta">
                    {job.experience && (
                      <span className="job-meta-item">👤 {job.experience}</span>
                    )}
                    {job.location && (
                      <span className="job-meta-item">📍 {job.location}</span>
                    )}
                    {job.salary && job.salary !== 'Not-Mentioned' && (
                      <span className="job-meta-item">💰 {job.salary}</span>
                    )}
                    {job.datePosted && (
                      <span className="job-meta-item">📅 {job.datePosted}</span>
                    )}
                    {job.matchScore > 0 && (
                      <span className="job-meta-item" style={{ color: 'var(--success)' }}>
                        ✓ {job.matchScore} skill match{job.matchScore > 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                  
                  {job.description && (
                    <p className="job-description">{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IIMJobs Section */}
        {iimJobs.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span className="source-badge source-iimjobs">IIMJobs</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                ({iimJobs.length} jobs)
              </span>
            </h3>
            
            <div className="jobs-list">
              {iimJobs.map((job, index) => (
                <div key={index} className="job-card">
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-company">{company.name}</p>
                    </div>
                    <button 
                      className="btn btn-apply"
                      onClick={() => handleApply(job.applyUrl, job.title, company.name)}
                    >
                      Apply Now →
                    </button>
                  </div>
                  
                  <div className="job-meta">
                    {job.experience && (
                      <span className="job-meta-item">👤 {job.experience}</span>
                    )}
                    {job.location && (
                      <span className="job-meta-item">📍 {job.location}</span>
                    )}
                    {job.salary && job.salary !== 'Not-Mentioned' && job.salary !== 'Not Mentioned' && (
                      <span className="job-meta-item">💰 {job.salary}</span>
                    )}
                    {job.datePosted && (
                      <span className="job-meta-item">📅 {job.datePosted}</span>
                    )}
                    {job.matchScore > 0 && (
                      <span className="job-meta-item" style={{ color: 'var(--success)' }}>
                        ✓ {job.matchScore} skill match{job.matchScore > 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                  
                  {job.description && (
                    <p className="job-description">{job.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {matchedJobs.length === 0 && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            No jobs available at this time.
          </p>
        )}
      </section>

      {/* News Section */}
      <section className="news-section">
        <h2 className="section-title">📰 Latest News</h2>
        
        <div className="news-list">
          {news.map((item, index) => (
            <div key={index} className="news-item">
              <h4 className="news-title">{item.title}</h4>
              <p className="news-summary">{item.summary}</p>
              <div className="news-meta">
                <span>{item.date}</span>
                <span>• {item.source}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Company;
