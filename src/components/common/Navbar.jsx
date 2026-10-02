
import { useEffect, useState } from "react";

import {
  Bell,
  Bookmark,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
  getUnreadNotificationCount,
} from "../../utils/notifications";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Movies", href: "/movies" },
  { name: "Watchlist", href: "/watchlist" },
  { name: "Social", href: "/social" },
  { name: "Scene Finder", href: "/scene-finder" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnreadNotifications =
      async () => {
        const count =
          await getUnreadNotificationCount();

        setUnreadNotifications(count);
      };

    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }

    fetchUnreadNotifications();

    const interval = setInterval(
      fetchUnreadNotifications,
      30000
    );

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    setUnreadNotifications(0);
    navigate("/");
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const trimmedQuery =
      searchQuery.trim();

    if (!trimmedQuery) {
      navigate("/search");
      return;
    }

    navigate(
      `/search?q=${encodeURIComponent(
        trimmedQuery
      )}`
    );

    setSearchQuery("");
    setIsMenuOpen(false);
  };

  const openSearch = () => {
    navigate("/search");
  };

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    "C";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex h-20 w-full items-center justify-between border-b border-white/10 bg-black/75 px-5 backdrop-blur-xl sm:px-8 lg:px-10">

        {/* ================= LOGO ================= */}

        <Link
          to="/"
          onClick={closeMobileMenu}
          className="group relative flex items-center gap-3"
        >
          <div className="absolute -inset-3 rounded-2xl bg-white/10 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100" />

          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white text-sm font-black text-black transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">
            <span className="absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-black/10 transition-all duration-700 group-hover:left-[130%]" />

            <span className="relative z-10">
              C
            </span>
          </div>

          <span className="relative text-lg font-semibold tracking-tight transition-all duration-300 group-hover:tracking-wider sm:text-xl">
            CineMate
          </span>
        </Link>

        {/* ================= DESKTOP NAV ================= */}

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="group relative px-2 py-3"
            >
              <span className="absolute inset-0 -z-10 scale-75 rounded-xl bg-white/10 opacity-0 blur-xl transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100" />

              <span
                className={`relative flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                  location.pathname ===
                  item.href
                    ? "text-white"
                    : "text-white/55 group-hover:text-white"
                } group-hover:-translate-y-0.5`}
              >
                {item.name ===
                  "Watchlist" && (
                  <Bookmark size={14} />
                )}

                {item.name}
              </span>

              <span
                className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-all duration-400 ease-out ${
                  location.pathname ===
                  item.href
                    ? "w-full"
                    : "w-0 group-hover:w-full"
                }`}
              />

              <span
                className={`absolute -bottom-[4px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] transition-transform duration-300 ${
                  location.pathname ===
                  item.href
                    ? "scale-100"
                    : "scale-0 group-hover:scale-100"
                }`}
              />
            </Link>
          ))}
        </div>

        {/* ================= DESKTOP ACTIONS ================= */}

        <div className="hidden items-center gap-2 md:flex">

          {/* Search */}

          <form
            onSubmit={
              handleSearchSubmit
            }
            className="group flex h-10 w-10 items-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition-all duration-500 focus-within:w-56 focus-within:border-white/25 focus-within:bg-white/10"
          >
            <button
              type="submit"
              aria-label="Search"
              className="flex h-10 w-10 shrink-0 items-center justify-center text-white"
            >
              <Search
                size={19}
                strokeWidth={1.8}
                className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
              />
            </button>

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search CineMate..."
              aria-label="Search CineMate"
              className="w-full min-w-0 bg-transparent pr-4 text-sm text-white outline-none placeholder:text-white/30"
            />
          </form>

          {/* Notification */}

          <button
            type="button"
            onClick={() =>
              navigate("/notifications")
            }
            aria-label="Notifications"
            className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
          >
            <span className="absolute inset-0 scale-0 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-100" />

            <Bell
              size={19}
              strokeWidth={1.8}
              className="relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
            />

            {unreadNotifications > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-black bg-white px-1 text-[10px] font-bold leading-none text-black shadow-[0_0_12px_rgba(255,255,255,0.45)]">
                {unreadNotifications > 99
                  ? "99+"
                  : unreadNotifications}
              </span>
            )}
          </button>

          {/* ================= PROFILE ================= */}

          {isAuthenticated ? (
            <div className="relative ml-1">

              <button
                type="button"
                onClick={() =>
                  setIsProfileOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-label="Open profile menu"
                className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white text-black transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_10px_35px_rgba(255,255,255,0.25)]"
              >
                {user?.profilePicture ? (
                  <img
                    src={
                      user.profilePicture
                    }
                    alt={`${user?.name || "User"} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold">
                    {userInitial}
                  </span>
                )}
              </button>

              {/* PROFILE DROPDOWN */}

              <div
                className={`absolute right-0 top-14 w-60 origin-top-right rounded-2xl border border-white/10 bg-[#0b0b0b]/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
                  isProfileOpen
                    ? "visible translate-y-0 scale-100 opacity-100"
                    : "invisible -translate-y-2 scale-95 opacity-0"
                }`}
              >
                <div className="border-b border-white/10 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-white">
                    {user?.name ||
                      "CineMate User"}
                  </p>

                  <p className="mt-1 truncate text-xs text-white/40">
                    {user?.email}
                  </p>
                </div>

                <Link
                  to="/profile"
                  onClick={() =>
                    setIsProfileOpen(
                      false
                    )
                  }
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  <UserRound size={16} />
                  Profile
                </Link>

                <Link
                  to="/watchlist"
                  onClick={() =>
                    setIsProfileOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  <Bookmark size={16} />
                  Watchlist
                </Link>

                <Link
                  to="/saved-posts"
                  onClick={() =>
                    setIsProfileOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  <Bookmark size={16} />
                  Saved Posts
                </Link>

                <Link
                  to="/notifications"
                  onClick={() =>
                    setIsProfileOpen(
                      false
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  <Bell size={16} />
                  Notifications

                  {unreadNotifications > 0 && (
                    <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                      {unreadNotifications > 99
                        ? "99+"
                        : unreadNotifications}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="group ml-1 flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(255,255,255,0.2)]"
            >
              <UserRound size={16} />
              Login
            </Link>
          )}
        </div>

        {/* ================= MOBILE MENU BUTTON ================= */}

        <button
          type="button"
          aria-label={
            isMenuOpen
              ? "Close menu"
              : "Open menu"
          }
          onClick={() =>
            setIsMenuOpen(
              (prev) => !prev
            )
          }
          className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 md:hidden"
        >
          <span className="absolute inset-0 scale-0 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-100" />

          <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
            {isMenuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </span>
        </button>
      </nav>

      {/* ================= MOBILE MENU ================= */}

      <div
        className={`overflow-hidden border-b border-white/10 bg-black/95 backdrop-blur-xl transition-all duration-500 ease-out md:hidden ${
          isMenuOpen
            ? "max-h-[700px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div
          className={`px-5 py-6 transition-all duration-500 sm:px-8 ${
            isMenuOpen
              ? "translate-y-0"
              : "-translate-y-5"
          }`}
        >

          {/* Mobile User */}

          {isAuthenticated && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white text-black">
                {user?.profilePicture ? (
                  <img
                    src={
                      user.profilePicture
                    }
                    alt={`${user?.name || "User"} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold">
                    {userInitial}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user?.name ||
                    "CineMate User"}
                </p>

                <p className="truncate text-xs text-white/40">
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          {/* Mobile Search */}

          <form
            onSubmit={
              handleSearchSubmit
            }
            className="mb-5 flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 focus-within:border-white/25"
          >
            <Search
              size={18}
              className="shrink-0 text-white/40"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search CineMate..."
              aria-label="Search CineMate"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() =>
                  setSearchQuery("")
                }
                aria-label="Clear search"
                className="text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* Mobile Links */}

          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={
                  closeMobileMenu
                }
                className="group relative overflow-hidden rounded-xl px-4 py-4"
              >
                <span className="absolute inset-0 -translate-x-full bg-white/5 transition-transform duration-300 group-hover:translate-x-0" />

                <span className="relative z-10 flex items-center justify-between">
                  <span
                    className={`flex items-center gap-3 text-base font-medium transition-all duration-300 group-hover:translate-x-2 ${
                      location.pathname ===
                      item.href
                        ? "text-white"
                        : "text-white/70 group-hover:text-white"
                    }`}
                  >
                    {item.name ===
                      "Watchlist" && (
                      <Bookmark
                        size={17}
                      />
                    )}

                    {item.name}
                  </span>

                  <span
                    className={`translate-x-[-10px] text-white transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${
                      location.pathname ===
                      item.href
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    →
                  </span>
                </span>
              </Link>
            ))}

            {/* Saved Posts */}

            {isAuthenticated && (
              <Link
                to="/saved-posts"
                onClick={
                  closeMobileMenu
                }
                className="group relative overflow-hidden rounded-xl px-4 py-4"
              >
                <span className="absolute inset-0 -translate-x-full bg-white/5 transition-transform duration-300 group-hover:translate-x-0" />

                <span className="relative z-10 flex items-center justify-between">
                  <span
                    className={`flex items-center gap-3 text-base font-medium transition-all duration-300 group-hover:translate-x-2 ${
                      location.pathname ===
                      "/saved-posts"
                        ? "text-white"
                        : "text-white/70 group-hover:text-white"
                    }`}
                  >
                    <Bookmark size={17} />
                    Saved Posts
                  </span>

                  <span
                    className={`translate-x-[-10px] text-white transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${
                      location.pathname ===
                      "/saved-posts"
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    →
                  </span>
                </span>
              </Link>
            )}

            {/* Notifications */}

            {isAuthenticated && (
              <Link
                to="/notifications"
                onClick={
                  closeMobileMenu
                }
                className="group relative overflow-hidden rounded-xl px-4 py-4"
              >
                <span className="absolute inset-0 -translate-x-full bg-white/5 transition-transform duration-300 group-hover:translate-x-0" />

                <span className="relative z-10 flex items-center justify-between">
                  <span
                    className={`flex items-center gap-3 text-base font-medium transition-all duration-300 group-hover:translate-x-2 ${
                      location.pathname ===
                      "/notifications"
                        ? "text-white"
                        : "text-white/70 group-hover:text-white"
                    }`}
                  >
                    <Bell size={17} />
                    Notifications

                    {unreadNotifications > 0 && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                        {unreadNotifications > 99
                          ? "99+"
                          : unreadNotifications}
                      </span>
                    )}
                  </span>

                  <span
                    className={`translate-x-[-10px] text-white transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${
                      location.pathname ===
                      "/notifications"
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    →
                  </span>
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Actions */}

          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">

            {/* Search */}

            <button
              type="button"
              onClick={() => {
                openSearch();
                closeMobileMenu();
              }}
              aria-label="Search"
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              <Search
                size={19}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
              />
            </button>

            {/* Notifications */}

            <button
              type="button"
              onClick={() => {
                navigate(
                  "/notifications"
                );
                closeMobileMenu();
              }}
              aria-label="Notifications"
              className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
            >
              <Bell
                size={19}
                className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
              />

              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-black bg-white px-1 text-[9px] font-bold leading-none text-black">
                  {unreadNotifications > 99
                    ? "99+"
                    : unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile */}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={
                    closeMobileMenu
                  }
                  className="group flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10"
                >
                  <UserRound
                    size={17}
                  />
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  aria-label="Logout"
                  className="group flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                aria-label="Login"
                onClick={
                  closeMobileMenu
                }
                className="group flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-1"
              >
                <UserRound
                  size={17}
                />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

