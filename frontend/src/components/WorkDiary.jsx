import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './WorkDiary.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function WorkDiary() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [applications, setApplications] = useState([]);


  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    taskDescription: '',
    application_id: ''
  });

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/work-diary/log-entry`, {
        headers: getAuthHeaders()
      });
      setEntries(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch entries.');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/applications/my-applications`, {
        headers: getAuthHeaders()
      });
      const approved = (res.data || []).filter(app => app.status === 'approved');
      setApplications(approved);
      if (approved.length > 0 && !formData.application_id) {
        setFormData(prev => ({ ...prev, application_id: approved[0].id }));
      }
    } catch (err) {
      console.log('Could not fetch applications:', err);
    }
  }, [getAuthHeaders, formData.application_id]);

  useEffect(() => {
    fetchEntries();
    fetchApplications();
  }, [fetchEntries, fetchApplications]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.date) {
      setError('Date is required.');
      return false;
    }
    if (!formData.hours || formData.hours < 0.5 || formData.hours > 24) {
      setError('Hours must be between 0.5 and 24.');
      return false;
    }
    if (!formData.taskDescription || formData.taskDescription.trim().length < 5) {
      setError('Task description must be at least 5 characters.');
      return false;
    }
    if (!editingEntry && !formData.application_id) {
      setError('Please select an application.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      if (editingEntry) {
        await axios.put(
          `${API_URL}/work-diary/work-diary/${editingEntry.id}`,
          {
            date: formData.date,
            hours: parseFloat(formData.hours),
            taskDescription: formData.taskDescription
          },
          { headers: getAuthHeaders() }
        );
        setSuccessMessage('Entry updated successfully!');
      } else {
        await axios.post(
          `${API_URL}/work-diary/work-diary`,
          {
            date: formData.date,
            hours: parseFloat(formData.hours),
            taskDescription: formData.taskDescription,
            application_id: formData.application_id
          },
          { headers: getAuthHeaders() }
        );
        setSuccessMessage('Entry created successfully!');
      }

      setFormData({
        date: new Date().toISOString().split('T')[0],
        hours: '',
        taskDescription: '',
        application_id: applications[0]?.id || ''
      });
      setShowForm(false);
      setEditingEntry(null);
      fetchEntries();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry.');
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.is_created?.split('T')[0] || '',
      hours: entry.hours || '',
      taskDescription: entry.taskDescription || '',
      application_id: entry.application_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await axios.delete(`${API_URL}/work-diary/log-entry/${entryId}`, {
        headers: getAuthHeaders()
      });
      setSuccessMessage('Entry deleted successfully!');
      fetchEntries();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete entry.');
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      setError('');

      const response = await axios.get(`${API_URL}/work-diary/log-entry/export/pdf`, {
        headers: getAuthHeaders(),
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dnevnik_prakse_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage('PDF exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      hours: '',
      taskDescription: '',
      application_id: applications[0]?.id || ''
    });
    setError('');
  };

  const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);

  if (loading) {
    return (
      <div className="work-diary-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="work-diary-container">
      <div className="work-diary-header">
        <h2>Work Diary</h2>
        <div className="header-actions">
          <button 
            className="export-btn"
            onClick={handleExportPDF}
            disabled={exporting || entries.length === 0}
          >
            {exporting ? '⏳ Exporting...' : '📄 Export PDF'}
          </button>
          <button 
            className="add-btn"
            onClick={() => setShowForm(true)}
            disabled={applications.length === 0}
          >
            + Add Entry
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {applications.length === 0 && (
        <div className="warning-message">
          You need an approved internship application to add work diary entries.
        </div>
      )}

      {/* Entry Form */}
      {showForm && (
        <div className="entry-form-overlay">
          <div className="entry-form">
            <h3>{editingEntry ? 'Edit Entry' : 'New Entry'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Hours Worked * (0.5 - 24)</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  min="0.5"
                  max="24"
                  step="0.5"
                  placeholder="e.g., 8"
                  required
                />
              </div>

              <div className="form-group">
                <label>Task Description * (min 5 characters)</label>
                <textarea
                  name="taskDescription"
                  value={formData.taskDescription}
                  onChange={handleInputChange}
                  placeholder="Describe what you worked on today..."
                  rows="4"
                  required
                />
              </div>

              {!editingEntry && (
                <div className="form-group">
                  <label>Application *</label>
                  <select
                    name="application_id"
                    value={formData.application_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.company?.name || `Application #${app.id.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={cancelForm}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingEntry ? 'Update Entry' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Total Entries:</span>
          <span className="stat-value">{entries.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Hours:</span>
          <span className="stat-value">{totalHours.toFixed(1)}h</span>
        </div>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="no-entries">
          <p>No work diary entries yet.</p>
          <p>Start by adding your first entry!</p>
        </div>
      ) : (
        <div className="entries-list">
          {entries.map(entry => (
            <div key={entry.id} className="entry-card">
              <div className="entry-header">
                <span className="entry-date">
                  📅 {new Date(entry.is_created).toLocaleDateString('hr-HR')}
                </span>
                <span className={`entry-status status-${entry.status}`}>
                  {entry.status}
                </span>
              </div>
              <div className="entry-hours">
                ⏱️ {entry.hours} hours
              </div>
              <div className="entry-description">
                {entry.description}
              </div>
              <div className="entry-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEdit(entry)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(entry.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
