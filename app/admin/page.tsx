"use client";

import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import type { User, Subscription } from "../../types/api";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions' | 'analytics'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = process.env.NEXT_PUBLIC_USER_EMAIL === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/login';
      return;
    }

    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);

      // Load subscriptions
      const subscriptionsSnapshot = await getDocs(collection(db, "subscriptions"));
      const subscriptionsData = subscriptionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      setSubscriptions(subscriptionsData);

    } catch (error) {
      console.error("Error loading admin data:", error);
      alert("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: User['role']) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      alert(`User role updated to ${newRole}`);
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      alert("User deleted successfully");
      loadData(); // Refresh data
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return <div>Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading admin panel...</div>;
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>DeepVerse Admin Panel</h1>
        <button
          onClick={() => window.location.href = '/chat'}
          style={{ padding: "10px 20px", background: "#6C757D", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}
        >
          Back to Chat
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search users or subscriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 10, width: 300, border: "1px solid #ccc", borderRadius: 5 }}
        />
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: "10px 20px",
            marginRight: 10,
            background: activeTab === 'users' ? "#007AFF" : "#F0F0F0",
            color: activeTab === 'users' ? "white" : "black",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          style={{
            padding: "10px 20px",
            marginRight: 10,
            background: activeTab === 'subscriptions' ? "#007AFF" : "#F0F0F0",
            color: activeTab === 'subscriptions' ? "white" : "black",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: "10px 20px",
            background: activeTab === 'analytics' ? "#007AFF" : "#F0F0F0",
            color: activeTab === 'analytics' ? "white" : "black",
            border: "none",
            borderRadius: 5,
            cursor: "pointer"
          }}
        >
          Analytics
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2>User Management</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
              <thead>
                <tr style={{ background: "#F0F0F0" }}>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Email</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Name</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Role</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{user.email}</td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{user.fullName}</td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as User['role'])}
                        style={{ padding: 5 }}
                      >
                        <option value="user">User</option>
                        <option value="demo">Demo</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{ padding: "5px 10px", background: "#DC3545", color: "white", border: "none", borderRadius: 3, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div>
          <h2>Subscription Management</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
              <thead>
                <tr style={{ background: "#F0F0F0" }}>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Email</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Name</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Tier</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Status</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>Payment Method</th>
                  <th style={{ padding: 10, textAlign: "left", border: "1px solid #ccc" }}>End Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{sub.email}</td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{sub.fullName}</td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{sub.tier}</td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{sub.status}</td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{sub.paymentMethod}</td>
                    <td style={{ padding: 10, border: "1px solid #ccc" }}>{new Date(sub.endDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <h2>Analytics Dashboard</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            <div style={{ padding: 20, border: "1px solid #ccc", borderRadius: 5 }}>
              <h3>Total Users</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", color: "#007AFF" }}>{users.length}</p>
            </div>
            <div style={{ padding: 20, border: "1px solid #ccc", borderRadius: 5 }}>
              <h3>Active Subscriptions</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", color: "#28A745" }}>
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div style={{ padding: 20, border: "1px solid #ccc", borderRadius: 5 }}>
              <h3>Trial Users</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", color: "#6C757D" }}>
                {users.filter(u => u.subscriptionStatus === 'trial').length}
              </p>
            </div>
            <div style={{ padding: 20, border: "1px solid #ccc", borderRadius: 5 }}>
              <h3>Revenue</h3>
              <p style={{ fontSize: 24, fontWeight: "bold", color: "#FFC107" }}>
                ₱{subscriptions.filter(s => s.status === 'active').length * 299}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
