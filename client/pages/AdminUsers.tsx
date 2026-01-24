import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Edit2, RotateCcw, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditingUser {
  id: string;
  [key: string]: any;
}

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingUser | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(
    null,
  );
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");

  // Add user state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER" as "USER" | "ADMIN",
  });
  const [newUserError, setNewUserError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    const { id, createdAt, role, ...editableFields } = user;
    setEditingData({ id, ...editableFields });
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;

    try {
      const response = await fetch(`/api/users/${editingData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingData),
      });

      if (!response.ok) throw new Error("Failed to update user");

      toast.success("User updated successfully");
      setEditingId(null);
      setEditingData(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete user");

      toast.success("User deleted successfully");
      setUsers(users.filter((u) => u.id !== id));
    } catch (error) {
      toast.error("Failed to delete user");
      console.error(error);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetPassword.trim()) {
      setResetPasswordError("Password is required");
      return;
    }

    // Validate password
    const errors = [];
    if (resetPassword.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(resetPassword)) {
      errors.push("One uppercase letter");
    }
    if (!/[0-9]/.test(resetPassword)) {
      errors.push("One number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(resetPassword)) {
      errors.push("One special character");
    }

    if (errors.length > 0) {
      setResetPasswordError(`Password must have: ${errors.join(", ")}`);
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      if (!response.ok) throw new Error("Failed to reset password");

      toast.success("User password reset successfully");
      setShowResetPassword(null);
      setResetPassword("");
      setResetPasswordError("");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to reset password");
      console.error(error);
    }
  };

  const handleEditChange = (field: string, value: any) => {
    if (editingData) {
      setEditingData({ ...editingData, [field]: value });
    }
  };

  const handleAddUser = async () => {
    setNewUserError(null);

    // Basic validation
    if (!newUser.name || !newUser.email || !newUser.password) {
      setNewUserError("Name, email and password are required");
      return;
    }

    // Password rules as used elsewhere
    const errors = [] as string[];
    if (newUser.password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(newUser.password)) errors.push("One uppercase letter");
    if (!/[0-9]/.test(newUser.password)) errors.push("One number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newUser.password))
      errors.push("One special character");

    if (errors.length > 0) {
      setNewUserError(`Password must have: ${errors.join(", ")}`);
      return;
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create user");
      }

      toast.success("User created successfully");
      setShowAddUser(false);
      setNewUser({ name: "", email: "", phone: "", password: "", role: "USER" });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-secondary flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading users...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-secondary py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              User Management
            </h1>
            <Button
              className="bg-accent text-accent-foreground hover:opacity-90 flex items-center gap-2"
              onClick={() => setShowAddUser(true)}
            >
              <Plus size={18} />
              Add User
            </Button>
          </div>

          {showAddUser && (
            <div className="bg-card rounded-lg p-6 mb-8 border border-input">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>
              {newUserError && (
                <div className="text-red-500 text-sm mb-2">{newUserError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    At least 8 chars, with uppercase, number, and special character
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setShowAddUser(false); setNewUserError(null); }}>
                  Cancel
                </Button>
                <Button className="bg-accent text-accent-foreground hover:opacity-90" onClick={handleAddUser}>
                  Create User
                </Button>
              </div>
            </div>
          )}

          {users.length === 0 ? (
            <div className="bg-card rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="bg-secondary border-b border-input">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-input">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-secondary transition-colors"
                      >
                        {editingId === user.id ? (
                          <>
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-4 bg-secondary p-6 rounded max-h-96 overflow-y-auto">
                                <h3 className="font-semibold text-foreground mb-4">
                                  Edit User
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editingData?.name || ""}
                                      onChange={(e) =>
                                        handleEditChange("name", e.target.value)
                                      }
                                      className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                      Email
                                    </label>
                                    <input
                                      type="email"
                                      value={editingData?.email || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "email",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                      Phone
                                    </label>
                                    <input
                                      type="tel"
                                      value={editingData?.phone || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "phone",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                      Status
                                    </label>
                                    <select
                                      value={
                                        editingData?.isActive
                                          ? "active"
                                          : "inactive"
                                      }
                                      onChange={(e) =>
                                        handleEditChange(
                                          "isActive",
                                          e.target.value === "active",
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-input bg-card rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    >
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-4 border-t border-input">
                                  <Button
                                    onClick={() => setEditingId(null)}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleSaveEdit}
                                    className="bg-accent text-accent-foreground hover:opacity-90"
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : showResetPassword === user.id ? (
                          <>
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-4 bg-secondary p-6 rounded">
                                <h3 className="font-semibold text-foreground mb-4">
                                  Reset Password for {user.name}
                                </h3>

                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-2">
                                    New Password
                                  </label>
                                  <input
                                    type="password"
                                    value={resetPassword}
                                    onChange={(e) => {
                                      setResetPassword(e.target.value);
                                      setResetPasswordError("");
                                    }}
                                    placeholder="••••••••"
                                    className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                                      resetPasswordError
                                        ? "border-red-500"
                                        : "border-input"
                                    }`}
                                  />
                                  {resetPasswordError && (
                                    <p className="text-red-500 text-xs mt-1">
                                      {resetPasswordError}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Must be at least 8 characters with
                                    uppercase, number, and special character
                                  </p>
                                </div>

                                <div className="flex gap-2 justify-end pt-4 border-t border-input">
                                  <Button
                                    onClick={() => {
                                      setShowResetPassword(null);
                                      setResetPassword("");
                                      setResetPasswordError("");
                                    }}
                                    variant="outline"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => handleResetPassword(user.id)}
                                    className="bg-accent text-accent-foreground hover:opacity-90"
                                  >
                                    Reset Password
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              {user.phone || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  user.role === "ADMIN"
                                    ? "bg-accent/20 text-accent"
                                    : "bg-blue-500/20 text-blue-500"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  user.isActive
                                    ? "bg-green-500/20 text-green-500"
                                    : "bg-red-500/20 text-red-500"
                                }`}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => handleEdit(user)}
                                  size="sm"
                                  variant="outline"
                                  className="px-2"
                                  title="Edit user"
                                >
                                  <Edit2 size={16} />
                                </Button>
                                <Button
                                  onClick={() => setShowResetPassword(user.id)}
                                  size="sm"
                                  variant="outline"
                                  className="px-2"
                                  title="Reset password"
                                >
                                  <RotateCcw size={16} />
                                </Button>
                                <Button
                                  onClick={() => handleDelete(user.id)}
                                  size="sm"
                                  variant="outline"
                                  className="px-2 text-destructive hover:text-destructive"
                                  title="Delete user"
                                  disabled={user.email === "akira@hkjewel.co"}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
