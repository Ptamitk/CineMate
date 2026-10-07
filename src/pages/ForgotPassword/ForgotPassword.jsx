import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to request password reset."
        );
      }

      setSuccess(data.message);
      setEmail("");
    } catch (error) {
      console.error("Forgot Password Error:", error);
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
            Forgot Password
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Enter your email and we'll send you a secure reset link.
          </p>
        </div>

        <motion.div
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          whileHover={{
            borderColor: "rgba(255,255,255,0.16)",
          }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-sm text-white/60"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 text-sm leading-6 text-emerald-300">
                {success}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white py-3.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
            >
              <span>
                {loading ? "Sending..." : "Send Reset Link"}
              </span>
              {!loading && <ArrowRight size={17} />}
            </motion.button>
          </form>

          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
            >
              <ArrowLeft size={15} />
              Back to Login
            </Link>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-[11px] text-white/20">
          Discover. Connect. Watch. — CineMate
        </p>
      </motion.div>
    </main>
  );
};

export default ForgotPassword;
