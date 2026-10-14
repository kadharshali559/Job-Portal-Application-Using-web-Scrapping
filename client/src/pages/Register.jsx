import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [resume, setResume] = useState(null);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResume(file);
      // Show file selected feedback
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate phone number
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Phone number must be 10 digits');
      setLoading(false);
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('confirmPassword', formData.confirmPassword);
      if (resume) {
        data.append('resume', resume);
      }

      const result = await register(data);
      
      if (result.user?.skills) {
        setSkills(result.user.skills);
      }
      
      setSuccess(true);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join to discover matching jobs for your profile</p>

        {error && <div className="alert alert-error">{error}</div>}
        
        {success && (
          <div className="alert alert-success">
            ✅ Registration successful! Redirecting to login page...
            {skills.length > 0 && (
              <div className="skills-preview" style={{ marginTop: '0.5rem' }}>
                <strong>Skills extracted:</strong> {skills.join(', ')}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder=""
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              maxLength="10"
              disabled={loading || success}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter 10-digit mobile number</small>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading || success}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-input"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Resume (PDF/DOCX)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={loading || success}
              />
              <div className="file-input-icon">📄</div>
              <div className="file-input-text">
                {resume ? (
                  <span style={{ color: 'var(--success)' }}>✓ {resume.name}</span>
                ) : (
                  <>Drag and drop or <span>browse</span></>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || success}>
            {loading ? 'Creating Account...' : success ? 'Success! Redirecting...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
