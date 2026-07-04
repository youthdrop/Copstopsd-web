import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { api, StaffUser } from "../lib/api";
import "./StaffManagementPage.css";

type FormState = {
  full_name: string;
  email: string;
  password: string;
  is_active: boolean;
};

const blankForm: FormState = {
  full_name: "",
  email: "",
  password: "",
  is_active: true,
};

export default function StaffManagementPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resetId, setResetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const editingUser = useMemo(() => users.find((u) => u.id === editingId) ?? null, [users, editingId]);

  async function loadUsers(search = q) {
    setLoading(true);
    setErr(null);
    try {
      const data = await api.listUsers(search);
      setUsers(data);
    } catch (e: any) {
      setErr(e?.message || "Could not load users. Admin access is required.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(user: StaffUser) {
    setEditingId(user.id);
    setForm({
      full_name: user.full_name || "",
      email: user.email,
      password: "",
      is_active: user.is_active,
    });
    setOk(null);
    setErr(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
    setOk(null);
    setErr(null);
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await loadUsers(q);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErr(null);
    setOk(null);

    try {
      if (!form.email.trim()) throw new Error("Email is required.");

      if (editingId) {
        await api.updateUser(editingId, {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          is_active: form.is_active,
          is_verified: true,
        });
        setOk("Staff user updated.");
      } else {
        if (!form.password || form.password.length < 8) {
          throw new Error("Temporary password must be at least 8 characters.");
        }
        await api.createUser({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          is_active: form.is_active,
        });
        setOk("Staff user created. They are staff, not admin.");
      }

      setForm(blankForm);
      setEditingId(null);
      await loadUsers(q);
    } catch (e: any) {
      setErr(e?.message || "Could not save user.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: StaffUser) {
    setErr(null);
    setOk(null);
    try {
      await api.updateUser(user.id, { is_active: !user.is_active });
      setOk(user.is_active ? "User deactivated." : "User activated.");
      await loadUsers(q);
    } catch (e: any) {
      setErr(e?.message || "Could not update user.");
    }
  }

  async function toggleAdmin(user: StaffUser) {
    const confirmed = window.confirm(
      user.is_admin
        ? `Remove admin access from ${user.full_name || user.email}?`
        : `Make ${user.full_name || user.email} an admin? Admins can add staff and delete records.`
    );
    if (!confirmed) return;

    setErr(null);
    setOk(null);
    try {
      await api.updateUser(user.id, { is_admin: !user.is_admin });
      setOk(user.is_admin ? "Admin access removed." : "User promoted to admin.");
      await loadUsers(q);
    } catch (e: any) {
      setErr(e?.message || "Could not update admin status.");
    }
  }

  async function onResetPassword(event: FormEvent) {
    event.preventDefault();
    if (!resetId) return;
    setErr(null);
    setOk(null);
    try {
      if (!newPassword || newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
      await api.resetUserPassword(resetId, newPassword);
      setOk("Password reset.");
      setResetId(null);
      setNewPassword("");
    } catch (e: any) {
      setErr(e?.message || "Could not reset password.");
    }
  }

  async function deleteUser(user: StaffUser) {
    const confirmed = window.confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`);
    if (!confirmed) return;
    setErr(null);
    setOk(null);
    try {
      await api.deleteUser(user.id);
      setOk("User deleted.");
      await loadUsers(q);
    } catch (e: any) {
      setErr(e?.message || "Could not delete user.");
    }
  }

  return (
    <main className="staff-page">
      <section className="staff-hero">
        <p className="staff-kicker">CopStopSD Admin</p>
        <h1>Staff Management</h1>
        <p>Add staff, reset passwords, manage access, and deactivate accounts.</p>
        <p className="staff-muted">New users are created as staff by default. Use “Make Admin” only when someone should manage staff or delete records.</p>
      </section>

      <section className="staff-grid">
        <form className="staff-card staff-form" onSubmit={onSubmit}>
          <h2>{editingUser ? "Edit Staff User" : "Add Staff User"}</h2>

          <label>
            <span>Full name</span>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" />
          </label>

          <label>
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="staff@example.com" required />
          </label>

          {!editingId ? (
            <label>
              <span>Temporary password</span>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" required />
            </label>
          ) : null}

          <div className="staff-checks">
            <label>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span>Active</span>
            </label>
          </div>

          <button className="staff-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save Changes" : "Create Staff User"}</button>
          {editingId ? <button type="button" className="staff-secondary" onClick={cancelEdit}>Cancel Edit</button> : null}
          {err ? <p className="staff-error">{err}</p> : null}
          {ok ? <p className="staff-ok">{ok}</p> : null}
        </form>

        <section className="staff-card staff-list-card">
          <div className="staff-list-header">
            <div>
              <h2>Users</h2>
              <p>{users.length} account(s)</p>
            </div>
            <form className="staff-search" onSubmit={onSearch}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search staff" />
              <button>Search</button>
            </form>
          </div>

          {loading ? <p className="staff-muted">Loading users...</p> : null}

          <div className="staff-users">
            {users.map((user) => (
              <article key={user.id} className="staff-user-row">
                <div>
                  <h3>{user.full_name || "Unnamed Staff"}</h3>
                  <p>{user.email}</p>
                  <div className="staff-badges">
                    <span className={user.is_active ? "badge active" : "badge inactive"}>{user.is_active ? "Active" : "Inactive"}</span>
                    <span className={user.is_admin ? "badge admin" : "badge staff"}>{user.is_admin ? "Admin" : "Staff"}</span>
                    <span className={user.is_verified ? "badge verified" : "badge inactive"}>{user.is_verified ? "Verified" : "Unverified"}</span>
                  </div>
                </div>

                <div className="staff-actions">
                  <button onClick={() => startEdit(user)}>Edit</button>
                  <button onClick={() => setResetId(user.id)}>Reset Password</button>
                  <button onClick={() => toggleActive(user)}>{user.is_active ? "Deactivate" : "Activate"}</button>
                  <button onClick={() => toggleAdmin(user)}>{user.is_admin ? "Remove Admin" : "Make Admin"}</button>
                  <button className="danger" onClick={() => deleteUser(user)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {resetId ? (
        <div className="staff-modal-backdrop">
          <form className="staff-modal" onSubmit={onResetPassword}>
            <h2>Reset Password</h2>
            <p>Enter a new temporary password for this staff user.</p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" required />
            <div className="staff-modal-actions">
              <button className="staff-primary">Save Password</button>
              <button type="button" className="staff-secondary" onClick={() => { setResetId(null); setNewPassword(""); }}>Cancel</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
