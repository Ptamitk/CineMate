
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const Signup = () => {
  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      setError(
        "Please fill in all the fields."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create account."
        );
      }

      setSuccess(true);

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(
        "Signup Error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong during signup."
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldAnimation = (
    delay,
    direction = -20
  ) => ({
    initial: {
      opacity: 0,
      x: direction,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    transition: {
      delay,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-32 text-white">

      {/* CINEMATIC BACKGROUND */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-3xl"
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.35, 0.7, 0.35],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -left-40 top-1/4 h-80 w-80 rounded-full bg-fuchsia-500/[0.05] blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -60, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="pointer-events-none absolute -right-40 bottom-1/4 h-80 w-80 rounded-full bg-cyan-500/[0.05] blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 70, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* CONTENT */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{
          opacity: 0,
          y: 60,
          scale: 0.94,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
      >

        {/* HEADER */}
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
              letterSpacing: "0.05em",
            }}
            animate={{
              letterSpacing: "0.3em",
            }}
            transition={{
              delay: 0.2,
              duration: 1,
            }}
          >
            Join CineMate
          </motion.p>

          <motion.h1
            className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.3,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            Create Account
          </motion.h1>

          <motion.p
            className="mt-3 text-sm text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.45,
            }}
          >
            Start your personalized entertainment journey.
          </motion.p>
        </motion.div>

        {/* CARD */}
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.25,
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{
            borderColor:
              "rgba(255,255,255,0.16)",
            boxShadow:
              "0 25px 90px rgba(255,255,255,0.04)",
          }}
        >

          {/* MOVING SHINE */}
          <motion.div
            className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
            animate={{
              x: ["0%", "400%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut",
            }}
          />

          {success ? (
            <div className="relative py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-2xl">
                ✓
              </div>

              <h2 className="mt-6 text-2xl font-semibold">
                Account Created
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/45">
                Your account has been created successfully.
                Please check your email and click the
                verification link to activate your account.
              </p>

              <p className="mt-5 text-xs text-white/25">
                Check your Spam or Promotions folder if you
                don't see the email.
              </p>

              <Link
                to="/login"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Go to Login
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <form
                className="relative space-y-5"
                onSubmit={handleSubmit}
              >

                {/* NAME */}
                <motion.div
                  {...fieldAnimation(0.4, -20)}
                >
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-white/60"
                  >
                    Full Name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                    />

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(
                          event.target.value
                        )
                      }
                      placeholder="Enter your name"
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] focus:shadow-[0_0_25px_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </motion.div>

                {/* EMAIL */}
                <motion.div
                  {...fieldAnimation(0.5, 20)}
                >
                  <label
                    htmlFor="email"
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
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="Enter your email"
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] focus:shadow-[0_0_25px_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </motion.div>

                {/* PASSWORD */}
                <motion.div
                  {...fieldAnimation(0.6, -20)}
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
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder="Create a password"
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] focus:shadow-[0_0_25px_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <motion.button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      whileHover={{
                        scale: 1.1,
                      }}
                      whileTap={{
                        scale: 0.8,
                      }}
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {/* CONFIRM PASSWORD */}
                <motion.div
                  {...fieldAnimation(0.7, 20)}
                >
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm text-white/60"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                    />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Confirm your password"
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-12 text-sm text-white outline-none transition duration-300 placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.06] focus:shadow-[0_0_25px_rgba(255,255,255,0.04)] disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <motion.button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      whileHover={{
                        scale: 1.1,
                      }}
                      whileTap={{
                        scale: 0.8,
                      }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {/* ERROR */}
                {error && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* CREATE ACCOUNT */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white py-3.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.8,
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
                      ? "Creating Account..."
                      : "Create Account"}
                  </span>

                  {!loading && (
                    <ArrowRight
                      size={17}
                      className="relative transition-transform duration-300 group-hover:translate-x-1"
                    />
                  )}
                </motion.button>
              </form>

              {/* LOGIN */}
              <motion.div
                className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-white transition hover:text-white/70"
                >
                  Login
                </Link>
              </motion.div>
            </>
          )}
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

export default Signup;

