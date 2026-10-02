
import { useEffect, useState } from "react";
import {
  Link,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import {
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage(
        "Verification token is missing."
      );
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/auth/verify-email?token=${encodeURIComponent(
            token
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Email verification failed."
          );
        }

        setStatus("success");
        setMessage(data.message);

        // Remove verification token from URL
        navigate("/verify-email", {
          replace: true,
        });
      } catch (error) {
        console.error(
          "Email Verification Error:",
          error
        );

        setStatus("error");
        setMessage(
          error.message ||
            "Unable to verify your email."
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-20 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl sm:p-10">

        {/* LOADING */}
        {status === "loading" && (
          <>
            <LoaderCircle
              size={48}
              className="mx-auto animate-spin text-white/70"
            />

            <h1 className="mt-6 text-2xl font-semibold">
              Verifying your email...
            </h1>

            <p className="mt-3 text-sm text-white/40">
              Please wait while we verify your
              CineMate account.
            </p>
          </>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <>
            <CheckCircle2
              size={52}
              className="mx-auto text-white"
            />

            <h1 className="mt-6 text-2xl font-semibold">
              Email verified
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/45">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
            >
              Go to Login
            </Link>
          </>
        )}

        {/* ERROR */}
        {status === "error" && (
          <>
            <XCircle
              size={52}
              className="mx-auto text-white/70"
            />

            <h1 className="mt-6 text-2xl font-semibold">
              Verification failed
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/45">
              {message}
            </p>

            <Link
              to="/login"
              className="mt-8 inline-flex rounded-xl border border-white/10 bg-white/[0.06] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to Login
            </Link>
          </>
        )}

      </div>
    </main>
  );
};

export default VerifyEmail;

