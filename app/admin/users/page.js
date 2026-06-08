'use client';

import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, RefreshCw, Save, Shield, Trash2, UserCircle2, UserPlus2, X } from 'lucide-react';

import { apiFetch } from '@/app/lib/client-api';

const MODULE_LABELS = {
  map: 'แผนที่ AED',
  dashboard: 'Dashboard',
  my_reports: 'แจ้งรายงาน AED',
  manage_dental: 'จัดการทันตกรรม',
  manage_health_stations: 'จัดการ Health Station',
  manage_aed: 'จัดการ AED',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [moduleKeys, setModuleKeys] = useState([]);
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [resettingUserId, setResettingUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteDialogUser, setDeleteDialogUser] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'user',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/users`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดข้อมูลผู้ใช้งานไม่สำเร็จ');

      setUsers(data.users || []);
      setModuleKeys(data.moduleKeys || []);
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const loadRegistrationRequests = async () => {
    try {
      const res = await apiFetch(`/api/admin/registration-requests?status=pending`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'โหลดคำขอลงทะเบียนไม่สำเร็จ');
      setRegistrationRequests(data.requests || []);
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }
  };

  useEffect(() => {
    loadRegistrationRequests();
  }, []);

  const userCount = useMemo(() => users.length, [users]);
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const fullName = String(u.full_name || '').toLowerCase();
      const username = String(u.username || '').toLowerCase();
      return fullName.includes(q) || username.includes(q);
    });
  }, [users, search]);

  const resetForm = () => {
    setEditingUserId(null);
    setForm({ username: '', full_name: '', password: '', role: 'user' });
  };

  const openEditForm = (user) => {
    setEditingUserId(user.id);
    setForm({
      username: user.username || '',
      full_name: user.full_name || '',
      password: '',
      role: user.role === 'admin' ? 'admin' : 'user',
    });
  };

  const submitUserForm = async () => {
    setSubmittingUser(true);
    setError('');
    setNotice('');

    try {
      const endpoint = editingUserId
        ? `/api/admin/users/${editingUserId}`
        : '/api/admin/users';
      const method = editingUserId ? 'PUT' : 'POST';

      const payload = {
        username: form.username,
        full_name: form.full_name,
        role: form.role,
      };

      if (!editingUserId || form.password) {
        payload.password = form.password;
      }

      const res = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกข้อมูลผู้ใช้งานไม่สำเร็จ');

      await load();
      setNotice(editingUserId ? 'แก้ไขผู้ใช้งานเรียบร้อยแล้ว' : 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว');
      resetForm();
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }

    setSubmittingUser(false);
  };

  const deleteUser = async (user) => {
    setDeleteDialogUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialogUser) return;
    setDeletingUserId(deleteDialogUser.id);
    setError('');
    setNotice('');

    try {
      const res = await apiFetch(`/api/admin/users/${deleteDialogUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบผู้ใช้งานไม่สำเร็จ');

      await load();
      setNotice(`ลบผู้ใช้งาน ${deleteDialogUser.username} แล้ว`);
      if (editingUserId === deleteDialogUser.id) resetForm();
      setDeleteDialogUser(null);
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }

    setDeletingUserId(null);
  };

  const resetPassword = async (user) => {
    setResettingUserId(user.id);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', new_password: '123456' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
      setNotice(`รีเซ็ตรหัสผ่าน ${user.username} สำเร็จ (รหัสใหม่: 123456)`);
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }
    setResettingUserId(null);
  };

  const approveRequest = async (requestId) => {
    setApprovingRequestId(requestId);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`/api/admin/registration-requests/${requestId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อนุมัติคำขอไม่สำเร็จ');
      await Promise.all([load(), loadRegistrationRequests()]);
      setNotice(
        data.approvalEmail?.sent
          ? 'อนุมัติคำขอลงทะเบียนและส่งอีเมลแจ้งผลเรียบร้อยแล้ว'
          : 'อนุมัติคำขอลงทะเบียนเรียบร้อยแล้ว แต่ยังไม่ได้ส่งอีเมลแจ้งผล',
      );
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }
    setApprovingRequestId(null);
  };

  const rejectRequest = async (requestId) => {
    setRejectingRequestId(requestId);
    setError('');
    setNotice('');
    try {
      const res = await apiFetch(`/api/admin/registration-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'ไม่ผ่านการพิจารณา' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ปฏิเสธคำขอไม่สำเร็จ');
      await loadRegistrationRequests();
      setNotice('ปฏิเสธคำขอลงทะเบียนเรียบร้อยแล้ว');
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }
    setRejectingRequestId(null);
  };

  const togglePermission = (userId, moduleKey) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        if (u.role === 'admin') return u;

        return {
          ...u,
          module_permissions: {
            ...u.module_permissions,
            [moduleKey]: !u.module_permissions?.[moduleKey],
          },
        };
      }),
    );
  };

  const saveUserPermissions = async (user) => {
    setSavingUserId(user.id);
    setNotice('');
    setError('');
    try {
      const res = await apiFetch(`/api/admin/users/${user.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: user.module_permissions || {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกสิทธิ์ไม่สำเร็จ');

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, module_permissions: data.modulePermissions } : u)),
      );
      setNotice(`บันทึกสิทธิ์ของ ${user.full_name || user.username} แล้ว`);
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    }
    setSavingUserId(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">Admin</p>
            <h1 className="text-2xl font-black text-slate-900">จัดการสิทธิ์โมดูลรายบุคคล</h1>
            <p className="text-sm text-slate-500 mt-1">กำหนดสิทธิ์เจ้าหน้าที่ให้เข้าจัดการโมดูลทันตกรรม, Health Station และ AED</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
              ผู้ใช้งานทั้งหมด <span className="font-bold text-slate-900">{userCount}</span>
            </div>
            <button
              onClick={async () => {
                await Promise.all([load(), loadRegistrationRequests()]);
              }}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus2 className="w-4 h-4 text-amber-700" />
            <p className="text-sm font-semibold text-amber-800">คำขอลงทะเบียนรออนุมัติ ({registrationRequests.length})</p>
          </div>

          {registrationRequests.length === 0 ? (
            <p className="text-sm text-amber-700">ไม่มีคำขอรออนุมัติ</p>
          ) : (
            <div className="space-y-2">
              {registrationRequests.map((requestItem) => (
                <div key={requestItem.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5 flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{requestItem.full_name} ({requestItem.username})</p>
                    <p className="text-xs text-slate-500">
                      ที่มา: {requestItem.source === 'line' ? 'LINE' : 'ฟอร์ม'}
                      {requestItem.facility_name ? ` • หน่วยงาน: ${requestItem.facility_name}` : ''}
                      {requestItem.position_name ? ` • ตำแหน่ง: ${requestItem.position_name}` : ''}
                      {requestItem.email ? ` • อีเมล: ${requestItem.email}` : ''}
                      {requestItem.phone ? ` • โทร: ${requestItem.phone}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveRequest(requestItem.id)}
                      disabled={approvingRequestId === requestItem.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {approvingRequestId === requestItem.id ? 'กำลังอนุมัติ...' : 'อนุมัติ'}
                    </button>
                    <button
                      onClick={() => rejectRequest(requestItem.id)}
                      disabled={rejectingRequestId === requestItem.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      {rejectingRequestId === requestItem.id ? 'กำลังปฏิเสธ...' : 'ปฏิเสธ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาผู้ใช้ (ชื่อ/username)"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            placeholder="ชื่อผู้ใช้"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
            placeholder="ชื่อ-นามสกุล"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={editingUserId ? 'รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)' : 'รหัสผ่าน (อย่างน้อย 6 ตัว)'}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={submitUserForm}
              disabled={submittingUser}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {editingUserId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {submittingUser ? 'กำลังบันทึก...' : editingUserId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
            </button>
            {editingUserId && (
              <button
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">{notice}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                  <th className="px-4 py-3 text-left">ผู้ใช้งาน</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  {moduleKeys.map((key) => (
                    <th key={key} className="px-4 py-3 text-center whitespace-nowrap">{MODULE_LABELS[key] || key}</th>
                  ))}
                  <th className="px-4 py-3 text-center">จัดการผู้ใช้</th>
                  <th className="px-4 py-3 text-center">บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <UserCircle2 className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.full_name || '-'}</p>
                          <p className="text-xs text-slate-500">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${
                          user.role === 'admin'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <Shield className="w-3 h-3" />{user.role}
                      </span>
                    </td>
                    {moduleKeys.map((key) => {
                      const checked = Boolean(user.module_permissions?.[key]);
                      const disabled = user.role === 'admin';
                      return (
                        <td key={key} className="px-4 py-3 text-center">
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => togglePermission(user.id, key)}
                              className="w-4 h-4 accent-sky-600 disabled:opacity-50"
                            />
                          </label>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(user)}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        >
                          <Pencil className="w-3.5 h-3.5" />แก้ไข
                        </button>
                        <button
                          onClick={() => resetPassword(user)}
                          disabled={resettingUserId === user.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5" />{resettingUserId === user.id ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={deletingUserId === user.id}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />{deletingUserId === user.id ? 'กำลังลบ...' : 'ลบ'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => saveUserPermissions(user)}
                        disabled={savingUserId === user.id || user.role === 'admin'}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingUserId === user.id ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteDialogUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบผู้ใช้งาน</h3>
                <p className="text-sm text-slate-600 mt-1">
                  ต้องการลบผู้ใช้งาน <span className="font-semibold">{deleteDialogUser.username}</span> ใช่หรือไม่
                </p>
              </div>
              <button
                onClick={() => setDeleteDialogUser(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteDialogUser(null)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deletingUserId === deleteDialogUser.id}
                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deletingUserId === deleteDialogUser.id ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
