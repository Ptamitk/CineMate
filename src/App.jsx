
import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import Lenis from "lenis";

import Navbar from "./components/common/Navbar";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Home from "./pages/Home/Home";

import Movies from "./pages/Movies/Movies";
import MovieDetails from "./pages/MovieDetails/MovieDetails";

import TVShows from "./pages/TVShows/TVShows";
import TVDetails from "./pages/TVDetails/TVDetails";

import PersonDetails from "./pages/PersonDetails/PersonDetails";

import Search from "./pages/Search/Search";

import Profile from "./pages/Profile/Profile";
import Social from "./pages/Social/Social";
import Chat from "./pages/Chat/Chat";

import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

import Watchlist from "./pages/Watchlist/Watchlist";
import SavedPosts from "./pages/SavedPosts/SavedPosts";
import Notifications from "./pages/Notifications/Notifications";
import SceneFinder from "./pages/SceneFinder/SceneFinder";

import { useAuth } from "./context/AuthContext";

function AppContent() {
  const navigate = useNavigate();

  const {
    telegramSearchResult,
  } = useAuth();

  /* =========================
     LENIS
  ========================= */

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    window.lenis = lenis;

    let animationFrame;

    const raf = (time) => {
      lenis.raf(time);

      animationFrame =
        requestAnimationFrame(raf);
    };

    animationFrame =
      requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      lenis.destroy();

      window.lenis = null;
    };
  }, []);

  /* =========================
     TELEGRAM → SEARCH PAGE
  ========================= */

  useEffect(() => {
    if (
      !telegramSearchResult?.query
    ) {
      return;
    }

    const telegramQuery =
      telegramSearchResult.query.trim();

    if (!telegramQuery) {
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(
        telegramQuery
      )}`
    );
  }, [
    telegramSearchResult,
    navigate,
  ]);

  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/movies"
          element={<Movies />}
        />

        <Route
          path="/movie/:id"
          element={<MovieDetails />}
        />

        <Route
          path="/tv-shows"
          element={<TVShows />}
        />

        <Route
          path="/tv/:id"
          element={<TVDetails />}
        />

        <Route
          path="/person/:id"
          element={<PersonDetails />}
        />

        <Route
          path="/search"
          element={<Search />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/social"
            element={<Social />}
          />

          <Route
            path="/chat"
            element={<Chat />}
          />

          <Route
            path="/watchlist"
            element={<Watchlist />}
          />
        </Route>

        <Route
          path="/saved-posts"
          element={<SavedPosts />}
        />

        <Route
          path="/notifications"
          element={<Notifications />}
        />

        <Route
          path="/scene-finder"
          element={<SceneFinder />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

