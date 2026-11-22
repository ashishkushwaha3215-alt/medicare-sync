import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(
  '/api/v1',
  ''
);

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/my');
      setReports(res.data.data);
    } catch {
      toast.error('Failed to load medical reports');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a JPG, PNG, or PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('notes', notes);
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Report uploaded!');
      setTitle('');
      setNotes('');
      setFile(null);
      e.target.reset();
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted');
      fetchReports();
    } catch {
      toast.error('Failed to delete report');
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '1rem' }}>My Medical Lab Reports</h2>

      {/* Upload Form */}
      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '540px' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Upload New Report (PDF, JPG, PNG · Max 2MB)</h3>
        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Report Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Blood Count (CBC)"
            />
          </div>
          <div className="form-group">
            <label>Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Fasting blood test"
            />
          </div>
          <div className="form-group">
            <label>Select File</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              required
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>
          <button type="submit" disabled={uploading} className="btn btn-primary">
            {uploading ? 'Uploading...' : 'Upload Report'}
          </button>
        </form>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <div className="card">No medical reports uploaded yet.</div>
      ) : (
        <div className="grid-3">
          {reports.map((rep) => (
            <div key={rep._id} className="card">
              <h4>{rep.title}</h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.3rem' }}>
                {rep.notes || 'No notes'}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Uploaded: {new Date(rep.createdAt).toLocaleDateString()}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem' }}>
                <a
                  href={`${BACKEND_ORIGIN}${rep.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.82rem' }}
                >
                  View File
                </a>
                <button
                  onClick={() => handleDelete(rep._id)}
                  className="btn btn-danger"
                  style={{ padding: '0.35rem 0.7rem', fontSize: '0.82rem' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}