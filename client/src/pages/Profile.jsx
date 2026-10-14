import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    skills: []
  });
  const [newSkill, setNewSkill] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [resume, setResume] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Profile data:', response.data);
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        skills: response.data.skills || []
      });
      setLoading(false);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Photo selected:', file.name);
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
        console.log('Photo preview created');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('skills', JSON.stringify(formData.skills));
      
      if (profilePhoto) {
        console.log('Uploading photo:', profilePhoto.name);
        data.append('profilePhoto', profilePhoto);
      }
      if (resume) {
        console.log('Uploading resume:', resume.name);
        data.append('resume', resume);
      }

      console.log('Sending profile update...');
      const response = await axios.put('http://localhost:5001/api/auth/profile', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Update response:', response.data);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Get photo URL
  let photoUrl = null;
  if (profilePhotoPreview) {
    photoUrl = profilePhotoPreview;
    console.log('Using preview photo');
  } else if (profile?.profilePhoto) {
    // Extract just the filename from the full path
    const pathParts = profile.profilePhoto.split(/[\\/]/); // Split by both \ and /
    const filename = pathParts[pathParts.length - 1]; // Get last part (filename)
    photoUrl = `http://localhost:5001/uploads/${filename}`;
    console.log('Photo URL:', photoUrl);
  }

  return (
    <div style={{ 
      backgroundColor: '#F3F2F1', 
      minHeight: '100vh', 
      padding: '2rem 0' 
    }}>
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto', 
        padding: '0 2rem' 
      }}>
        
        {/* Main Profile Card */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '2.5rem', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          
          {/* Header with Photo and Info */}
          <div style={{ display: 'flex', gap: '3rem', marginBottom: '2rem' }}>
            
            {/* Left: Photo */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '50%',
                border: '6px solid #10B981',
                overflow: 'hidden',
                backgroundColor: '#F3F4F6',
                position: 'relative'
              }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.error('Image load error for:', photoUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    fontSize: '4.5rem',
                    fontWeight: '700'
                  }}>
                    {profile?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              {editing && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                    id="photo-input"
                  />
                  <label 
                    htmlFor="photo-input" 
                    style={{
                      display: 'inline-block',
                      padding: '0.6rem 1.2rem',
                      backgroundColor: '#6B7280',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    📷 Change Photo
                  </label>
                  {profilePhotoPreview && (
                    <p style={{ fontSize: '0.85rem', color: '#10B981', marginTop: '0.5rem' }}>
                      ✓ Photo selected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div style={{ flex: 1 }}>
              
              {/* Name and Edit Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      fontSize: '2rem',
                      fontWeight: '600',
                      border: '2px solid #E5E7EB',
                      borderRadius: '4px',
                      padding: '0.5rem',
                      width: '70%'
                    }}
                  />
                ) : (
                  <h1 style={{ 
                    margin: 0, 
                    fontSize: '2rem', 
                    fontWeight: '600',
                    color: '#1F2937'
                  }}>
                    {profile?.name}
                  </h1>
                )}
                
                {!editing && (
                  <button 
                    onClick={() => setEditing(true)}
                    style={{
                      padding: '0.65rem 1.5rem',
                      backgroundColor: '#14B8A6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              <p style={{ 
                margin: '0.25rem 0 1.5rem 0', 
                fontSize: '1rem', 
                color: '#6B7280' 
              }}>
                Job Seeker
              </p>

              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                fontSize: '0.95rem'
              }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#6B7280' }}>📧</span>
                  <span style={{ color: '#374151' }}>{profile?.email}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#6B7280' }}>📱</span>
                  {editing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: '4px',
                        padding: '0.4rem',
                        fontSize: '0.9rem',
                        width: '150px'
                      }}
                      pattern="[0-9]{10}"
                      maxLength="10"
                    />
                  ) : (
                    <span style={{ color: '#374151' }}>{profile?.phone || 'Not provided'}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#6B7280' }}>📅</span>
                  <span style={{ color: '#374151' }}>
                    {new Date(profile?.createdAt).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#6B7280' }}>📄</span>
                  <span style={{ color: profile?.resumePath ? '#10B981' : '#9CA3AF' }}>
                    {profile?.resumePath ? '✅ Uploaded' : 'Not uploaded'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              backgroundColor: '#FEE2E2', 
              color: '#991B1B', 
              borderRadius: '6px' 
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              backgroundColor: '#D1FAE5', 
              color: '#065F46', 
              borderRadius: '6px' 
            }}>
              {success}
            </div>
          )}

          {/* Skills Section */}
          <div style={{ 
            borderTop: '2px solid #E5E7EB', 
            paddingTop: '2rem'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              marginBottom: '1.25rem',
              color: '#1F2937'
            }}>
              Key Skills ({editing ? formData.skills.length : profile?.skills?.length || 0})
            </h2>

            {editing && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      border: '2px solid #E5E7EB',
                      borderRadius: '4px',
                      fontSize: '0.95rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    style={{
                      padding: '0.6rem 1.5rem',
                      backgroundColor: '#14B8A6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {(editing ? formData.skills : profile?.skills || []).map((skill, i) => (                <span
                  key={i}
                  onClick={editing ? () => handleRemoveSkill(skill) : undefined}
                  style={{
                    padding: '0.6rem 1.25rem',
                    backgroundColor: '#D1FAE5',
                    color: '#065F46',
                    borderRadius: '20px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    border: '1px solid #A7F3D0',
                    cursor: editing ? 'pointer' : 'default'
                  }}
                >
                  {skill} {editing && '×'}
                </span>
              ))}
              {(!profile?.skills || profile.skills.length === 0) && !editing && (
                <p style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                  No skills added yet
                </p>
              )}
            </div>

            {/* Resume Upload in Edit Mode */}
            {editing && (
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #E5E7EB' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: '600', 
                  marginBottom: '0.5rem',
                  color: '#1F2937'
                }}>
                  Update Resume (PDF/DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResume(e.target.files[0])}
                  style={{ display: 'block' }}
                />
                {resume && (
                  <p style={{ color: '#10B981', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    ✅ {resume.name}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {editing && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#14B8A6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? '💾 Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setError('');
                    setSuccess('');
                    setProfilePhoto(null);
                    setProfilePhotoPreview(null);
                    setResume(null);
                    setFormData({
                      name: profile.name,
                      phone: profile.phone,
                      skills: profile.skills
                    });
                  }}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
