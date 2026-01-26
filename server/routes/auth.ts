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
      return res.status(400).json({ success: false, message: "Email, name, and password are required" });
    }

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: "Password validation failed",
        details: passwordValidation.errors,
      });
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

    return res.status(201).json({
      success: true,
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
    return res.status(500).json({ success: false, message: "Signup failed" });
  }
};

// Login endpoint
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is disabled" });
    }

    const token = generateToken(user.id, user.role);

    return res.status(200).json({
      success: true,
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
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

// Get current user
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await UserModel.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ success: false, message: "Failed to get user" });
  }
};

// Change password
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: "New password validation failed",
        details: passwordValidation.errors,
      });
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

// Request password reset (send OTP)
export const requestPasswordReset: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await UserModel.findOne({ email }).lean();

    if (!user) {
      return res.status(200).json({ success: true, message: "If this email exists, an OTP has been sent" });
    }

    const otp = generateOTP();
    setOTP(email, otp);

    console.log(`Password reset OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email/phone",
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Request password reset error:", error);
    return res.status(500).json({ success: false, message: "Failed to request password reset" });
  }
};

// Reset password with OTP
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required" });
    }

    if (!verifyOTP(email, otp)) {
      return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

// Admin: Get all users
export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const role = req.userRole;

    if (role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const userList = await UserModel.find().lean();

    return res.status(200).json({
      success: true,
      data: userList.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ success: false, message: "Failed to get users" });
  }
};

// Admin: Update user
export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, isActive } = req.body;
    const requesterRole = req.userRole;

    if (requesterRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email) {
      const emailTaken = await UserModel.findOne({ email, _id: { $ne: userId } });
      if (emailTaken) {
        return res.status(400).json({ success: false, message: "User with this email already exists" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

// Admin: Delete user
// Admin: Create user
export const createUser: RequestHandler = async (req, res) => {
  try {
    const requesterRole = req.userRole;

    if (requesterRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    const newUser = await UserModel.create({
      email,
      name,
      phone,
      passwordHash: hashPassword(password),
      role: role === "ADMIN" ? "ADMIN" : "USER",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
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
    return res.status(500).json({ success: false, message: "Failed to create user" });
  }
};

export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterRole = req.userRole;

    if (requesterRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.email === "akira@hkjewel.co") {
      return res.status(400).json({ success: false, message: "Cannot delete default admin account" });
    }

    await user.deleteOne();

    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

// Admin: Reset user password
export const resetUserPassword: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const requesterRole = (req as any).userRole;

    if (requesterRole !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "New password is required" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: "Password validation failed",
        details: passwordValidation.errors,
      });
    }

    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date();
    await user.save();

    return res.status(200).json({ success: true, message: "User password reset successfully" });
  } catch (error) {
    console.error("Reset user password error:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};
