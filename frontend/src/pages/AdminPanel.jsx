import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Building2, Users, Stethoscope, Calendar, Activity, Trash2 } from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#0284c7', '#0d9488', '#6366f1', '#f59e0b', '#ec4899'];

export default function AdminPanel() {
  const [tab, setTab] = useState('analytics');
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [logs, setLogs] = useState([]);

  // New department form
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');

  const loadAll = async () => {
    try {
      const [ovRes, docRes, patRes, apptRes, deptRes, logRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/doctors/admin/all'),
        api.get('/admin/patients'),
        api.get('/admin/appointments'),
        api.get('/admin/departments'),
        api.get('/admin/logs'),
      ]);
      setOverview(ovRes.data.data);
      setDoctors(docRes.data.data);
      setPatients(patRes.data.data);
      setAppointments(apptRes.data.data);
      setDepartments(deptRes.data.data);
      setLogs(logRes.data.data);
    } catch {
      toast.error('Failed to load admin control panel');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleApproval = async (id) => {
    try {
      const res = await api.patch(`/doctors/admin/${id}/approve`);
      toast.success(res.data.message);
      loadAll();
    } catch {
      toast.error('Failed to update doctor status');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User removed');
      loadAll();
    } catch {
      toast.error('Failed to remove user');
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', {
        name: deptName,
        description: deptDesc,
        headDoctor: deptHead,
      });
      toast.success('Department added!');
      setDeptName('');
      setDeptDesc('');
      setDeptHead('');
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add department');
    }
  };

  const handleDeleteDept = async (id) => {
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success('Department deleted');
      loadAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="container">
      <div className="mb-5">
        <h2 className="text-2xl font-extrabold">Hospital Admin Control Center</h2>
        <p className="text-sm text-slate-500">
          Department-wise Recharts analytics, doctor verification, patient registry &amp; audit logs
        </p>
      </div>

      {/* Top KPI Cards */}
      {overview && (
        <div className="grid-4">
          <div className="card">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Patients</p>
            <h2 className="text-2xl font-extrabold mt-1">{overview.totalPatients}</h2>
          </div>
          <div className="card">
            <p className="text-xs font-bold text-slate-500 uppercase">Approved Doctors</p>
            <h2 className="text-2xl font-extrabold mt-1 text-teal-600">{overview.totalDoctors}</h2>
          </div>
          <div className="card">
            <p className="text-xs font-bold text-slate-500 uppercase">Pending Verification</p>
            <h2 className="text-2xl font-extrabold mt-1 text-amber-600">{overview.pendingDoctors}</h2>
          </div>
          <div className="card">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Appointments</p>
            <h2 className="text-2xl font-extrabold mt-1 text-sky-600">{overview.totalAppointments}</h2>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setTab('analytics')}
          className={`btn ${tab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
        >
          Analytics Charts
        </button>
        <button
          onClick={() => setTab('doctors')}
          className={`btn ${tab === 'doctors' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Stethoscope size={16} /> Doctors ({doctors.length})
        </button>
        <button
          onClick={() => setTab('patients')}
          className={`btn ${tab === 'patients' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Users size={16} /> Patients ({patients.length})
        </button>
        <button
          onClick={() => setTab('departments')}
          className={`btn ${tab === 'departments' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Building2 size={16} /> Departments ({departments.length})
        </button>
        <button
          onClick={() => setTab('appointments')}
          className={`btn ${tab === 'appointments' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Calendar size={16} /> All Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`btn ${tab === 'logs' ? 'btn-primary' : 'btn-outline'}`}
        >
          <Activity size={16} /> Activity Logs ({logs.length})
        </button>
      </div>

      {/* 1. ANALYTICS TAB (Recharts) */}
      {tab === 'analytics' && overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-base mb-4">Department-wise Appointments</h3>
            {overview.departmentAnalytics.length === 0 ? (
              <p className="text-sm text-slate-500">Book appointments to view department charts.</p>
            ) : (
              <div style={{ width: '100%', height: 290 }}>
                <ResponsiveContainer>
                  <BarChart data={overview.departmentAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-bold text-base mb-4">Department Revenue Share (₹)</h3>
            {overview.departmentAnalytics.length === 0 ? (
              <p className="text-sm text-slate-500">No revenue data yet.</p>
            ) : (
              <div style={{ width: '100%', height: 290 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={overview.departmentAnalytics}
                      dataKey="revenue"
                      nameKey="department"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={(entry) => `${entry.department}: ₹${entry.revenue}`}
                    >
                      {overview.departmentAnalytics.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. DOCTORS TAB */}
      {tab === 'doctors' && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    <strong>{doc.user?.name}</strong>
                    <br />
                    <span className="text-xs text-slate-500">{doc.user?.email}</span>
                  </td>
                  <td>{doc.specialization}</td>
                  <td>₹{doc.consultationFee}</td>
                  <td>
                    <span className={`badge ${doc.isApproved ? 'badge-completed' : 'badge-pending'}`}>
                      {doc.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="flex gap-2">
                    <button
                      onClick={() => toggleApproval(doc._id)}
                      className={`btn ${doc.isApproved ? 'btn-danger' : 'btn-success'}`}
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
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

      {/* 3. PATIENTS TAB */}
      {tab === 'patients' && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((pat) => (
                <tr key={pat._id}>
                  <td><strong>{pat.name}</strong></td>
                  <td>{pat.email}</td>
                  <td>{pat.phone || '—'}</td>
                  <td>{new Date(pat.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteUser(pat._id)}
                      className="btn btn-danger"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. DEPARTMENTS TAB */}
      {tab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-bold mb-3">Add Hospital Department</h3>
            <form onSubmit={handleCreateDept}>
              <div className="form-group">
                <label>Department Name</label>
                <input
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Cardiology"
                />
              </div>
              <div className="form-group">
                <label>Head of Department</label>
                <input
                  value={deptHead}
                  onChange={(e) => setDeptHead(e.target.value)}
                  placeholder="e.g. Dr. Ananya Verma"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Heart & vascular diagnostics..."
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Create Department
              </button>
            </form>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {departments.length === 0 ? (
              <div className="card">No custom departments added yet. Add one on the left!</div>
            ) : (
              departments.map((d) => (
                <div key={d._id} className="card flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sky-700 text-base">{d.name}</h4>
                    {d.headDoctor && (
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        HOD: {d.headDoctor}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">{d.description || 'Active clinical unit'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteDept(d._id)}
                    className="btn btn-outline text-rose-600 mt-3 self-start"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. ALL APPOINTMENTS TAB */}
      {tab === 'appointments' && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date &amp; Slot</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a._id}>
                  <td>
                    <strong>{a.appointmentDate}</strong> ({a.timeSlot})
                  </td>
                  <td>{a.patient?.name}</td>
                  <td>{a.doctor?.user?.name}</td>
                  <td>
                    <span className={`badge badge-${a.status}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. ACTIVITY LOGS TAB */}
      {tab === 'logs' && (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="text-xs text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="font-semibold">{log.actorName}</td>
                  <td className="uppercase text-xs font-bold text-sky-700">{log.role}</td>
                  <td>
                    <span className="badge badge-confirmed">{log.action}</span>
                  </td>
                  <td className="text-xs text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}