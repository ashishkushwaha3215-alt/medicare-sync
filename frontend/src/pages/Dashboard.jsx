import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Doctor prescription modal state
  const [rxApptId, setRxApptId] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, apptRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/appointments/my', { params: { status: statusFilter || undefined } }),
      ]);
      setStats(statsRes.data.data);
      setAppointments(apptRes.data.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      const medsArray = medicines
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      await api.put(`/appointments/${rxApptId}/prescription`, {
        diagnosis,
        medicines: medsArray,
        notes,
      });
      toast.success('Prescription saved & appointment completed!');
      setRxApptId(null);
      setDiagnosis('');
      setMedicines('');
      setNotes('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    }
  };

  const getCount = (st) => stats?.byStatus?.find((s) => s._id === st)?.count || 0;

  return (
    <div className="container">
      <h2 style={{ marginBottom: '1rem' }}>
        Welcome, {user?.name} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({user?.role})</span>
      </h2>

      {/* Analytics Cards */}
      {stats && (
        <div className="grid-4">
          {user?.role === 'admin' ? (
            <>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Patients</p>
                <h2>{stats.totalPatients}</h2>
              </div>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Approved Doctors</p>
                <h2>{stats.totalDoctors}</h2>
              </div>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Pending Approvals</p>
                <h2 style={{ color: '#d97706' }}>{stats.pendingDoctors}</h2>
              </div>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Appointments</p>
                <h2>{stats.totalAppointments}</h2>
              </div>
            </>
          ) : (
            <>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Pending</p>
                <h2>{getCount('pending')}</h2>
              </div>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Confirmed</p>
                <h2 style={{ color: '#0284c7' }}>{getCount('confirmed')}</h2>
              </div>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Completed</p>
                <h2 style={{ color: '#10b981' }}>{getCount('completed')}</h2>
              </div>
              <div className="card">
                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Cancelled</p>
                <h2 style={{ color: '#ef4444' }}>{getCount('cancelled')}</h2>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Appointments</h3>
        <select
          style={{ maxWidth: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <p>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <div className="card">No appointments found.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Slot</th>
                <th>{user?.role === 'doctor' ? 'Patient' : 'Doctor'}</th>
                <th>Symptoms</th>
                <th>Status</th>
                <th>Prescription / Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt._id}>
                  <td>
                    <strong>{appt.appointmentDate}</strong>
                    <br />
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{appt.timeSlot}</span>
                  </td>
                  <td>
                    {user?.role === 'doctor' ? (
                      <>
                        {appt.patient?.name}
                        <br />
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{appt.patient?.phone}</span>
                      </>
                    ) : (
                      <>
                        {appt.doctor?.user?.name}
                        <br />
                        <span style={{ fontSize: '0.8rem', color: '#0284c7' }}>
                          {appt.doctor?.specialization}
                        </span>
                      </>
                    )}
                  </td>
                  <td>{appt.symptoms || '—'}</td>
                  <td>
                    <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                  </td>
                  <td>
                    {/* Prescription agar likhi ja chuki hai */}
                    {appt.prescription?.diagnosis && (
                      <div style={{ fontSize: '0.84rem', marginBottom: '0.4rem' }}>
                        <strong>Dx:</strong> {appt.prescription.diagnosis}
                        <br />
                        <strong>Meds:</strong> {appt.prescription.medicines?.join(', ')}
                      </div>
                    )}

                    {/* Patient Actions */}
                    {user?.role === 'patient' &&
                      (appt.status === 'pending' || appt.status === 'confirmed') && (
                        <button
                          onClick={() => handleStatusChange(appt._id, 'cancelled')}
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                        >
                          Cancel
                        </button>
                      )}

                    {/* Doctor Actions */}
                    {user?.role === 'doctor' && appt.status !== 'cancelled' && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(appt._id, 'confirmed')}
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status !== 'completed' && (
                          <button
                            onClick={() => setRxApptId(appt._id)}
                            className="btn btn-success"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Add Rx
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Doctor Prescription Form Box */}
      {rxApptId && (
        <div className="card" style={{ marginTop: '1.5rem', border: '2px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Write Digital Prescription</h3>
            <button onClick={() => setRxApptId(null)} className="btn btn-outline">
              Close
            </button>
          </div>
          <form onSubmit={handlePrescriptionSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label>Diagnosis</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Viral Fever / Mild Gastritis"
              />
            </div>
            <div className="form-group">
              <label>Medicines (comma separated)</label>
              <input
                type="text"
                required
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder="e.g. Paracetamol 500mg, Pantoprazole 40mg"
              />
            </div>
            <div className="form-group">
              <label>Doctor Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rest for 3 days, drink plenty of fluids..."
              />
            </div>
            <button type="submit" className="btn btn-success">
              Save Prescription &amp; Mark Completed
            </button>
          </form>
        </div>
      )}
    </div>
  );
}