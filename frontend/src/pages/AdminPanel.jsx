import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function AdminPanel() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/doctors/admin/all');
      setDoctors(res.data.data);
    } catch {
      toast.error('Failed to load doctors list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDoctors();
  }, []);

  const toggleApproval = async (id) => {
    try {
      const res = await api.patch(`/doctors/admin/${id}/approve`);
      toast.success(res.data.message);
      fetchAllDoctors();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '1rem' }}>Admin Panel — Doctor Verification</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <strong>{doc.user?.name}</strong>
                    <br />
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{doc.user?.email}</span>
                  </td>
                  <td>{doc.specialization}</td>
                  <td>{doc.experience} yrs</td>
                  <td>₹{doc.consultationFee}</td>
                  <td>
                    <span
                      className={`badge ${
                        doc.isApproved ? 'badge-completed' : 'badge-pending'
                      }`}
                    >
                      {doc.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleApproval(doc._id)}
                      className={`btn ${doc.isApproved ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      {doc.isApproved ? 'Revoke' : 'Approve'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}