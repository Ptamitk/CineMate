import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Camera,
  Check,
  Circle,
  Film,
  Link2,
  Loader2,
  Search,
  Send,
  Sparkles,
  Star,
  Tv,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const steps = [
  { icon: Camera, title: "Scanning", text: "Sampling the scene across the video." },
  { icon: Search, title: "Reading clues", text: "Combining OCR, dialogue and metadata." },
  { icon: Film, title: "Visual match", text: "Comparing scene frames with cinematic artwork." },
  { icon: Sparkles, title: "Ranking", text: "Cross-checking movie and TV candidates." },
];

const getAuthToken = () => {
  try {
    return JSON.parse(localStorage.getItem("cinemate_auth") || "{}")?.token || "";
  } catch {
    return "";
  }
};

const normalizeResult = (result) => ({
  contentId: result?.contentId ?? null,
  type: result?.contentType === "tv" ? "tv" : "movie",
  title: result?.title || "Scene Identified",
  year: result?.year || (result?.releaseDate ? String(result.releaseDate).slice(0, 4) : "—"),
  rating: result?.rating || "—",
  confidence: typeof result?.confidence === "number" ? result.confidence : null,
  image: result?.image || "",
  evidenceType: result?.evidenceType || "",
  sceneScore: typeof result?.sceneScore === "number" ? result.sceneScore : null,
});

const SceneFinder = () => {
  const { telegramSceneResult, clearTelegramSceneResult } = useAuth();
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState(null);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [telegram, setTelegram] = useState(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramAction, setTelegramAction] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState("");

  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchTelegramStatus = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setTelegramLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/telegram-account/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load Telegram status.");
      setTelegram(data);
    } catch (e) {
      setTelegramMessage(e.message || "Unable to load Telegram connection.");
    } finally {
      setTelegramLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelegramStatus();
    const timer = setInterval(fetchTelegramStatus, 15000);
    return () => clearInterval(timer);
  }, [fetchTelegramStatus]);

  useEffect(() => {
    if (!telegramSceneResult) return;

    const incoming = telegramSceneResult;
    if (incoming.status === "processing" || incoming.status === "pending") {
      stopPolling();
      setSearching(true);
      setStep(0);
      setJobId(incoming.jobId || null);
      setResult(null);
      setError("");
    } else {
      stopPolling();
      setSearching(false);
      setJobId(incoming.jobId || null);
      if (incoming.status === "completed" && incoming.result?.title) {
        setResult(normalizeResult(incoming.result));
        setError("");
      } else {
        setResult(null);
        setError(incoming.error || "No confident movie or TV match was found.");
      }
    }

    clearTelegramSceneResult();
  }, [telegramSceneResult, clearTelegramSceneResult, stopPolling]);

  useEffect(() => {
    if (!searching) {
      setStep(0);
      return;
    }

    const timer = setInterval(() => {
      setStep((value) => (value + 1) % steps.length);
    }, 2200);

    return () => clearInterval(timer);
  }, [searching]);

  const pollStatus = useCallback(async (id, token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scene-finder/status/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          stopPolling();
          setSearching(false);
          setError("Your session has expired. Please login again.");
          return;
        }
        throw new Error(data.message || "Unable to read Scene Finder status.");
      }

      const job = data.job;
      if (!job) throw new Error("Invalid Scene Finder response.");

      if (job.status === "completed") {
        stopPolling();
        localStorage.removeItem("cinemate_scene_finder_job");
        setSearching(false);
        setJobId(null);

        if (job.result?.title) {
          setResult(normalizeResult(job.result));
          setError("");
        } else {
          setResult(null);
          setError(job.error || "No confident movie or TV match was found.");
        }
        return;
      }

      if (job.status === "failed") {
        stopPolling();
        localStorage.removeItem("cinemate_scene_finder_job");
        setSearching(false);
        setJobId(null);
        setResult(null);
        setError(job.error || "Scene analysis failed. Please try again.");
        return;
      }

      setSearching(true);
    } catch (e) {
      console.error("Scene Finder polling error:", e);
      setSearching(true);
    }
  }, [stopPolling]);

  const startPolling = useCallback((id, token) => {
    stopPolling();

    const tick = async () => {
      await pollStatus(id, token);
      if (pollRef.current) pollRef.current = setTimeout(tick, 2500);
    };

    pollRef.current = setTimeout(tick, 0);
  }, [pollStatus, stopPolling]);

  useEffect(() => {
    const storedJob = localStorage.getItem("cinemate_scene_finder_job");
    const token = getAuthToken();

    if (storedJob && token) {
      setJobId(storedJob);
      setSearching(true);
      startPolling(storedJob, token);
    }

    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const selectVideo = (file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("Video file must be smaller than 100 MB.");
      return;
    }

    setVideo(file);
    setUrl("");
    setResult(null);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    const cleanUrl = url.trim();
    if (!cleanUrl && !video) {
      setError("Paste a video/Reel URL or upload a scene video.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Please login before using Scene Finder.");
      return;
    }

    stopPolling();
    setSearching(true);
    setStep(0);
    setResult(null);
    setError("");

    try {
      const body = new FormData();
      if (cleanUrl) body.append("reelUrl", cleanUrl);
      if (video) body.append("video", video);

      const response = await fetch(
        `${API_BASE_URL}/api/scene-finder/analyze`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to start analysis.");

      const id = data.job?.id;
      if (!id) throw new Error("Scene analysis job ID was not returned.");

      setJobId(id);
      localStorage.setItem("cinemate_scene_finder_job", id);
      startPolling(id, token);
    } catch (e) {
      stopPolling();
      setSearching(false);
      setError(e.message || "Something went wrong while analyzing the scene.");
    }
  };

  const disconnectTelegram = async () => {
    const token = getAuthToken();
    if (!token) return;

    setTelegramAction(true);
    setTelegramMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/telegram-account/disconnect`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to disconnect Telegram.");
      setTelegram(data);
      setTelegramMessage("Telegram disconnected.");
    } catch (e) {
      setTelegramMessage(e.message || "Unable to disconnect Telegram.");
    } finally {
      setTelegramAction(false);
    }
  };

  const generateCode = async () => {
    const token = getAuthToken();
    if (!token) return;

    setTelegramAction(true);
    setTelegramMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/telegram-account/generate-code`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to generate pairing code.");

      setTelegram((current) => ({
        ...(current || {}),
        connected: false,
        pairingCodeActive: true,
        pairingCodeExpiresAt: data.expiresAt,
        pairingCode: data.code,
      }));
      setTelegramMessage("Code generated. Send it to the CineMate Telegram bot.");
    } catch (e) {
      setTelegramMessage(e.message || "Unable to generate pairing code.");
    } finally {
      setTelegramAction(false);
    }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-24 pt-28 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] px-5 py-12 shadow-2xl sm:px-8 sm:py-16 lg:px-14">
          <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-white/[0.06] blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-[130px]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/55">
                <Sparkles size={14} />
                CineMate Scene Finder
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Deep recognition
              </div>

              <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Find the title
                <span className="block text-white/35">behind any scene.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
                Upload a clip or paste a public video/Reel URL. CineMate cross-checks
                on-screen text, dialogue, visual frames and cinematic artwork before
                returning a confident movie or TV match.
              </p>

              <div className="mt-7 flex flex-wrap gap-2 text-[11px] text-white/40">
                {["Movie", "TV series", "Instagram Reel", "Video URL", "Upload"].map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-black/50 p-2 shadow-2xl backdrop-blur-xl">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  <Link2 size={18} className="shrink-0 text-white/35" />
                  <input
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (e.target.value) {
                        setVideo(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }
                      setError("");
                    }}
                    disabled={Boolean(video) || searching}
                    placeholder="Paste Instagram Reel or video URL..."
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-white/20 sm:text-base"
                    aria-label="Video or Instagram Reel URL"
                  />
                  {url && !searching && (
                    <button type="button" onClick={() => setUrl("")} className="text-white/30 hover:text-white" aria-label="Clear URL">
                      <X size={17} />
                    </button>
                  )}
                </div>

                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/20">or</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  className="hidden"
                  onChange={(e) => selectVideo(e.target.files?.[0])}
                />

                {video ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black">
                        <Film size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white/80">{video.name}</p>
                        <p className="mt-1 text-[11px] text-white/30">
                          {(video.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVideo(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={searching}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/45 transition hover:border-white/25 hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                  >
                    <Upload size={17} />
                    Upload scene video
                  </button>
                )}

                <button
                  type="submit"
                  disabled={searching || (!url.trim() && !video)}
                  className="mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-[0_15px_45px_rgba(255,255,255,0.16)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {searching ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Analyzing scene...
                    </>
                  ) : (
                    <>
                      Identify Scene
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="relative mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {searching && (
            <div className="relative mt-8 rounded-3xl border border-white/10 bg-black/35 p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <CurrentIcon size={20} className="animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{steps[step].title}</p>
                      <p className="mt-1 text-xs text-white/35">{steps[step].text}</p>
                    </div>
                    {jobId && (
                      <span className="hidden rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/25 sm:block">
                        Job {String(jobId).slice(-8)}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-1.5">
                    {steps.map((item, index) => (
                      <div key={item.title} className={`h-1 rounded-full transition-all duration-500 ${index <= step ? "bg-white" : "bg-white/10"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/25">Recognition engine</p>
                <h2 className="mt-2 text-2xl font-semibold">Built for difficult clips.</h2>
              </div>
              <Zap size={20} className="text-white/45" />
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["OCR", "Reads title cards, subtitles and visible text."],
                ["Dialogue", "Uses speech as an independent clue."],
                ["Visual", "Compares multiple frames, not one thumbnail."],
                ["Artwork", "Cross-checks against TMDB movie/TV imagery."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center gap-2">
                    <Circle size={7} className="fill-white/50 text-white/50" />
                    <p className="text-sm font-medium">{title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/35">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/25">Telegram</p>
                <h2 className="mt-2 text-2xl font-semibold">Scene Finder Bot</h2>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${telegram?.connected ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-white/10 bg-white/[0.04]"}`}>
                <Send size={19} className={telegram?.connected ? "text-emerald-300" : "text-white/50"} />
              </div>
            </div>

            {telegramLoading ? (
              <div className="mt-6 flex items-center gap-2 text-xs text-white/35">
                <Loader2 size={14} className="animate-spin" />
                Checking Telegram connection...
              </div>
            ) : telegram?.connected ? (
              <div className="mt-6">
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                    <Check size={16} />
                    Connected
                  </div>
                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <p className="text-white/25">Bot</p>
                      <p className="mt-1 text-white/65">@{telegram.bot?.username || "CineMate"}</p>
                    </div>
                    <div>
                      <p className="text-white/25">Chat ID</p>
                      <p className="mt-1 truncate font-mono text-white/50">{telegram.chatId || "Connected"}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={disconnectTelegram}
                  disabled={telegramAction}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.03] px-4 py-3 text-xs font-medium text-red-300 transition hover:bg-red-400/[0.07] disabled:opacity-40"
                >
                  {telegramAction ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Disconnect Telegram
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-xs leading-5 text-white/35">
                  Connect Telegram to send Reel links and searches directly to CineMate.
                </p>

                {telegram?.pairingCodeActive && telegram.pairingCode && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Pairing code</p>
                    <p className="mt-2 font-mono text-2xl font-bold tracking-[0.18em]">{telegram.pairingCode}</p>
                    <p className="mt-2 text-[11px] text-white/30">Send /connect {telegram.pairingCode} to the CineMate bot.</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={generateCode}
                  disabled={telegramAction}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black disabled:opacity-40"
                >
                  {telegramAction ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                  Generate Telegram Code
                </button>
              </div>
            )}

            {telegramMessage && (
              <p className="mt-3 text-[11px] text-white/40">{telegramMessage}</p>
            )}

            {telegram?.bot?.username && (
              <a
                href={`https://t.me/${telegram.bot.username}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs text-white/50 hover:text-white"
              >
                <Send size={14} />
                Open Telegram Bot
              </a>
            )}
          </div>
        </section>

        {result && (
          <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
            <div className="grid lg:grid-cols-[280px_1fr]">
              <div className="relative min-h-[360px] bg-black">
                {result.image ? (
                  <img src={result.image} alt={result.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <Film size={42} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/50">
                    {result.type === "tv" ? "TV Series" : "Movie"}
                  </span>
                  {result.evidenceType && (
                    <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-white/35">
                      {result.evidenceType.replace(/-/g, " ")}
                    </span>
                  )}
                </div>

                <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{result.title}</h2>

                <div className="mt-4 flex flex-wrap gap-5 text-sm text-white/40">
                  <span>{result.year}</span>
                  {result.rating !== "—" && (
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="fill-white/50" />
                      {result.rating}
                    </span>
                  )}
                  {result.confidence !== null && <span>{result.confidence}% confidence</span>}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Scene confidence</p>
                    <p className="mt-2 text-2xl font-semibold">{result.confidence ?? "—"}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">Match score</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {result.sceneScore !== null ? Math.round(result.sceneScore * 100) : "—"}%
                    </p>
                  </div>
                </div>

                {result.contentId && (
                  <Link
                    to={result.type === "tv" ? `/tv/${result.contentId}` : `/movie/${result.contentId}`}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5"
                  >
                    Open Full Details
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/20">
          <Tv size={13} />
          <span>Movie + TV recognition • UI optimized for desktop, tablet and mobile</span>
        </div>
      </div>
    </main>
  );
};

export default SceneFinder;
