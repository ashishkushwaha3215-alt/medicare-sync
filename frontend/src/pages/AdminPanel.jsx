
import { useEffect, useState, useCallback } from 'react';
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
import {
  Building2,
  Users,
  Stethoscope,
  Calendar,
  Activity,
  Trash2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Pencil,
  Save,
} from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#0284c7', '#0d9488', '#6366f1', '#f59e0b', '#ec4899'];

const getArray = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

const formatAddress = (address) => {
  if (!address) return '—';

  if (typeof address === 'string') return address;

  if (typeof address === 'object') {
    return Object.values(address).filter(Boolean).join(', ') || '—';
  }

  return '—';
};

const getEditForm = (user) => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
  gender: user?.gender || '',
  age: user?.age ?? '',
  bloodGroup: user?.bloodGroup || '',
  address:
    typeof user?.address === 'string'
      ? user.address
      : formatAddress(user?.address) === '—'
        ? ''
        : formatAddress(user?.address),
  role: user?.role || 'patient',
});

export default function AdminPanel() {
  const [tab, setTab] = useState('analytics');
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manage Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({
    total: 0,
    pages: 0,
    limit: 10,
  });

  // Bulk User Management
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // User Details Modal
  const [selectedUser, setSelectedUser] = useState(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(getEditForm(null));
  const [editSaving, setEditSaving] = useState(false);

  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptHead, setDeptHead] = useState('');

  // Load all admin dashboard data
  const loadAll = useCallback(async () => {
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        api.get('/admin/overview'),
        api.get('/doctors/admin/all'),
        api.get('/admin/patients'),
        api.get('/admin/appointments'),
        api.get('/admin/departments'),
        api.get('/admin/logs'),
      ]);

      const [ovRes, docRes, patRes, apptRes, deptRes, logRes] = results;

      if (ovRes.status === 'fulfilled') {
        setOverview(ovRes.value.data?.data || {});
      } else {
        setOverview({});
        console.error('Overview API:', ovRes.reason);
      }

      setDoctors(docRes.status === 'fulfilled' ? getArray(docRes.value) : []);
      setPatients(patRes.status === 'fulfilled' ? getArray(patRes.value) : []);
      setAppointments(apptRes.status === 'fulfilled' ? getArray(apptRes.value) : []);
      setDepartments(deptRes.status === 'fulfilled' ? getArray(deptRes.value) : []);
      setLogs(logRes.status === 'fulfilled' ? getArray(logRes.value) : []);

      const failedRequests = results.filter(
        (result) => result.status === 'rejected'
      );

      if (failedRequests.length > 0) {
        console.error('Admin API errors:', failedRequests);
        toast.error('Some admin data could not be loaded');
      }
    } catch (error) {
      console.error('Admin panel error:', error);
      toast.error('Failed to load admin panel');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users with filters and pagination
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const response = await api.get('/admin/users', {
        params: {
          search: userSearch,
          role: userRole,
          status: userStatus,
          page: userPage,
          limit: 10,
        },
      });

      const usersData = getArray(response).map((user) => ({
        ...user,
        isActive: user.isActive === true,
      }));

      setUsers(usersData);

      setUserPagination(
        response.data?.pagination || {
          total: 0,
          pages: 0,
          limit: 10,
        }
      );

      console.log(
        'UPDATED USERS:',
        usersData.map((user) => ({
          name: user.name,
          isActive: user.isActive,
        }))
      );
    } catch (error) {
      console.error('Users API error:', error);

      toast.error(
        error.response?.data?.message || 'Failed to load users'
      );

      setUsers([]);
      setUserPagination({
        total: 0,
        pages: 0,
        limit: 10,
      });
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRole, userStatus, userPage]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (tab === 'users') {
      loadUsers();
    }
  }, [tab, loadUsers]);

  // Close modals with Escape key
  useEffect(() => {
    if (!selectedUser && !editingUser) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (editingUser && !editSaving) {
          setEditingUser(null);
        } else if (selectedUser) {
          setSelectedUser(null);
        }
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedUser, editingUser, editSaving]);

  const departmentAnalytics = Array.isArray(overview?.departmentAnalytics)
    ? overview.departmentAnalytics
    : [];

  // Doctor approval
  const toggleApproval = async (id) => {
    try {
      const res = await api.patch(`/doctors/admin/${id}/approve`);
      toast.success(res.data.message || 'Doctor status updated');
      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Failed to update doctor status'
      );
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;

    try {
      await api.delete(`/admin/users/${id}`);

      toast.success('User removed');

      setSelectedUser(null);
      setEditingUser(null);

      setSelectedUserIds((current) =>
        current.filter((userId) => userId !== id)
      );

      if (tab === 'users') {
        await loadUsers();
      } else {
        await loadAll();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to remove user');
    }
  };

  // Individual activate/deactivate
  const handleUserStatus = async (user) => {
    const nextStatus = user.isActive !== true;
    const action = nextStatus ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }

    try {
      const response = await api.patch(
        `/admin/users/${user._id}/status`,
        { isActive: nextStatus }
      );

      toast.success(
        response.data.message || `User ${action}d successfully`
      );

      setUsers((current) =>
        current.map((item) =>
          item._id === user._id
            ? { ...item, isActive: nextStatus }
            : item
        )
      );

      setSelectedUser((current) =>
        current?._id === user._id
          ? { ...current, isActive: nextStatus }
          : current
      );

      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Failed to update user status'
      );
    }
  };

  // Select or deselect one user
  const toggleUserSelection = (userId) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  };

  // Only non-admin users can be selected
  const eligibleUsers = users.filter((user) => user.role !== 'admin');

  const allEligibleSelected =
    eligibleUsers.length > 0 &&
    eligibleUsers.every((user) => selectedUserIds.includes(user._id));

  // Select or deselect all eligible users on current page
  const toggleSelectAllUsers = () => {
    if (allEligibleSelected) {
      setSelectedUserIds((current) =>
        current.filter(
          (id) => !eligibleUsers.some((user) => user._id === id)
        )
      );
    } else {
      setSelectedUserIds((current) => [
        ...new Set([
          ...current,
          ...eligibleUsers.map((user) => user._id),
        ]),
      ]);
    }
  };

  // Bulk activate/deactivate users
  const handleBulkUserStatus = async (isActive) => {
    const userIds = [...new Set(selectedUserIds)];

    if (userIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const action = isActive ? 'activate' : 'deactivate';

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${userIds.length} selected user(s)?`
      )
    ) {
      return;
    }

    setBulkUpdating(true);

    try {
      const response = await api.patch('/admin/users/bulk-status', {
        userIds,
        isActive,
      });

      const result = response.data;

      console.log('BULK UPDATE RESPONSE:', result);

      // Immediately update frontend state
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          userIds.includes(user._id)
            ? { ...user, isActive }
            : user
        )
      );

      // Update open details modal if affected
      setSelectedUser((currentUser) =>
        currentUser && userIds.includes(currentUser._id)
          ? { ...currentUser, isActive }
          : currentUser
      );

      setSelectedUserIds([]);

      toast.success(
        result.message || `Selected users ${action}d successfully`
      );

      // Fetch latest data from backend
      await loadUsers();
    } catch (error) {
      console.error('Bulk user status error:', error);

      toast.error(
        error.response?.data?.message ||
          'Failed to update selected users'
      );

      await loadUsers();
    } finally {
      setBulkUpdating(false);
    }
  };

  // Open Edit User Modal
  const openEditUser = (user) => {
    if (!user || user.role === 'admin') {
      toast.error('Admin accounts cannot be edited');
      return;
    }

    setEditForm(getEditForm(user));
    setEditingUser(user);
    setSelectedUser(null);
  };

  // Handle Edit Form Changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Save Updated User Details
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!editingUser) return;

    if (editForm.name.trim().length < 2) {
      toast.error('Name must contain at least 2 characters');
      return;
    }

    if (!editForm.email.trim()) {
      toast.error('Email address is required');
      return;
    }

    if (
      editForm.age !== '' &&
      (
        !Number.isInteger(Number(editForm.age)) ||
        Number(editForm.age) < 0 ||
        Number(editForm.age) > 130
      )
    ) {
      toast.error('Please enter a valid age between 0 and 130');
      return;
    }

    const payload = {
      ...editForm,
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      age: editForm.age === '' ? null : Number(editForm.age),
    };

    setEditSaving(true);

    try {
      const response = await api.patch(
        `/admin/users/${editingUser._id}`,
        payload
      );

      const updatedUser = response.data?.data;

      if (updatedUser) {
        setUsers((current) =>
          current.map((user) =>
            user._id === updatedUser._id ? updatedUser : user
          )
        );
      }

      toast.success(
        response.data.message || 'User details updated successfully'
      );

      setEditingUser(null);
      setSelectedUser(null);

      await loadUsers();
    } catch (error) {
      console.error('Update user error:', error);

      toast.error(
        error.response?.data?.message || 'Failed to update user details'
      );
    } finally {
      setEditSaving(false);
    }
  };

  // Create department
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

      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Could not add department'
      );
    }
  };

  // Delete department
  const handleDeleteDept = async (id) => {
    if (!window.confirm('Delete this department?')) return;

    try {
      await api.delete(`/admin/departments/${id}`);

      toast.success('Department deleted');

      await loadAll();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading && !overview) {
    return (
      <div className="container">
        <div className="loading">
          <RefreshCw size={28} className="animate-spin" />
          <p>Loading Admin Control Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ paddingTop: '30px', paddingBottom: '50px' }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '25px',
        }}
      >
        <div>
          <h2 className="text-2xl font-extrabold">
            Hospital Admin Control Center
          </h2>
          <p className="text-sm text-slate-500">
            Analytics, doctor verification, patient registry and audit logs
          </p>
        </div>

        <button className="btn btn-outline" onClick={loadAll}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid-4" style={{ marginBottom: '25px' }}>
        <div className="card">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Total Patients
          </p>
          <h2 className="text-2xl font-extrabold mt-1">
            {overview?.totalPatients ?? 0}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Approved Doctors
          </p>
          <h2 className="text-2xl font-extrabold mt-1 text-teal-600">
            {overview?.totalDoctors ?? 0}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Pending Verification
          </p>
          <h2 className="text-2xl font-extrabold mt-1 text-amber-600">
            {overview?.pendingDoctors ?? 0}
          </h2>
        </div>

        <div className="card">
          <p className="text-xs font-bold text-slate-500 uppercase">
            Total Appointments
          </p>
          <h2 className="text-2xl font-extrabold mt-1 text-sky-600">
            {overview?.totalAppointments ?? 0}
          </h2>
        </div>
      </div>

      {/* NAVIGATION TABS */}
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
          onClick={() => setTab('users')}
          className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-outline'}`}
        >
          <ShieldCheck size={16} /> Manage Users
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

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="font-bold mb-4">
              Department-wise Appointments
            </h3>

            {departmentAnalytics.length === 0 ? (
              <p>No department analytics available yet.</p>
            ) : (
              <div style={{ width: '100%', height: 290 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="appointments"
                      fill="#0284c7"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-bold mb-4">
              Department Revenue Share (₹)
            </h3>

            {departmentAnalytics.length === 0 ? (
              <p>No revenue data available yet.</p>
            ) : (
              <div style={{ width: '100%', height: 290 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentAnalytics}
                      dataKey="revenue"
                      nameKey="department"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={(entry) =>
                        `${entry.department}: ₹${entry.revenue}`
                      }
                    >
                      {departmentAnalytics.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={COLORS[idx % COLORS.length]}
                        />
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

      {/* DOCTORS */}
      {tab === 'doctors' && (
        <div className="card table-container">
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
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="5">No doctors found.</td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc._id}>
                    <td>
                      <strong>{doc.user?.name || 'Unknown'}</strong>
                      <br />
                      <span className="text-xs text-slate-500">
                        {doc.user?.email || '—'}
                      </span>
                    </td>
                    <td>{doc.specialization || '—'}</td>
                    <td>₹{doc.consultationFee ?? 0}</td>
                    <td>
                      <span
                        className={`badge ${doc.isApproved ? 'badge-success' : 'badge-warning'}`}
                      >
                        {doc.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleApproval(doc._id)}
                        className={`btn ${doc.isApproved ? 'btn-danger' : 'btn-primary'}`}
                      >
                        {doc.isApproved ? 'Revoke' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PATIENTS */}
      {tab === 'patients' && (
        <div className="card table-container">
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
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="5">No patients found.</td>
                </tr>
              ) : (
                patients.map((pat) => (
                  <tr key={pat._id}>
                    <td>
                      <strong>{pat.name || '—'}</strong>
                    </td>
                    <td>{pat.email || '—'}</td>
                    <td>{pat.phone || '—'}</td>
                    <td>
                      {pat.createdAt
                        ? new Date(pat.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(pat._id)}
                        className="btn btn-danger"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MANAGE USERS */}
      {tab === 'users' && (
        <div className="card">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="text-xl font-extrabold">
                User Management
              </h3>
              <p className="text-sm text-slate-500">
                Search, filter, edit, activate and deactivate registered accounts
              </p>
            </div>

            <button
              className="btn btn-outline"
              onClick={loadUsers}
              disabled={usersLoading || bulkUpdating}
            >
              <RefreshCw size={15} /> Refresh Users
            </button>
          </div>

          {/* USER FILTERS */}
          <div className="grid-2 mb-5">
            <div className="form-group">
              <label>Search users</label>
              <div className="relative">
                <Search
                  size={17}
                  className="absolute"
                  style={{
                    left: '12px',
                    top: '13px',
                    color: '#64748b',
                  }}
                />

                <input
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                    setSelectedUserIds([]);
                  }}
                  placeholder="Search by name or email..."
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Filter by role</label>
              <select
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value);
                  setUserPage(1);
                  setSelectedUserIds([]);
                }}
              >
                <option value="">All Roles</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Account Status</label>
              <select
                value={userStatus}
                onChange={(e) => {
                  setUserStatus(e.target.value);
                  setUserPage(1);
                  setSelectedUserIds([]);
                }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* USER SUMMARY */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div
              className="card"
              style={{ flex: '1 1 150px', padding: '14px' }}
            >
              <p className="text-xs text-slate-500 font-bold">
                TOTAL MATCHING USERS
              </p>
              <h3 className="text-xl font-extrabold">
                {userPagination.total}
              </h3>
            </div>

            <div
              className="card"
              style={{ flex: '1 1 150px', padding: '14px' }}
            >
              <p className="text-xs text-slate-500 font-bold">
                CURRENT PAGE
              </p>
              <h3 className="text-xl font-extrabold">
                {userPage} / {userPagination.pages || 1}
              </h3>
            </div>
          </div>

          {/* BULK USER ACTIONS */}
          <div
            className="card mb-4"
            style={{
              padding: '16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-bold">Bulk User Actions</p>
                <p className="text-sm text-slate-500">
                  {selectedUserIds.length} user(s) selected
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  disabled={
                    selectedUserIds.length === 0 ||
                    bulkUpdating ||
                    usersLoading
                  }
                  onClick={() => handleBulkUserStatus(true)}
                >
                  <UserCheck size={15} />
                  Activate Selected
                </button>

                <button
                  className="btn btn-danger"
                  disabled={
                    selectedUserIds.length === 0 ||
                    bulkUpdating ||
                    usersLoading
                  }
                  onClick={() => handleBulkUserStatus(false)}
                >
                  <UserX size={15} />
                  Deactivate Selected
                </button>

                <button
                  className="btn btn-outline"
                  disabled={selectedUserIds.length === 0 || bulkUpdating}
                  onClick={() => setSelectedUserIds([])}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {bulkUpdating && (
              <p className="text-sm text-slate-500 mt-3">
                Updating selected user accounts...
              </p>
            )}
          </div>

          {/* USERS TABLE */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allEligibleSelected}
                      onChange={toggleSelectAllUsers}
                      disabled={
                        eligibleUsers.length === 0 ||
                        usersLoading ||
                        bulkUpdating
                      }
                      aria-label="Select all eligible users on this page"
                    />
                  </th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {usersLoading ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: 'center',
                        padding: '30px',
                      }}
                    >
                      <RefreshCw size={20} className="animate-spin" />
                      <p>Loading users...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        textAlign: 'center',
                        padding: '30px',
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        {user.role !== 'admin' ? (
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                            disabled={bulkUpdating}
                            aria-label={`Select ${user.name}`}
                          />
                        ) : (
                          <ShieldCheck
                            size={16}
                            className="text-slate-400"
                          />
                        )}
                      </td>

                      <td>
                        <strong>{user.name || 'Unknown'}</strong>
                        <br />
                        <span className="text-xs text-slate-500">
                          {user.email || '—'}
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-info">
                          {user.role || 'Unknown'}
                        </span>
                      </td>

                      <td>{user.phone || '—'}</td>

                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : '—'}
                      </td>

                      <td>
                        <span
                          className={`badge ${user.isActive ? 'badge-success' : 'badge-warning'}`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="btn btn-outline"
                            title="View user details"
                          >
                            <Eye size={14} /> View Details
                          </button>

                          {user.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => openEditUser(user)}
                                className="btn btn-primary"
                                title="Edit user details"
                              >
                                <Pencil size={14} /> Edit
                              </button>

                              <button
                                onClick={() => handleUserStatus(user)}
                                className={`btn ${user.isActive ? 'btn-danger' : 'btn-primary'}`}
                                title={
                                  user.isActive
                                    ? 'Deactivate user'
                                    : 'Activate user'
                                }
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX size={14} /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={14} /> Activate
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="btn btn-outline btn-danger"
                                title="Delete user"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}

                          {user.role === 'admin' && (
                            <span className="text-xs text-slate-500">
                              Protected account
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-wrap justify-between items-center gap-3 mt-5">
            <p className="text-sm text-slate-500">
              Showing {users.length} of {userPagination.total} users
            </p>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-outline"
                disabled={userPage <= 1 || usersLoading}
                onClick={() => {
                  setSelectedUserIds([]);
                  setUserPage((page) => Math.max(1, page - 1));
                }}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <span className="text-sm font-bold">
                {userPage} / {userPagination.pages || 1}
              </span>

              <button
                className="btn btn-outline"
                disabled={
                  userPage >= (userPagination.pages || 1) || usersLoading
                }
                onClick={() => {
                  setSelectedUserIds([]);
                  setUserPage((page) => page + 1);
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENTS */}
      {tab === 'departments' && (
        <div className="grid-2">
          <div className="card">
            <h3 className="font-bold mb-3">
              Add Hospital Department
            </h3>

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

              <button type="submit" className="btn btn-primary">
                Create Department
              </button>
            </form>
          </div>

          <div className="grid-2">
            {departments.length === 0 ? (
              <div className="card">
                No custom departments added yet.
              </div>
            ) : (
              departments.map((d) => (
                <div key={d._id} className="card">
                  <h4 className="font-bold text-sky-700">{d.name}</h4>
                  {d.headDoctor && <p>HOD: {d.headDoctor}</p>}
                  <p>{d.description || 'Active clinical unit'}</p>

                  <button
                    onClick={() => handleDeleteDept(d._id)}
                    className="btn btn-outline btn-danger"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPOINTMENTS */}
      {tab === 'appointments' && (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Date & Slot</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="4">No appointments found.</td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <strong>{a.appointmentDate || '—'}</strong> (
                      {a.timeSlot || '—'})
                    </td>
                    <td>{a.patient?.name || '—'}</td>
                    <td>{a.doctor?.user?.name || '—'}</td>
                    <td>
                      <span className="badge badge-info">
                        {a.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ACTIVITY LOGS */}
      {tab === 'logs' && (
        <div className="card table-container">
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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5">No activity logs found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : '—'}
                    </td>
                    <td>{log.actorName || '—'}</td>
                    <td>{log.role || '—'}</td>
                    <td>
                      <span className="badge badge-info">
                        {log.action || '—'}
                      </span>
                    </td>
                    <td>{log.details || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedUser(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '25px',
              position: 'relative',
              background: '#ffffff',
            }}
          >
            <button
              onClick={() => setSelectedUser(null)}
              className="btn btn-outline"
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                padding: '8px',
              }}
              aria-label="Close user details"
            >
              <X size={18} />
            </button>

            <div
              style={{
                marginBottom: '22px',
                paddingRight: '35px',
              }}
            >
              <p className="text-sm font-bold text-teal-600 uppercase">
                User Profile
              </p>
              <h2 className="text-2xl font-extrabold mt-1">
                {selectedUser.name || 'Unknown User'}
              </h2>
              <p className="text-sm text-slate-500">
                Account information and registration details
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="badge badge-info">
                {(selectedUser.role || 'Unknown').toUpperCase()}
              </span>

              <span
                className={`badge ${selectedUser.isActive ? 'badge-success' : 'badge-warning'}`}
              >
                {selectedUser.isActive ? 'Active Account' : 'Inactive Account'}
              </span>
            </div>

            <div className="grid-2">
              {[
                ['Full Name', selectedUser.name],
                ['Email Address', selectedUser.email],
                ['Phone Number', selectedUser.phone],
                ['Gender', selectedUser.gender],
                [
                  'Age',
                  selectedUser.age != null
                    ? `${selectedUser.age} years`
                    : null,
                ],
                ['Blood Group', selectedUser.bloodGroup],
                ['Role', selectedUser.role],
                [
                  'Account Status',
                  selectedUser.isActive ? 'Active' : 'Inactive',
                ],
                [
                  'Joined On',
                  selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : null,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    padding: '14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    minWidth: 0,
                  }}
                >
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                    {label}
                  </p>
                  <p className="font-semibold break-words">
                    {value || '—'}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '14px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                marginTop: '14px',
              }}
            >
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                Address
              </p>
              <p className="font-semibold break-words">
                {formatAddress(selectedUser.address)}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 mt-6">
              {selectedUser.role !== 'admin' && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => openEditUser(selectedUser)}
                  >
                    <Pencil size={15} /> Edit Details
                  </button>

                  <button
                    className={`btn ${selectedUser.isActive ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleUserStatus(selectedUser)}
                  >
                    {selectedUser.isActive ? (
                      <>
                        <UserX size={15} /> Deactivate
                      </>
                    ) : (
                      <>
                        <UserCheck size={15} /> Activate
                      </>
                    )}
                  </button>
                </>
              )}

              <button
                className="btn btn-outline"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !editSaving) {
              setEditingUser(null);
            }
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '700px',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '25px',
              position: 'relative',
              background: '#ffffff',
            }}
          >
            <button
              type="button"
              onClick={() => !editSaving && setEditingUser(null)}
              className="btn btn-outline"
              disabled={editSaving}
              style={{
                position: 'absolute',
                right: '16px',
                top: '16px',
                padding: '8px',
              }}
              aria-label="Close edit user form"
            >
              <X size={18} />
            </button>

            <div
              style={{
                marginBottom: '22px',
                paddingRight: '40px',
              }}
            >
              <p className="text-sm font-bold text-teal-600 uppercase">
                User Management
              </p>
              <h2 className="text-2xl font-extrabold mt-1">
                Edit User Details
              </h2>
              <p className="text-sm text-slate-500">
                Update the registered user's profile information
              </p>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    placeholder="Enter full name"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    placeholder="Enter phone number"
                    maxLength={20}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={editForm.gender}
                    onChange={handleEditChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={editForm.age}
                    onChange={handleEditChange}
                    placeholder="Enter age"
                    min="0"
                    max="130"
                    step="1"
                  />
                </div>

                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={editForm.bloodGroup}
                    onChange={handleEditChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>User Role</label>
                  <select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditChange}
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Admin role cannot be assigned from this form.
                  </p>
                </div>
              </div>

              <div className="form-group mt-3">
                <label>Address</label>
                <textarea
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  placeholder="Enter complete address"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 mt-6">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingUser(null)}
                  disabled={editSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSaving}
                >
                  {editSaving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
