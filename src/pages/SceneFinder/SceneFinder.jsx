
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ArrowRight,
  Camera,
  Clapperboard,
  Film,
  Loader2,
  Search,
  Sparkles,
  Star,
  Tv,
  Upload,
  X,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const analysisSteps = [
  {
    icon: Camera,
    title: "Scanning Scene",
    text: "Analyzing frames from your video...",
  },
  {
    icon: Search,
    title: "Reading Scene Details",
    text: "Looking for titles, text and visual clues...",
  },
  {
    icon: Film,
    title: "Analyzing Dialogue",
    text: "Processing audio and dialogue signals...",
  },
  {
    icon: Sparkles,
    title: "Finding The Match",
    text: "Searching CineMate for the movie or series...",
  },
];

const SceneFinder = () => {
  const {
    telegramSceneResult,
    clearTelegramSceneResult,
  } = useAuth();

  const [reelUrl, setReelUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);

  const pollingRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);


  /* ================= TELEGRAM SCENE RESULT ================= */

  useEffect(() => {
    if (!telegramSceneResult) {
      return;
    }

    /* ================= PROCESSING ================= */

    if (
      telegramSceneResult.status ===
      "processing"
    ) {
      stopPolling();

      setIsSearching(true);
      setAnalysisStep(0);
      const telegramJobId =
        telegramSceneResult.jobId || null;

      setJobId(telegramJobId);

      if (telegramJobId) {
        localStorage.setItem(
          "cinemate_scene_finder_job",
          telegramJobId
        );
      }

      setResult(null);
      setError("");

      clearTelegramSceneResult();

      return;
    }

    /* ================= FINAL RESULT ================= */

    const sceneResult =
      telegramSceneResult.result;

    stopPolling();

    setIsSearching(false);

    setJobId(
      telegramSceneResult.jobId || null
    );

    if (telegramSceneResult.jobId) {
      localStorage.removeItem(
        "cinemate_scene_finder_job"
      );
    }

    setError(
      telegramSceneResult.error || ""
    );

    if (
      telegramSceneResult.status ===
        "completed" &&
      sceneResult?.title
    ) {
      setResult({
        contentId:
          sceneResult.contentId,

        type:
          sceneResult.contentType === "tv"
            ? "tv"
            : "movie",

        title:
          sceneResult.title ||
          "Scene Identified",

        year:
          sceneResult.year ||
          (sceneResult.releaseDate
            ? String(sceneResult.releaseDate).slice(0, 4)
            : "—"),

        rating:
          sceneResult.rating || "—",

        confidence:
          typeof sceneResult.confidence ===
          "number"
            ? sceneResult.confidence
            : null,

        description:
          "CineMate successfully identified the scene from Telegram.",

        image:
          sceneResult.image || "",

        evidenceType:
          sceneResult.evidenceType || "",

        sceneScore:
          typeof sceneResult.sceneScore === "number"
            ? sceneResult.sceneScore
            : null,
      });
    } else if (
      telegramSceneResult.status ===
      "completed"
    ) {
      setResult(null);

      setError(
        telegramSceneResult.error ||
          "No confident scene match was found."
      );
    } else if (
      telegramSceneResult.status ===
      "failed"
    ) {
      setResult(null);

      setError(
        telegramSceneResult.error ||
          "Scene analysis failed. Please try again."
      );
    }

    clearTelegramSceneResult();
  }, [
    telegramSceneResult,
    clearTelegramSceneResult,
    stopPolling,
  ]);

  /* ================= ANALYSIS STEP ANIMATION ================= */

  useEffect(() => {
    if (!isSearching) {
      setAnalysisStep(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setAnalysisStep((currentStep) => {
        if (
          currentStep >=
          analysisSteps.length - 1
        ) {
          return 0;
        }

        return currentStep + 1;
      });
    }, 2500);

    return () => {
      clearInterval(stepInterval);
    };
  }, [isSearching]);

  const handleVideoChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("video/")) {
      setError(
        "Please select a valid video file."
      );
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError(
        "Video file must be smaller than 100 MB."
      );
      return;
    }

    setVideoFile(file);
    setReelUrl("");
    setError("");
    setResult(null);
  };

  const removeVideo = () => {
    setVideoFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const checkJobStatus = useCallback(async (
    currentJobId,
    token
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/scene-finder/status/${currentJobId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          stopPolling();
          localStorage.removeItem(
            "cinemate_scene_finder_job"
          );
          setIsSearching(false);
          setJobId(null);
          setError(
            "Your session has expired. Please login again."
          );
          return;
        }

        if (response.status === 404) {
          stopPolling();
          localStorage.removeItem(
            "cinemate_scene_finder_job"
          );
          setIsSearching(false);
          setJobId(null);
          setError(
            data.message ||
              "This Scene Finder job is no longer available."
          );
          return;
        }

        throw new Error(
          data.message ||
            "Failed to fetch scene analysis status."
        );
      }

      const job = data.job;

      if (!job) {
        throw new Error(
          "Invalid response from Scene Finder."
        );
      }

      if (job.status === "completed") {
        stopPolling();
        localStorage.removeItem(
          "cinemate_scene_finder_job"
        );

        setIsSearching(false);
        setJobId(null);

        if (!job.result?.title) {
          setResult(null);
          setError(
            job.error ||
              "No confident scene match was found."
          );

          return;
        }

        setResult({
          contentId:
            job.result?.contentId,

          type:
            job.result?.contentType === "tv"
              ? "tv"
              : "movie",

          title:
            job.result?.title ||
            "Scene Identified",

          year:
            job.result?.year ||
            (job.result?.releaseDate
              ? String(job.result.releaseDate).slice(0, 4)
              : "—"),

          rating:
            job.result?.rating || "—",

          confidence:
            typeof job.result?.confidence ===
            "number"
              ? job.result.confidence
              : null,

          description:
            "CineMate successfully identified the scene.",

          image:
            job.result?.image || "",

          evidenceType:
            job.result?.evidenceType || "",

          sceneScore:
            typeof job.result?.sceneScore === "number"
              ? job.result.sceneScore
              : null,
        });

        return;
      }

      if (job.status === "failed") {
        stopPolling();
        localStorage.removeItem(
          "cinemate_scene_finder_job"
        );

        setIsSearching(false);

        setError(
          job.error ||
            "Scene analysis failed. Please try again."
        );
        setResult(null);
        setJobId(null);

        return;
      }

      setIsSearching(true);
    } catch (error) {
      console.error(
        "Scene Finder Status Error:",
        error
      );

      /*
       * A temporary network/server error must not
       * kill an active Scene Finder job.
       * The next polling attempt will retry it.
       */
      setIsSearching(true);
    }
  }, [stopPolling]);

  const startPolling = useCallback((
    currentJobId,
    token
  ) => {
    stopPolling();

    const poll = async () => {
      await checkJobStatus(
        currentJobId,
        token
      );

      if (pollingRef.current) {
        pollingRef.current =
          setTimeout(
            poll,
            3000
          );
      }
    };

    pollingRef.current =
      setTimeout(
        poll,
        0
      );
  }, [checkJobStatus, stopPolling]);

  useEffect(() => {
    const storedJobId = localStorage.getItem(
      "cinemate_scene_finder_job"
    );

    const storedAuth = localStorage.getItem(
      "cinemate_auth"
    );

    let parsedAuth = null;

    try {
      parsedAuth = storedAuth
        ? JSON.parse(storedAuth)
        : null;
    } catch {
      // Invalid persisted auth should simply skip job recovery.
    }

    if (
      storedJobId &&
      parsedAuth?.token
    ) {
      setJobId(storedJobId);
      setIsSearching(true);
      startPolling(
        storedJobId,
        parsedAuth.token
      );
    }

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  const handleIdentifyScene = async (
    event
  ) => {
    event.preventDefault();

    const trimmedUrl =
      reelUrl.trim();

    if (!trimmedUrl && !videoFile) {
      setError(
        "Paste an Instagram Reel link or upload a video."
      );

      return;
    }

    stopPolling();

    setIsSearching(true);
    setAnalysisStep(0);
    setResult(null);
    setJobId(null);
    setError("");

    try {
      const storedAuth =
        localStorage.getItem(
          "cinemate_auth"
        );

      if (!storedAuth) {
        throw new Error(
          "Please login before using Scene Finder."
        );
      }

      const parsedAuth =
        JSON.parse(storedAuth);

      const token =
        parsedAuth?.token;

      if (!token) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const formData =
        new FormData();

      if (trimmedUrl) {
        formData.append(
          "reelUrl",
          trimmedUrl
        );
      }

      if (videoFile) {
        formData.append(
          "video",
          videoFile
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/scene-finder/analyze`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to analyze the scene."
        );
      }

      const newJobId =
        data.job?.id;

      if (!newJobId) {
        throw new Error(
          "Scene analysis job ID was not returned."
        );
      }

      setJobId(newJobId);

      localStorage.setItem(
        "cinemate_scene_finder_job",
        newJobId
      );

      startPolling(
        newJobId,
        token
      );
    } catch (error) {
      console.error(
        "Scene Finder Error:",
        error
      );

      stopPolling();

      setIsSearching(false);

      setError(
        error.message ||
          "Something went wrong while analyzing the scene."
      );
    }
  };

  const currentAnalysis =
    analysisSteps[analysisStep];

  const CurrentIcon =
    currentAnalysis.icon;

  return (
    <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-28 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* ================= HERO ================= */}

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] px-6 py-16 sm:px-10 sm:py-20 lg:px-16">

          <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-white/[0.06] blur-[100px]" />

          <div className="pointer-events-none absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-white/[0.04] blur-[120px]" />

          <div className="relative mx-auto max-w-3xl text-center">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 backdrop-blur-xl">
              <Sparkles size={14} />
              CineMate Scene Finder
            </div>

            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
              Find the movie
              <span className="block text-white/40">
                behind the scene.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/45 sm:text-base">
              Upload a scene video or paste an Instagram
              Reel link and CineMate will identify the
              movie or series behind it.
            </p>

            {/* ================= SEARCH BOX ================= */}

            <form
              onSubmit={
                handleIdentifyScene
              }
              className="mx-auto mt-10 max-w-2xl"
            >
              <div className="rounded-2xl border border-white/10 bg-black/60 p-2 shadow-2xl backdrop-blur-xl">

                <div className="group flex items-center gap-3 px-3">

                  <Camera
                    size={20}
                    className="shrink-0 text-white/40 transition-colors duration-300 group-focus-within:text-white"
                  />

                  <input
                    type="url"
                    value={reelUrl}
                    onChange={(event) => {
                      setReelUrl(
                        event.target.value
                      );

                      if (
                        event.target.value
                      ) {
                        setVideoFile(
                          null
                        );

                        if (
                          fileInputRef.current
                        ) {
                          fileInputRef.current.value =
                            "";
                        }
                      }
                    }}
                    placeholder="Paste Instagram Reel link..."
                    aria-label="Instagram Reel URL"
                    disabled={Boolean(
                      videoFile
                    )}
                    className="w-full min-w-0 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-40 sm:text-base"
                  />

                </div>

                <div className="flex items-center gap-3 px-3 py-2">

                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                    or
                  </span>

                  <div className="h-px flex-1 bg-white/10" />

                </div>

                <div className="px-3">

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    onChange={
                      handleVideoChange
                    }
                    className="hidden"
                  />

                  {videoFile ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                          <Film size={16} />
                        </div>

                        <div className="min-w-0 text-left">

                          <p className="truncate text-sm text-white/80">
                            {videoFile.name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-white/30">
                            {(
                              videoFile.size /
                              (1024 * 1024)
                            ).toFixed(1)}{" "}
                            MB
                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={
                          removeVideo
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:border-white/20 hover:text-white"
                        aria-label="Remove video"
                      >
                        <X size={15} />
                      </button>

                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] hover:text-white/70"
                    >
                      <Upload size={17} />
                      Upload scene video
                    </button>
                  )}

                </div>

                <button
                  type="submit"
                  disabled={
                    isSearching ||
                    (!reelUrl.trim() &&
                      !videoFile)
                  }
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(255,255,255,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSearching ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Identifying...
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

            {error && (
              <p
                role="alert"
                aria-live="assertive"
                className="mx-auto mt-4 max-w-2xl text-sm text-red-400"
              >
                {error}
              </p>
            )}

            {isSearching &&
              jobId &&
              !error && (
                <p
                  className="mx-auto mt-4 max-w-2xl text-xs text-white/30"
                  role="status"
                  aria-live="polite"
                >
                  Scene analysis is being processed...
                </p>
              )}

            <p className="mt-4 text-xs text-white/25">
              Public Reel links or supported video files up to 100 MB
            </p>

          </div>
        </section>

        {/* ================= SINGLE ANALYSIS CARD ================= */}

        {isSearching && (
          <section className="mt-10">

            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.025] px-7 py-12 sm:px-12 sm:py-16">

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.045] blur-[100px]" />

              <div className="scene-finder-shimmer pointer-events-none absolute inset-0" />

              <div className="relative text-center">

                <div
                  key={analysisStep}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-[0_0_60px_rgba(255,255,255,0.06)]"
                  style={{
                    animation:
                      "sceneIconEnter 500ms ease-out",
                  }}
                >
                  <CurrentIcon
                    size={30}
                    className="text-white/80"
                  />
                </div>

                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30">
                  CineMate AI
                </p>

                <h2
                  key={`title-${analysisStep}`}
                  className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
                  style={{
                    animation:
                      "sceneTextEnter 500ms ease-out",
                  }}
                >
                  {currentAnalysis.title}
                </h2>

                <p
                  key={`text-${analysisStep}`}
                  className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/40 sm:text-base"
                  style={{
                    animation:
                      "sceneTextEnter 600ms ease-out",
                  }}
                >
                  {currentAnalysis.text}
                </p>

                <div className="mt-9 flex items-center justify-center gap-2">

                  {analysisSteps.map(
                    (_, index) => (
                      <div
                        key={index}
                        className={`h-1 rounded-full transition-all duration-700 ${
                          index ===
                          analysisStep
                            ? "w-10 bg-white/70"
                            : "w-2 bg-white/15"
                        }`}
                      />
                    )
                  )}

                </div>

                <div className="mx-auto mt-8 h-px max-w-md overflow-hidden bg-white/[0.06]">

                  <div
                    className="h-full bg-white/50"
                    style={{
                      width: `${
                        ((analysisStep + 1) /
                          analysisSteps.length) *
                        100
                      }%`,
                      transition:
                        "width 800ms ease",
                    }}
                  />

                </div>

                <p className="mt-5 text-xs text-white/20">
                  Please wait while CineMate finds your movie or series.
                </p>

              </div>
            </div>

            <style>
              {`
                .scene-finder-shimmer {
                  background:
                    linear-gradient(
                      110deg,
                      transparent 20%,
                      rgba(255,255,255,0.035) 45%,
                      rgba(255,255,255,0.06) 50%,
                      rgba(255,255,255,0.035) 55%,
                      transparent 80%
                    );
                  transform: translateX(-100%);
                  animation: sceneShimmer 3s ease-in-out infinite;
                }

                @keyframes sceneShimmer {
                  0% {
                    transform: translateX(-100%);
                  }

                  55%,
                  100% {
                    transform: translateX(100%);
                  }
                }

                @keyframes sceneIconEnter {
                  0% {
                    opacity: 0;
                    transform: scale(0.75) translateY(10px);
                  }

                  100% {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                  }
                }

                @keyframes sceneTextEnter {
                  0% {
                    opacity: 0;
                    transform: translateY(8px);
                  }

                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
              `}
            </style>

          </section>
        )}

        {/* ================= RESULT ================= */}

        {result && !isSearching && (
          <section
            className="mt-10"
            aria-live="polite"
          >

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
                Result
              </p>

              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                Scene identified
              </h2>

            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">

              <div className="grid lg:grid-cols-[280px_1fr]">

                <div className="flex aspect-[2/3] items-center justify-center bg-white/[0.03] lg:aspect-auto">

                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/20">

                      <Clapperboard size={42} />

                      <span className="text-xs">
                        Poster will appear here
                      </span>

                    </div>
                  )}

                </div>

                <div className="flex flex-col justify-center p-7 sm:p-10">

                  <div className="flex flex-wrap items-center gap-3">

                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/50">

                      {result.type === "tv" ? (
                        <span className="flex items-center gap-1.5">
                          <Tv size={12} />
                          Series
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <Film size={12} />
                          Movie
                        </span>
                      )}

                    </span>

                    <span className="text-sm text-white/35">
                      {result.year}
                    </span>

                  </div>

                  <h3 className="mt-5 text-3xl font-semibold sm:text-4xl">
                    {result.title}
                  </h3>

                  <div className="mt-4 flex items-center gap-2 text-sm text-white/50">

                    <Star
                      size={15}
                      className="fill-white"
                    />

                    {result.rating}

                  </div>

                  {typeof result.confidence ===
                    "number" && (
                    <div className="mt-5 flex flex-wrap items-center gap-3">

                      <span className="text-xs uppercase tracking-wider text-white/30">
                        Match Confidence
                      </span>

                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">

                        <div
                          className="h-full rounded-full bg-white/70 transition-all duration-700"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                result.confidence,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                      <span className="text-xs font-semibold text-white/60">
                        {result.confidence}%
                      </span>

                    </div>
                  )}

                  {result.evidenceType && (
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
                      <span className="uppercase tracking-wider text-white/30">
                        Evidence
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/55">
                        {result.evidenceType.replace(/-/g, " ")}
                      </span>
                    </div>
                  )}

                  <p className="mt-6 max-w-2xl text-sm leading-7 text-white/45">
                    {result.description}
                  </p>

                  {result.contentId && (
                    <Link
                      to={
                        result.type === "tv"
                          ? `/tv/${result.contentId}`
                          : `/movie/${result.contentId}`
                      }
                      className="mt-8 flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(255,255,255,0.18)]"
                    >
                      View Details
                      <ArrowRight size={16} />
                    </Link>
                  )}

                </div>

              </div>
            </div>

          </section>
        )}

        {/* ================= HOW IT WORKS ================= */}

        <section className="mt-20">

          <div className="mb-8">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/35">
              How it works
            </p>

            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              From scene to movie.
            </h2>

          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {[
              {
                number: "01",
                icon: Camera,
                title: "Add Scene",
                text: "Paste a public Reel link or upload a supported video.",
              },
              {
                number: "02",
                icon: Search,
                title: "Identify Scene",
                text: "CineMate extracts visual text and dialogue signals from the scene.",
              },
              {
                number: "03",
                icon: Film,
                title: "Discover",
                text: "Explore the matching movie or series and its details.",
              },
            ].map((item) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={item.number}
                  className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.045]"
                >

                  <div className="flex items-center justify-between">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <Icon size={19} />
                    </div>

                    <span className="text-xs font-semibold text-white/20">
                      {item.number}
                    </span>

                  </div>

                  <h3 className="mt-7 text-lg font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    {item.text}
                  </p>

                </div>
              );
            })}

          </div>
        </section>

      </div>
    </main>
  );
};

export default SceneFinder;

