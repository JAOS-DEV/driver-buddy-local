import React, { useEffect, useState } from "react";
import { UserProfile, UserRole } from "../types";
import { getAllUsers, updateUserRole } from "../services/firestoreStorage";
import type { User } from "firebase/auth";

interface AdminPanelProps {
  user: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (uid: string, newRole: UserRole) => {
    try {
      // Confirm role change
      const selfChange = uid === user.uid;
      const confirmMsg =
        selfChange && newRole !== "admin"
          ? "You are changing your own role and may lose admin access. Are you sure?"
          : `Change role for this user to "${newRole}"?`;
      if (!confirm(confirmMsg)) return;

      setUpdating(uid);
      await updateUserRole(uid, newRole);
      await loadUsers();
      showToast("Role updated successfully");
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast("Failed to update user role");
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "premium":
        return "bg-green-100 text-green-800 border-green-200";
      case "beta":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "free":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="text-sm text-slate-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#FAF7F0] text-[#003D5B]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-3 py-1.5 rounded shadow">
          {toastMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800">Admin Panel</h2>
            <p className="text-xs mt-1 text-slate-500">
              Manage user accounts and roles
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/50 border border-gray-200/80 rounded-lg p-2">
              <div className="text-lg font-bold text-slate-800">
                {users.filter((u) => u.role === "free").length}
              </div>
              <div className="text-xs text-slate-500">Free Users</div>
            </div>
            <div className="bg-white/50 border border-gray-200/80 rounded-lg p-2">
              <div className="text-lg font-bold text-slate-800">
                {users.filter((u) => u.role === "premium").length}
              </div>
              <div className="text-xs text-slate-500">Premium Users</div>
            </div>
            <div className="bg-white/50 border border-gray-200/80 rounded-lg p-2">
              <div className="text-lg font-bold text-slate-800">
                {users.filter((u) => u.role === "beta").length}
              </div>
              <div className="text-xs text-slate-500">Beta Testers</div>
            </div>
            <div className="bg-white/50 border border-gray-200/80 rounded-lg p-2">
              <div className="text-lg font-bold text-slate-800">
                {users.filter((u) => u.role === "admin").length}
              </div>
              <div className="text-xs text-slate-500">Admins</div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white/50 border border-gray-200/80 rounded-lg p-2">
            <h3 className="text-sm font-bold mb-2 text-slate-700">Users</h3>
            <div className="space-y-2">
              {users.map((userProfile) => (
                <div
                  key={userProfile.uid}
                  className="flex items-center justify-between p-2 bg-white/50 rounded border border-gray-200/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {userProfile.email}
                    </div>
                    <div className="text-xs text-slate-500">
                      Created:{" "}
                      {new Date(userProfile.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full border text-xs font-medium ${getRoleBadgeColor(
                        userProfile.role
                      )}`}
                    >
                      {userProfile.role}
                    </span>
                    <select
                      value={userProfile.role}
                      onChange={(e) =>
                        handleRoleUpdate(
                          userProfile.uid,
                          e.target.value as UserRole
                        )
                      }
                      disabled={updating === userProfile.uid}
                      className="text-xs bg-transparent border border-slate-300 rounded px-1 py-0.5"
                    >
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="beta">Beta Tester</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/50 border border-gray-200/80 rounded-lg p-2">
            <h3 className="text-sm font-bold mb-2 text-slate-700">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={loadUsers}
                className="w-full bg-blue-500 text-white font-bold py-1.5 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Refresh Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
