import crypto from "crypto";

// Password hashing and verification
export function hashPassword(password: string): string {
  // Create a salt and hash the password
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    const [salt, originalHash] = hash.split(":");
    if (!salt || !originalHash) return false;

    const newHash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");
    return newHash === originalHash;
  } catch {
    return false;
  }
}

// Password validation
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Simple JWT-like token generation
const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key-change-in-prod";

export function generateToken(
  userId: string,
  role: string,
  expiresIn: number = 24 * 60 * 60 * 1000, // 24 hours
): string {
  const payload = {
    userId,
    role,
    iat: Date.now(),
    exp: Date.now() + expiresIn,
  };

  // Create a simple token: base64(payload) + signature
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64");

  // Create signature using HMAC
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(payloadB64)
    .digest("hex");

  return `${payloadB64}.${signature}`;
}

export function verifyToken(token: string): {
  valid: boolean;
  data?: { userId: string; role: string };
  error?: string;
} {
  try {
    const [payloadB64, signature] = token.split(".");

    if (!payloadB64 || !signature) {
      return { valid: false, error: "Invalid token format" };
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(payloadB64)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { valid: false, error: "Invalid token signature" };
    }

    // Decode payload
    const payloadStr = Buffer.from(payloadB64, "base64").toString("utf-8");
    const payload = JSON.parse(payloadStr);

    // Check expiration
    if (payload.exp < Date.now()) {
      return { valid: false, error: "Token expired" };
    }

    return {
      valid: true,
      data: { userId: payload.userId, role: payload.role },
    };
  } catch (error) {
    return { valid: false, error: "Token verification failed" };
  }
}

// Generate OTP for password reset
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP temporarily (in production, use Redis or database)
const otpStore: Record<string, { code: string; expiresAt: number }> = {};

export function setOTP(email: string, code: string, ttlSeconds: number = 300) {
  otpStore[email] = {
    code,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
}

export function verifyOTP(email: string, code: string): boolean {
  const stored = otpStore[email];
  if (!stored) return false;

  if (stored.expiresAt < Date.now()) {
    delete otpStore[email];
    return false;
  }

  if (stored.code !== code) {
    return false;
  }

  delete otpStore[email];
  return true;
}
