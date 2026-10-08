import { Link, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Password reset token is missing.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reset password."
        );
      }

      setSuccess(true);
    } catch (error) {
      console.error("Reset Password Error:", error);
      setError(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-32 text-white">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 45, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">
            Account Recovery
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Reset Password
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Create a new password for your CineMate account.
          </p>
        </div>

        <motion.div
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          whileHover={{
            borderColor: "rgba(255,255,255,0.16)",
          }}
        >
          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-2xl">
                ✓
              </div>

              <h2 className="mt-6 text-2xl font-semibold">
                Password Reset
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/45">
                Your password has been changed successfully.
                You can now login with your new password.
              </p>

              <Link
                to="/login"
                replace
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Go to Login
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm text-white/60"
                >
                  New Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-new-password"
                  className="mb-2 block text-sm text-white/60"
                >
                  Confirm New Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
              >
                <span>{loading ? "Resetting..." : "Reset Password"}</span>
                {!loading && <ArrowRight size={17} />}
              </motion.button>
            </form>
          )}

          {!success && (
            <div className="mt-7 border-t border-white/10 pt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-white/50 transition hover:text-white"
              >
                Back to Login
              </Link>
            </div>
          )}
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-white/20">
          Discover. Connect. Watch. — CineMate
        </p>
      </motion.div>
    </main>
  );
};

export default ResetPassword;
