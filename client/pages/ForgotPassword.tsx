import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Layout from "@/components/Layout";

type Step = "request" | "verify" | "reset";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success("OTP sent to your email");
      setStep("verify");
      setErrors({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to request reset";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (pwd: string) => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
    setPasswordRequirements(requirements);
    return Object.values(requirements).every((v) => v);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!otp) {
      newErrors.otp = "OTP is required";
    }

    if (!newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword = "Password does not meet all requirements";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reset password";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-card rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Reset Password
            </h1>
            <p className="text-muted-foreground mt-2">
              {step === "request" && "Enter your email to receive an OTP"}
              {step === "verify" && "Enter the OTP and set a new password"}
              {step === "reset" && "Create your new password"}
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50/10 border border-red-500 rounded text-red-500 text-sm">
              {errors.general}
            </div>
          )}

          {step === "request" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                    errors.email ? "border-red-500" : "border-input"
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground hover:opacity-90"
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (errors.otp) {
                      setErrors({ ...errors, otp: undefined });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                    errors.otp ? "border-red-500" : "border-input"
                  }`}
                  placeholder="000000"
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-red-500 text-xs mt-1">{errors.otp}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    validatePassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: undefined });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                    errors.newPassword ? "border-red-500" : "border-input"
                  }`}
                  placeholder="••••••••"
                />
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <p
                      className={`text-xs ${
                        passwordRequirements.length
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      ✓ At least 8 characters
                    </p>
                    <p
                      className={`text-xs ${
                        passwordRequirements.uppercase
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      ✓ One uppercase letter
                    </p>
                    <p
                      className={`text-xs ${
                        passwordRequirements.number
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      ✓ One number
                    </p>
                    <p
                      className={`text-xs ${
                        passwordRequirements.special
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      ✓ One special character (!@#$%^&*)
                    </p>
                  </div>
                )}
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: undefined });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card ${
                    errors.confirmPassword ? "border-red-500" : "border-input"
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground hover:opacity-90"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="mt-6">
            <Link to="/login" className="text-sm text-accent hover:text-accent/90 text-center block">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
