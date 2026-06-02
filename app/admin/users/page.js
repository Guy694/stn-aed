'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save, Shield, UserCircle2 } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

const MODULE_LABELS = {
  map: 'แผนที่ AED',
  dashboard: 'Dashboard',
  my_reports: 'แจ้งรายงาน AED',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [moduleKeys, setModuleKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE}/api/admin/users`);
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

  const userCount = useMemo(() => users.length, [users]);

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
      const res = await fetch(`${BASE}/api/admin/users/${user.id}/modules`, {
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
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Admin</p>
            <h1 className="text-2xl font-black text-slate-900">จัดการสิทธิ์โมดูลรายบุคคล</h1>
            <p className="text-sm text-slate-500 mt-1">แอดมินสามารถเปิด-ปิดโมดูลของเจ้าหน้าที่แต่ละคนได้</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
              ผู้ใช้งานทั้งหมด <span className="font-bold text-slate-900">{userCount}</span>
            </div>
            <button
              onClick={load}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
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
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">ผู้ใช้งาน</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  {moduleKeys.map((key) => (
                    <th key={key} className="px-4 py-3 text-center whitespace-nowrap">{MODULE_LABELS[key] || key}</th>
                  ))}
                  <th className="px-4 py-3 text-center">บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
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
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
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
    </div>
  );
}
