import { RequestHandler } from "express";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  generateToken,
  generateOTP,
  setOTP,
  verifyOTP,
} from "../utils/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// In-memory user storage (replace with database in production)
export let users: User[] = [];

// Initialize default admin if not exists
export function initializeDefaultAdmin() {
  const adminExists = users.some((u) => u.email === "akira@hkjewel.co");

  if (!adminExists) {
    const adminUser: User = {
      id: "admin_" + Date.now(),
      email: "akira@hkjewel.co",
      name: "Admin",
      passwordHash: hashPassword("Admin@123"),
      role: "ADMIN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };
    users.push(adminUser);
    console.log("Default admin account created: akira@hkjewel.co / Admin@123");
  }
}

// Signup endpoint
export const signup: RequestHandler = (req, res) => {
  try {
    const { email, name, password, phone } = req.body;

    // Validate inputs
    if (!email || !name || !password) {
      res.status(400).json({ error: "Email, name, and password are required" });
      return;
    }

    // Check if user already exists
    if (users.some((u) => u.email === email)) {
      res.status(400).json({ error: "User with this email already exists" });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    // Create new user
    const newUser: User = {
      id: "user_" + Date.now(),
      email,
      name,
      phone,
      passwordHash: hashPassword(password),
      role: "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    users.push(newUser);

    // Generate token
    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
};

// Login endpoint
export const login: RequestHandler = (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user
    const user = users.find((u) => u.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Account is disabled" });
      return;
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

// Get current user
export const getCurrentUser: RequestHandler = (req, res) => {
  try {
    const userId = (req as any).userId;
    const role = (req as any).userRole;

    const user = users.find((u) => u.id === userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
};

// Change password
export const changePassword: RequestHandler = (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).userId;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ error: "Current password and new password are required" });
      return;
    }

    const user = users.find((u) => u.id === userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "New password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    // Update password
    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Request password reset (send OTP)
export const requestPasswordReset: RequestHandler = (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = users.find((u) => u.email === email);

    if (!user) {
      // Don't reveal if user exists for security
      res.json({
        message: "If this email exists, an OTP has been sent",
      });
      return;
    }

    // Generate and store OTP
    const otp = generateOTP();
    setOTP(email, otp);

    // In production, send via email or SMS
    console.log(`Password reset OTP for ${email}: ${otp}`);

    res.json({
      message: "OTP sent to your email/phone",
      // In development, return OTP for testing (remove in production)
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    res.status(500).json({ error: "Failed to request password reset" });
  }
};

// Reset password with OTP
export const resetPassword: RequestHandler = (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
      return;
    }

    // Verify OTP
    if (!verifyOTP(email, otp)) {
      res.status(401).json({ error: "Invalid or expired OTP" });
      return;
    }

    // Find user
    const user = users.find((u) => u.email === email);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    // Update password
    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Admin: Get all users
export const getAllUsers: RequestHandler = (req, res) => {
  try {
    const role = (req as any).userRole;

    if (role !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const userList = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    res.json(userList);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

// Admin: Update user
export const updateUser: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, isActive } = req.body;
    const requesterRole = (req as any).userRole;

    if (requesterRole !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const user = users.find((u) => u.id === userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Update fields
    if (name) user.name = name;
    if (email && !users.some((u) => u.id !== userId && u.email === email)) {
      user.email = email;
    }
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    user.updatedAt = new Date().toISOString();

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Admin: Delete user
// Admin: Create user
export const createUser: RequestHandler = (req, res) => {
  try {
    const requesterRole = (req as any).userRole;

    if (requesterRole !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      res
        .status(400)
        .json({ error: "Name, email and password are required" });
      return;
    }

    if (users.some((u) => u.email === email)) {
      res.status(400).json({ error: "User with this email already exists" });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    const newUser: User = {
      id: "user_" + Date.now(),
      email,
      name,
      phone,
      passwordHash: hashPassword(password),
      role: role === "ADMIN" ? "ADMIN" : "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    users.push(newUser);

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const deleteUser: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const requesterRole = (req as any).userRole;

    if (requesterRole !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent deleting the default admin
    if (users[userIndex].email === "akira@hkjewel.co") {
      res.status(400).json({ error: "Cannot delete default admin account" });
      return;
    }

    users.splice(userIndex, 1);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Admin: Reset user password
export const resetUserPassword: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const requesterRole = (req as any).userRole;

    if (requesterRole !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    if (!newPassword) {
      res.status(400).json({ error: "New password is required" });
      return;
    }

    const user = users.find((u) => u.id === userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();

    res.json({ message: "User password reset successfully" });
  } catch (error) {
    console.error("Reset user password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
