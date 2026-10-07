const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || API_BASE_URL + "";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  useEffect(() => {
    const googleError = new URLSearchParams(
      window.location.search
    ).get("google_error");

    if (googleError) {
      setError(googleError);
      window.history.replaceState(
        {},
        document.title,
        "/login"
      );
    }
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "${API_BASE_URL}/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed."
        );
      }

      login({
        ...data.user,
        token: data.token,
      });

      const redirectPath =
        location.state?.from || "/";

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong during login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-32 text-white">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-purple-500/[0.05] blur-3xl"
        animate={{
          x: [0, 80, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-blue-500/[0.05] blur-3xl"
        animate={{
          x: [0, -70, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            duration: 0.7,
          }}
        >
          <motion.p
            className="text-xs uppercase tracking-[0.3em] text-white/30"
            initial={{
              opacity: 0,
              letterSpacing: "0.1em",
            }}
            animate={{
              opacity: 1,
              letterSpacing: "0.3em",
            }}
            transition={{
              delay: 0.2,
              duration: 0.8,
            }}
          >
            Welcome Back
          </motion.p>

          <motion.h1
            className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.7,
            }}
          >
            Login
          </motion.h1>

          <motion.p
            className="mt-3 text-sm text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.45,
              duration: 0.7,
            }}
          >
            Continue your CineMate experience.
          </motion.p>
        </motion.div>

        <motion.div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.25,
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{
            borderColor: "rgba(255,255,255,0.16)",
            boxShadow:
              "0 25px 80px rgba(255,255,255,0.04)",
          }}
        >
          <motion.div
            className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
            animate={{
              x: ["0%", "400%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatDelay: 4,
              ease: "easeInOut",
            }}
          />

          <form
            className="relative space-y-5"
            onSubmit={handleSubmit}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.45,
                duration: 0.5,
              }}
            >
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-white/60"
              >
                Email
              </label>

              <motion.div
                className="relative"
                whileFocus={{ scale: 1.01 }}
              >
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] focus:shadow-[0_0_25px_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.55,
                duration: 0.5,
              }}
            >
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-white/60"
              >
                Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] focus:shadow-[0_0_25px_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
                />

                <motion.button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  whileTap={{ scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </motion.button>
              </div>
            </motion.div>

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <motion.div
              className="flex items-center justify-between gap-4 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              <label className="flex cursor-pointer items-center gap-2 text-white/40">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-black accent-white"
                  disabled={loading}
                />
                Remember me
              </label>

              <Link
                to="/forgot-password"
                className="text-white/50 transition hover:text-white"
              >
                Forgot password?
              </Link>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white py-3.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.75,
                duration: 0.5,
              }}
              whileHover={
                !loading
                  ? {
                      scale: 1.02,
                      boxShadow:
                        "0 0 45px rgba(255,255,255,0.16)",
                    }
                  : {}
              }
              whileTap={
                !loading
                  ? { scale: 0.97 }
                  : {}
              }
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent"
                animate={{
                  x: ["-120%", "120%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />

              <span className="relative">
                {loading
                  ? "Logging in..."
                  : "Login"}
              </span>

              {!loading && (
                <ArrowRight
                  size={17}
                  className="relative transition-transform duration-300 group-hover:translate-x-1"
                />
              )}
            </motion.button>
          </form>

          {/* GOOGLE SIGN IN */}
          <motion.button
            type="button"
            onClick={() => {
              window.location.href =
                "${API_BASE_URL}/auth/google";
            }}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              aria-hidden="true"
              className="shrink-0"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.148 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.247 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.45 16.108 18.96 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.247 4 24 4c-7.682 0-14.238 4.326-17.694 10.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.147 0 9.943-1.973 13.478-5.192l-6.219-5.263C29.183 35.091 26.715 36 24 36c-5.127 0-9.625-3.326-11.196-7.946l-6.522 5.025C9.751 39.556 16.364 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.044 5.545l.003-.002 6.219 5.263C37.196 39.214 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Continue with Google
          </motion.button>

          <motion.div
            className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
          >
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-white transition hover:text-white/70"
            >
              Create account
            </Link>
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-6 text-center text-[11px] text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Discover. Connect. Watch. — CineMate
        </motion.p>
      </motion.div>
    </main>
  );
};

export default Login;
