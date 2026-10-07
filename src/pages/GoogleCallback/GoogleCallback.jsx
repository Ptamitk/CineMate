import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    const completeLogin = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to complete Google sign-in."
          );
        }

        login({
          ...data.user,
          token,
        });
      } catch (error) {
        console.error("Google Callback Error:", error);
        setError(
          error.message ||
            "Google sign-in failed. Please try again."
        );
      }
    };

    completeLogin();
  }, []);

  if (error) {
    return <Navigate to={"/login?google_error=" + encodeURIComponent(error)} replace />;
  }

  if (searchParams.get("token")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <LoaderCircle size={42} className="mx-auto animate-spin text-white/60" />
          <p className="mt-5 text-sm text-white/50">
            Completing Google sign-in...
          </p>
        </div>
      </main>
    );
  }

  return <Navigate to="/login" replace />;
};

export default GoogleCallback;
