import { RequestHandler } from "express";
import { UserModel } from "../models/User";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  generateToken,
  generateOTP,
  setOTP,
  verifyOTP,
} from "../utils/auth";

// Initialize default admin if not exists (Mongo-backed)
export async function initializeDefaultAdmin() {
  const adminEmail = "akira@hkjewel.co";
  const adminExists = await UserModel.findOne({ email: adminEmail }).lean();

  if (adminExists) return;

  await UserModel.create({
    email: adminEmail,
    name: "Admin",
    passwordHash: hashPassword("Admin@123"),
    role: "ADMIN",
    isActive: true,
  });

  console.log("Default admin account created: akira@hkjewel.co / Admin@123");
}

// Signup endpoint
export const signup: RequestHandler = async (req, res) => {
  try {
    const { email, name, password, phone } = req.body;

    if (!email || !name || !password) {
      res.status(400).json({ error: "Email, name, and password are required" });
      return;
    }

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
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

    const newUser = await UserModel.create({
      email,
      name,
      phone,
      passwordHash: hashPassword(password),
      role: "USER",
      isActive: true,
    });

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
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await UserModel.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Account is disabled" });
      return;
    }

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
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await UserModel.findById(userId).lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user._id.toString(),
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
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ error: "Current password and new password are required" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "New password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};

// Request password reset (send OTP)
export const requestPasswordReset: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = await UserModel.findOne({ email }).lean();

    if (!user) {
      res.json({ message: "If this email exists, an OTP has been sent" });
      return;
    }

    const otp = generateOTP();
    setOTP(email, otp);

    console.log(`Password reset OTP for ${email}: ${otp}`);

    res.json({
      message: "OTP sent to your email/phone",
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    res.status(500).json({ error: "Failed to request password reset" });
  }
};

// Reset password with OTP
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res
        .status(400)
        .json({ error: "Email, OTP, and new password are required" });
      return;
    }

    if (!verifyOTP(email, otp)) {
      res.status(401).json({ error: "Invalid or expired OTP" });
      return;
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

// Admin: Get all users
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const role = req.userRole;

    if (role !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const userList = await UserModel.find().lean();

    res.json(
      userList.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    );
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
};

// Admin: Update user
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, isActive } = req.body;
    const requesterRole = req.userRole;

    if (requesterRole !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (email) {
      const emailTaken = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (emailTaken) {
        res.status(400).json({ error: "User with this email already exists" });
        return;
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    user.updatedAt = new Date();
    await user.save();

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
export const createUser: RequestHandler = async (req, res) => {
  try {
    const requesterRole = req.userRole;

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

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
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

    const newUser = await UserModel.create({
      email,
      name,
      phone,
      passwordHash: hashPassword(password),
      role: role === "ADMIN" ? "ADMIN" : "USER",
      isActive: true,
    });

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

export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterRole = req.userRole;

    if (requesterRole !== "ADMIN") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (user.email === "akira@hkjewel.co") {
      res.status(400).json({ error: "Cannot delete default admin account" });
      return;
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Admin: Reset user password
export const resetUserPassword: RequestHandler = async (req, res) => {
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

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: "Password validation failed",
        details: passwordValidation.errors,
      });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    res.json({ message: "User password reset successfully" });
  } catch (error) {
    console.error("Reset user password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
