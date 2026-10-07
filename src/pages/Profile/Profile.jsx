
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Bookmark,
  Camera,
  Check,
  Film,
  Mail,
  Pencil,
  Send,
  User,
  X,
  HelpCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getWatchlist } from "../../utils/watchlist";

const Profile = () => {
  const { user, token, updateUser } = useAuth();

  const [profile, setProfile] = useState(user);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [selectedImage, setSelectedImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] =
    useState("");

  const [telegramCode, setTelegramCode] =
    useState("");

  const [telegramLoading, setTelegramLoading] =
    useState(false);

  const [telegramError, setTelegramError] =
    useState("");

  const [telegramSuccess, setTelegramSuccess] =
    useState("");

  const [telegramConnected, setTelegramConnected] =
    useState(false);
  const [telegramBot, setTelegramBot] = useState(null);
  const [telegramStatusLoading, setTelegramStatusLoading] =
    useState(true);
  const [telegramDisconnecting, setTelegramDisconnecting] =
    useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);
  const telegramStatusRequestRef = useRef(0);

  const watchlistCount = useMemo(() => {
    return getWatchlist().length;
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/users/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch profile."
          );
        }

        setProfile(data.user);
        updateUser(data.user);
      } catch (error) {
        console.error(
          "Profile Fetch Error:",
          error
        );
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token, updateUser]);

  const fetchTelegramStatus = async () => {
    if (!token) return;

    const requestId = ++telegramStatusRequestRef.current;

    try {
      const response = await fetch(
        "http://localhost:5000/api/telegram-account/status",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch Telegram status."
        );
      }

      // Ignore an older polling response that started before a disconnect.
      if (requestId !== telegramStatusRequestRef.current) return;

      setTelegramConnected(Boolean(data.connected));
      setTelegramBot(data.bot || null);
    } catch (error) {
      console.error("Telegram Status Error:", error);
      setTelegramError(
        error.message || "Unable to check Telegram connection."
      );
    } finally {
      setTelegramStatusLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    fetchTelegramStatus();

    const interval = setInterval(() => {
      fetchTelegramStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [token]);

  const handleDisconnectTelegram = async () => {
    try {
      setTelegramDisconnecting(true);
      // Invalidate any in-flight status request so it cannot restore
      // the connected state after a successful disconnect.
      telegramStatusRequestRef.current += 1;
      setTelegramError("");
      setTelegramSuccess("");

      const response = await fetch(
        "http://localhost:5000/api/telegram-account/disconnect",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to disconnect Telegram."
        );
      }

      setTelegramConnected(false);
      setTelegramCode("");
      setTelegramSuccess("Telegram disconnected successfully.");
    } catch (error) {
      console.error("Telegram Disconnect Error:", error);
      setTelegramError(
        error.message || "Unable to disconnect Telegram."
      );
    } finally {
      setTelegramDisconnecting(false);
    }
  };

  const displayName =
    profile?.name?.trim() ||
    "CineMate User";

  const email =
    profile?.email?.trim() ||
    "No email available";

  const initial = displayName
    .charAt(0)
    .toUpperCase();

  const handleEditProfile = () => {
    setEditName(profile?.name || "");
    setSelectedImage(null);
    setImagePreview(
      profile?.profilePicture || ""
    );
    setProfileError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName("");
    setSelectedImage(null);
    setImagePreview("");
    setProfileError("");
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileError(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError(
        "Image size must be less than 5MB."
      );
      return;
    }

    setProfileError("");
    setSelectedImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileError(
        "Name is required."
      );
      return;
    }

    if (editName.trim().length < 2) {
      setProfileError(
        "Name must be at least 2 characters."
      );
      return;
    }

    try {
      setSaving(true);
      setProfileError("");

      const formData = new FormData();

      formData.append(
        "name",
        editName.trim()
      );

      if (selectedImage) {
        formData.append(
          "profilePicture",
          selectedImage
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/users/me",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update profile."
        );
      }

      setProfile(data.user);
      updateUser(data.user);

      setIsEditing(false);
      setEditName("");
      setSelectedImage(null);
      setImagePreview("");
    } catch (error) {
      console.error(
        "Profile Update Error:",
        error
      );

      setProfileError(
        error.message ||
          "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTelegramCode =
    async () => {
      try {
        setTelegramLoading(true);
        setTelegramError("");
        setTelegramSuccess("");
        setTelegramCode("");

        const response = await fetch(
          "http://localhost:5000/api/telegram-account/generate-code",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to generate Telegram code."
          );
        }

        setTelegramCode(data.code);
        setTelegramSuccess(
          "Pairing code generated. Send it to the CineMate Telegram bot to connect."
        );
      } catch (error) {
        console.error(
          "Telegram Pairing Error:",
          error
        );

        setTelegramError(
          error.message ||
            "Unable to generate Telegram pairing code."
        );
      } finally {
        setTelegramLoading(false);
      }
    };

  return (
    <main className="min-h-screen bg-black px-5 pb-20 pt-32 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">

        {/* =========================
            PROFILE HEADER
        ========================= */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">

          <div className="h-32 bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent sm:h-44" />

          <div className="relative px-6 pb-8 sm:px-8 lg:px-10">

            {/* AVATAR */}

            <div className="relative -mt-12 h-24 w-24 sm:-mt-14 sm:h-28 sm:w-28">

              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black text-3xl font-bold shadow-2xl sm:text-4xl">

                {profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={`${displayName} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}

              </div>

            </div>

            {/* USER INFO */}

            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  CineMate Profile
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  {displayName}
                </h1>

                <div className="mt-3 flex items-center gap-2 text-sm text-white/40">
                  <Mail size={15} />

                  <span className="break-all">
                    {email}
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={handleEditProfile}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                <Pencil size={16} />
                Edit Profile
              </button>

            </div>

          </div>

        </section>

        {/* =========================
            EDIT PROFILE
        ========================= */}

        {isEditing && (
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Account
                </p>

                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Edit Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Close edit profile"
              >
                <X size={18} />
              </button>

            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr]">

              {/* IMAGE */}

              <div className="flex flex-col items-center">

                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-white/15 bg-black text-4xl font-bold">

                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initial
                  )}

                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/80 text-white backdrop-blur-md transition hover:bg-white hover:text-black"
                  >
                    <Camera size={17} />

                    <input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={
                        handleImageChange
                      }
                      className="hidden"
                    />
                  </label>

                </div>

                <p className="mt-3 text-center text-xs text-white/30">
                  JPG, PNG or WebP
                  <br />
                  Max 5MB
                </p>

              </div>

              {/* FORM */}

              <div className="space-y-5">

                <div>

                  <label
                    htmlFor="profile-name"
                    className="mb-2 block text-sm font-medium text-white/60"
                  >
                    Name
                  </label>

                  <input
                    id="profile-name"
                    type="text"
                    value={editName}
                    onChange={(event) =>
                      setEditName(
                        event.target.value
                      )
                    }
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                  />

                </div>

                {profileError && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
                    {profileError}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      handleCancelEdit
                    }
                    disabled={saving}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSaveProfile
                    }
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={17} />
                        Save Changes
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>

          </section>
        )}

        {/* =========================
            STATS
        ========================= */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Bookmark size={18} />
              </div>

              <div>

                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Watchlist
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {watchlistCount}
                </p>

              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Film size={18} />
              </div>

              <div>

                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Watched
                </p>

                <p className="mt-1 text-2xl font-bold">
                  0
                </p>

              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <User size={18} />
              </div>

              <div>

                <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                  Account
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Active
                </p>

              </div>

            </div>
          </div>

        </section>

        {/* =========================
            TELEGRAM
        ========================= */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                CineMate Control
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold sm:text-3xl">Telegram</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  telegramConnected
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.04] text-white/40"
                }`}>
                  {telegramStatusLoading
                    ? "Checking..."
                    : telegramConnected
                      ? "Connected"
                      : "Disconnected"}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
                Connect your Telegram account with CineMate to search movies and TV shows from Telegram and receive the results inside CineMate.
              </p>
              {telegramBot?.username && (
                <p className="mt-3 text-xs text-white/30">
                  Bot: <span className="text-white/60">@{telegramBot.username}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowTelegramGuide((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.1]"
              >
                <HelpCircle size={16} />
                How to Connect
              </button>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Send size={23} />
              </div>
            </div>
          </div>

          {showTelegramGuide && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">Telegram Setup</p>
              <h3 className="mt-2 text-xl font-bold">Connect in a few steps</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4"><span className="text-xs text-white/30">01</span><p className="mt-2 text-sm font-semibold">Generate a code</p><p className="mt-1 text-xs leading-5 text-white/40">Click Generate Code and copy your temporary pairing code.</p></div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4"><span className="text-xs text-white/30">02</span><p className="mt-2 text-sm font-semibold">Open Telegram</p><p className="mt-1 text-xs leading-5 text-white/40">Open the CineMate Telegram bot.</p></div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4"><span className="text-xs text-white/30">03</span><p className="mt-2 text-sm font-semibold">Send the command</p><p className="mt-1 text-xs leading-5 text-white/40">Send <span className="font-mono text-white/60">/connect YOUR_CODE</span> to the bot.</p></div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4"><span className="text-xs text-white/30">04</span><p className="mt-2 text-sm font-semibold">You are connected</p><p className="mt-1 text-xs leading-5 text-white/40">This page automatically updates to Connected.</p></div>
              </div>
            </div>
          )}

          <div className="mt-7 rounded-2xl border border-white/10 bg-black/30 p-5 sm:p-6">
            {telegramConnected ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-300">Telegram is connected</p>
                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Your Telegram searches are linked to this CineMate account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnectTelegram}
                  disabled={telegramDisconnecting}
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {telegramDisconnecting ? "Disconnecting..." : "Disconnect Telegram"}
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Connect your Telegram</p>
                    <p className="mt-1 text-xs leading-5 text-white/35">
                      Generate a temporary code, then send <span className="font-mono text-white/60">/connect YOUR_CODE</span> to the CineMate Telegram bot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateTelegramCode}
                    disabled={telegramLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {telegramLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Generate Code
                      </>
                    )}
                  </button>
                </div>

                {telegramCode && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-xs uppercase tracking-[0.15em] text-white/30">Your pairing code</p>
                    <p className="mt-3 break-all font-mono text-2xl font-bold tracking-[0.2em] text-white sm:text-3xl">{telegramCode}</p>
                    <p className="mt-3 text-xs leading-5 text-white/35">Expires in 10 minutes. Send <span className="font-mono text-white/60">/connect {telegramCode}</span> to the bot.</p>
                  </div>
                )}
              </>
            )}

            {telegramSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-3 text-sm text-emerald-300">{telegramSuccess}</div>
            )}
            {telegramError && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">{telegramError}</div>
            )}
          </div>
        </section>

        {/* =========================
            PROFILE INFORMATION
        ========================= */}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

          <div className="mb-8">

            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
              Account
            </p>

            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Profile Information
            </h2>

          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">

              <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                Name
              </p>

              <p className="mt-2 text-base font-medium">
                {displayName}
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">

              <p className="text-xs uppercase tracking-[0.15em] text-white/30">
                Email
              </p>

              <p className="mt-2 break-all text-base font-medium">
                {email}
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
};

export default Profile;

