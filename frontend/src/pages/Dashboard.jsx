import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, History, Settings, Calendar, UserCheck, FileText } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { generatePrescriptionPdf } from '../utils/generatePrescriptionPdf';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(
  '/api/v1',
  ''
);

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Doctor prescription modal state
  const [rxApptId, setRxApptId] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState('');
  const [notes, setNotes] = useState('');

  // Doctor availability state
  const [docProfile, setDocProfile] = useState(null);
  const [savingDoc, setSavingDoc] = useState(false);

  // Doctor Patient History modal state
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const requests = [
        api.get('/dashboard/stats'),
        api.get('/appointments/my', { params: { status: statusFilter || undefined } }),
      ];
      if (user?.role === 'doctor') {
        requests.push(api.get('/doctors/me/profile'));
      }
      const [statsRes, apptRes, docRes] = await Promise.all(requests);
      setStats(statsRes.data.data);
      setAppointments(apptRes.data.data);
      if (docRes) setDocProfile(docRes.data.data);
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

  const handleDoctorProfileSave = async (e) => {
    e.preventDefault();
    setSavingDoc(true);
    try {
      const res = await api.put('/doctors/me/profile', {
        specialization: docProfile.specialization,
        experience: Number(docProfile.experience),
        consultationFee: Number(docProfile.consultationFee),
        availableDays: docProfile.availableDays,
        timeSlots: docProfile.timeSlots,
      });
      setDocProfile(res.data.data);
      toast.success('Availability & consultation fee updated!');
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setSavingDoc(false);
    }
  };

  const toggleDay = (day) => {
    const exists = docProfile.availableDays.includes(day);
    setDocProfile({
      ...docProfile,
      availableDays: exists
        ? docProfile.availableDays.filter((d) => d !== day)
        : [...docProfile.availableDays, day],
    });
  };

  const toggleSlot = (slot) => {
    const exists = docProfile.timeSlots.includes(slot);
    setDocProfile({
      ...docProfile,
      timeSlots: exists
        ? docProfile.timeSlots.filter((s) => s !== slot)
        : [...docProfile.timeSlots, slot],
    });
  };

  const openPatientHistory = async (patientId) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/appointments/patient/${patientId}/history`);
      setHistoryData(res.data.data);
    } catch {
      toast.error('Could not load patient medical history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getCount = (st) => stats?.byStatus?.find((s) => s._id === st)?.count || 0;

  return (
    <div className="container">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-extrabold">
            Welcome, {user?.name}{' '}
            <span className="text-sm font-semibold text-sky-600 uppercase">({user?.role})</span>
          </h2>
          <p className="text-sm text-slate-500">
            Manage your appointments, medical records, and clinical settings
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Link to="/profile" className="btn btn-outline">
            <UserCheck size={16} /> Edit Profile
          </Link>
          {user?.role === 'patient' && (
            <Link to="/reports" className="btn btn-primary">
              <FileText size={16} /> My Lab Reports
            </Link>
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      {stats && (
        <div className="grid-4">
          {user?.role === 'admin' ? (
            <>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Patients</p>
                <h2 className="text-2xl font-extrabold mt-1">{stats.totalPatients}</h2>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Approved Doctors</p>
                <h2 className="text-2xl font-extrabold mt-1 text-teal-600">{stats.totalDoctors}</h2>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Pending Approvals</p>
                <h2 className="text-2xl font-extrabold mt-1 text-amber-600">{stats.pendingDoctors}</h2>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Total Appointments</p>
                <h2 className="text-2xl font-extrabold mt-1 text-sky-600">{stats.totalAppointments}</h2>
              </div>
            </>
          ) : (
            <>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Pending</p>
                <h2 className="text-2xl font-extrabold mt-1">{getCount('pending')}</h2>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Confirmed</p>
                <h2 className="text-2xl font-extrabold mt-1 text-sky-600">{getCount('confirmed')}</h2>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Completed</p>
                <h2 className="text-2xl font-extrabold mt-1 text-emerald-600">{getCount('completed')}</h2>
              </div>
              <div className="card">
                <p className="text-xs font-semibold text-slate-500 uppercase">Cancelled</p>
                <h2 className="text-2xl font-extrabold mt-1 text-rose-600">{getCount('cancelled')}</h2>
              </div>
            </>
          )}
        </div>
      )}

      {/* Doctor Tabs: Appointments vs Availability Manager */}
      {user?.role === 'doctor' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Calendar size={16} /> Patient Appointments
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`btn ${activeTab === 'availability' ? 'btn-primary' : 'btn-outline'}`}
          >
            <Settings size={16} /> Manage Availability &amp; Fee
          </button>
        </div>
      )}

      {/* TAB 1: Appointments List */}
      {activeTab === 'appointments' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Appointments History</h3>
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
                    <th>Prescription &amp; Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt._id}>
                      <td>
                        <strong>{appt.appointmentDate}</strong>
                        <br />
                        <span className="text-xs text-slate-500">{appt.timeSlot}</span>
                      </td>
                      <td>
                        {user?.role === 'doctor' ? (
                          <div>
                            <strong>{appt.patient?.name}</strong>
                            <br />
                            <span className="text-xs text-slate-500">
                              {appt.patient?.phone || 'No phone'}
                            </span>
                            {appt.patient?._id && (
                              <div className="mt-1">
                                <button
                                  onClick={() => openPatientHistory(appt.patient._id)}
                                  className="text-xs text-sky-600 font-semibold underline inline-flex items-center gap-1"
                                >
                                  <History size={13} /> View Patient History
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <strong>{appt.doctor?.user?.name}</strong>
                            <br />
                            <span className="text-xs text-sky-600 font-semibold">
                              {appt.doctor?.specialization}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>{appt.symptoms || '—'}</td>
                      <td>
                        <span className={`badge badge-${appt.status}`}>{appt.status}</span>
                      </td>
                      <td>
                        {appt.prescription?.diagnosis && (
                          <div className="text-xs bg-emerald-50 border border-emerald-200 p-2 rounded-lg mb-2">
                            <strong>Dx:</strong> {appt.prescription.diagnosis}
                            <br />
                            <strong>Rx:</strong> {appt.prescription.medicines?.join(', ')}
                            <div className="mt-1.5">
                              <button
                                onClick={() => generatePrescriptionPdf(appt)}
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.76rem' }}
                              >
                                <Download size={13} /> Download PDF Rx
                              </button>
                            </div>
                          </div>
                        )}

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

                        {user?.role === 'doctor' && appt.status !== 'cancelled' && (
                          <div className="flex gap-1.5 flex-wrap">
                            {appt.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(appt._id, 'confirmed')}
                                  className="btn btn-primary"
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleStatusChange(appt._id, 'cancelled')}
                                  className="btn btn-danger"
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {appt.status !== 'completed' && (
                              <button
                                onClick={() => setRxApptId(appt._id)}
                                className="btn btn-success"
                                style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                              >
                                Write Rx
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
        </>
      )}

      {/* TAB 2: Doctor Availability & Fee Manager */}
      {activeTab === 'availability' && docProfile && (
        <div className="card max-w-2xl">
          <h3 className="text-lg font-bold mb-3">Manage Clinic Profile &amp; Time Slots</h3>
          <form onSubmit={handleDoctorProfileSave}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="form-group">
                <label>Specialization</label>
                <input
                  value={docProfile.specialization}
                  onChange={(e) => setDocProfile({ ...docProfile, specialization: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  value={docProfile.experience}
                  onChange={(e) => setDocProfile({ ...docProfile, experience: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={docProfile.consultationFee}
                  onChange={(e) =>
                    setDocProfile({ ...docProfile, consultationFee: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Available Working Days</label>
              <div className="flex gap-2 flex-wrap">
                {ALL_DAYS.map((day) => {
                  const active = docProfile.availableDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`btn ${active ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label>Active Appointment Time Slots</label>
              <div className="flex gap-2 flex-wrap">
                {ALL_SLOTS.map((slot) => {
                  const active = docProfile.timeSlots.includes(slot);
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => toggleSlot(slot)}
                      className={`btn ${active ? 'btn-success' : 'btn-outline'}`}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={savingDoc} className="btn btn-primary">
              {savingDoc ? 'Saving...' : 'Update Availability'}
            </button>
          </form>
        </div>
      )}

      {/* Doctor Prescription Form Box */}
      {rxApptId && (
        <div className="card mt-6 border-2 border-emerald-500">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Create Digital Prescription</h3>
            <button onClick={() => setRxApptId(null)} className="btn btn-outline">
              Close
            </button>
          </div>
          <form onSubmit={handlePrescriptionSubmit} className="mt-4">
            <div className="form-group">
              <label>Diagnosis</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Viral Fever / Hypertension"
              />
            </div>
            <div className="form-group">
              <label>Medicines (comma separated)</label>
              <input
                type="text"
                required
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                placeholder="e.g. Paracetamol 500mg (1-0-1), Cetirizine 10mg (0-0-1)"
              />
            </div>
            <div className="form-group">
              <label>Doctor Notes &amp; Dietary Advice</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Drink warm fluids, follow up after 5 days..."
              />
            </div>
            <button type="submit" className="btn btn-success">
              Save Prescription &amp; Mark Completed
            </button>
          </form>
        </div>
      )}

      {/* Patient History Drawer/Card for Doctor */}
      {loadingHistory && <p className="mt-4">Loading patient medical history...</p>}
      {historyData && (
        <div className="card mt-6 border-2 border-sky-500">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-bold">
                Patient Medical History: {historyData.patient?.name}
              </h3>
              <p className="text-xs text-slate-600">
                Age: {historyData.patient?.age || 'N/A'} · Gender:{' '}
                {historyData.patient?.gender || 'N/A'} · Blood Group:{' '}
                {historyData.patient?.bloodGroup || 'N/A'}
              </p>
            </div>
            <button onClick={() => setHistoryData(null)} className="btn btn-outline">
              Close History
            </button>
          </div>

          <h4 className="font-bold text-sm mt-3 mb-2">Uploaded Lab Reports ({historyData.reports.length})</h4>
          {historyData.reports.length === 0 ? (
            <p className="text-xs text-slate-500">No lab reports uploaded by patient.</p>
          ) : (
            <div className="flex gap-2 flex-wrap mb-4">
              {historyData.reports.map((rep) => (
                <a
                  key={rep._id}
                  href={`${BACKEND_ORIGIN}${rep.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline text-xs"
                >
                  <FileText size={14} /> {rep.title}
                </a>
              ))}
            </div>
          )}

          <h4 className="font-bold text-sm mb-2">
            Past Visits ({historyData.appointments.length})
          </h4>
          <div className="space-y-2">
            {historyData.appointments.map((past) => (
              <div key={past._id} className="p-2.5 bg-slate-50 rounded-lg text-xs border">
                <strong>{past.appointmentDate}</strong> with {past.doctor?.user?.name} —{' '}
                <span className="capitalize font-semibold">{past.status}</span>
                {past.prescription?.diagnosis && (
                  <p className="mt-1 text-emerald-700">
                    Diagnosis: {past.prescription.diagnosis} | Meds:{' '}
                    {past.prescription.medicines?.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}