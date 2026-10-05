import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Film,
  Link2,
  Loader2,
  Search,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const stages = [
  { icon: Camera, title: "Scanning frames", text: "Sampling the clip for useful visual evidence." },
  { icon: Search, title: "Reading clues", text: "Checking OCR, dialogue and title signals." },
  { icon: Film, title: "Matching visuals", text: "Comparing frames with movie and TV artwork." },
  { icon: Sparkles, title: "Cross-checking", text: "Ranking candidates and rejecting weak matches." },
];

const signals = [
  ["OCR", "Subtitles, title cards and visible text"],
  ["Dialogue", "Speech and recognizable lines"],
  ["Visual", "Multiple frames from the actual scene"],
  ["Artwork", "Movie, series and episode imagery"],
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
  seasonNumber: result?.seasonNumber ?? null,
  episodeNumber: result?.episodeNumber ?? null,
  episodeName: result?.episodeName || "",
  timestamp: result?.timestamp ?? result?.sceneTimestamp ?? null,
});

const formatTimestamp = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const total = Math.max(0, Math.round(value));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const SceneFinder = () => {
  const { telegramSceneResult, clearTelegramSceneResult } = useAuth();
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState(null);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const fileRef = useRef(null);
  const pollRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!telegramSceneResult) return;

    const incoming = telegramSceneResult;
    stopPolling();

    if (incoming.status === "processing" || incoming.status === "pending") {
      setSearching(true);
      setStep(0);
      setJobId(incoming.jobId || null);
      setResult(null);
      setError("");
    } else {
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
      setStep((value) => (value + 1) % stages.length);
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

  const CurrentIcon = stages[step].icon;
  const timestamp = formatTimestamp(result?.timestamp);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] px-4 pb-24 pt-28 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#090909] shadow-2xl">
          <div className="pointer-events-none absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-white/[0.045] blur-[130px]" />
          <div className="pointer-events-none absolute -bottom-48 right-0 h-[32rem] w-[32rem] rounded-full bg-white/[0.035] blur-[140px]" />

          <div className="relative grid lg:min-h-[650px] lg:grid-cols-[1fr_0.88fr]">
            <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/45">
                <Sparkles size={13} />
                CineMate Intelligence
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.94] tracking-[-0.045em] sm:text-6xl lg:text-[5.6rem]">
                What movie is
                <span className="block text-white/30">this scene from?</span>
              </h1>

              <p className="mt-7 max-w-xl text-sm leading-7 text-white/40 sm:text-base">
                Give CineMate a scene. It searches across visual frames, dialogue,
                on-screen text and cinematic artwork to find the strongest movie or
                TV match.
              </p>

              <div className="mt-8 flex flex-wrap gap-2">
                {["Movies", "TV Shows", "Reels", "Video URLs"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/35"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative flex items-center border-t border-white/10 bg-black/30 p-4 sm:p-7 lg:border-l lg:border-t-0 lg:p-10">
              <form
                onSubmit={submit}
                className="w-full rounded-[1.75rem] border border-white/10 bg-[#0b0b0b]/90 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
              >
                <div className="rounded-[1.35rem] border border-white/[0.07] bg-white/[0.018] p-5 sm:p-6">
                  <div className="mb-5">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/25">
                      Scene input
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">Start with a clip</h2>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 px-4">
                    <div className="flex items-center gap-3">
                      <Link2 size={17} className="shrink-0 text-white/25" />
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
                        placeholder="Paste a public video or Reel URL"
                        className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-white/20"
                      />
                      {url && !searching && (
                        <button
                          type="button"
                          onClick={() => setUrl("")}
                          className="text-white/25 transition hover:text-white"
                          aria-label="Clear URL"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="text-[9px] uppercase tracking-[0.28em] text-white/20">or</span>
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
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-black">
                        <Film size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white/80">{video.name}</p>
                        <p className="mt-1 text-[10px] text-white/30">
                          {(video.size / 1024 / 1024).toFixed(1)} MB · Ready to analyze
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVideo(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/30 hover:text-white"
                        aria-label="Remove video"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={searching}
                      className="group flex w-full items-center justify-between rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-4 text-left transition hover:border-white/25 hover:bg-white/[0.035] disabled:opacity-40"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black">
                          <Upload size={16} className="text-white/50" />
                        </span>
                        <span>
                          <span className="block text-sm text-white/65">Upload a video</span>
                          <span className="mt-1 block text-[10px] text-white/25">MP4, WebM, MOV or MKV · max 100 MB</span>
                        </span>
                      </span>
                      <ArrowRight size={15} className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/60" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={searching || (!url.trim() && !video)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(255,255,255,0.14)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {searching ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Finding your scene...
                      </>
                    ) : (
                      <>
                        Find this scene
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[10px] text-white/20">
                    Public URLs must be directly accessible by CineMate.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {error && (
            <div className="relative mx-4 mb-4 rounded-2xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3 text-sm text-red-300 sm:mx-7 lg:mx-10">
              {error}
            </div>
          )}

          {searching && (
            <div className="relative border-t border-white/10 bg-black/25 px-5 py-5 sm:px-8 sm:py-6">
              <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <CurrentIcon size={19} className="animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{stages[step].title}</p>
                      <p className="mt-1 text-xs text-white/30">{stages[step].text}</p>
                    </div>
                    {jobId && (
                      <span className="hidden rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/20 sm:block">
                        {String(jobId).slice(-8)}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-1.5">
                    {stages.map((stage, index) => (
                      <div
                        key={stage.title}
                        className={`h-1 rounded-full transition-all duration-500 ${index <= step ? "bg-white" : "bg-white/10"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/25">How it searches</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Four layers of evidence.</h2>
              </div>
              <Zap size={19} className="text-white/30" />
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {signals.map(([title, text], index) => (
                <div
                  key={title}
                  className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.035]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{title}</span>
                    <span className="text-[10px] text-white/15">0{index + 1}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/30">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.045] to-transparent p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/[0.04] blur-3xl" />
            <p className="relative text-[10px] uppercase tracking-[0.22em] text-white/25">Designed for hard clips</p>
            <h2 className="relative mt-2 text-2xl font-semibold tracking-tight">
              No single clue decides the answer.
            </h2>
            <p className="relative mt-4 text-sm leading-6 text-white/35">
              Weak OCR, noisy dialogue or a cropped frame can mislead a recognizer.
              CineMate combines independent evidence and can return no confident match
              instead of forcing a random title.
            </p>
            <div className="relative mt-7 flex items-center gap-2 text-xs text-white/40">
              <CheckCircle2 size={16} className="text-emerald-300/70" />
              Multi-signal verification
            </div>
          </div>
        </section>

        {result && (
          <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#090909] shadow-2xl">
            <div className="grid lg:grid-cols-[360px_1fr]">
              <div className="relative min-h-[420px] bg-black">
                {result.image ? (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/15">
                    <Film size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-5 flex items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] backdrop-blur-md">
                    {result.type === "tv" ? "TV Series" : "Movie"}
                  </span>
                  {timestamp && (
                    <span className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] backdrop-blur-md">
                      Scene {timestamp}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-9 lg:p-12">
                <div className="flex flex-wrap items-center gap-2">
                  {result.evidenceType && (
                    <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-white/40">
                      {result.evidenceType.replace(/-/g, " ")}
                    </span>
                  )}
                  {result.confidence !== null && (
                    <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-1.5 text-[10px] text-emerald-200/80">
                      {result.confidence}% confidence
                    </span>
                  )}
                </div>

                <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                  {result.title}
                </h2>

                {result.type === "tv" && (result.seasonNumber || result.episodeNumber) && (
                  <p className="mt-3 text-sm text-white/45">
                    Season {result.seasonNumber ?? "—"} · Episode {result.episodeNumber ?? "—"}
                    {result.episodeName ? ` · ${result.episodeName}` : ""}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/35">
                  <span>{result.year}</span>
                  {result.rating !== "—" && <span>★ {result.rating}</span>}
                  {result.sceneScore !== null && (
                    <span>Match {Math.round(result.sceneScore * 100)}%</span>
                  )}
                </div>

                <div className="mt-9 h-px bg-white/10" />

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/20">Confidence</p>
                    <p className="mt-2 text-2xl font-semibold">{result.confidence ?? "—"}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-white/20">Evidence</p>
                    <p className="mt-2 text-sm font-medium capitalize text-white/65">
                      {result.evidenceType ? result.evidenceType.replace(/-/g, " ") : "Multi-signal"}
                    </p>
                  </div>
                </div>

                {result.contentId && (
                  <Link
                    to={result.type === "tv" ? `/tv/${result.contentId}` : `/movie/${result.contentId}`}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:shadow-[0_15px_45px_rgba(255,255,255,0.12)]"
                  >
                    Open full details
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mt-7 flex items-center justify-center text-[10px] uppercase tracking-[0.18em] text-white/15">
          Scene Finder · Movie + TV recognition
        </div>
      </div>
    </main>
  );
};

export default SceneFinder;
