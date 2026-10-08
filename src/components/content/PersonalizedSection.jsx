import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { contentService } from "../../services/content/contentService";
import { getLibrary } from "../../services/content/userContentService";
import ContentGrid from "./ContentGrid";

const CACHE_KEY = "cinemate_personalized_v2";
const CACHE_TTL = 10 * 60 * 1000;
const MAX_SEEDS = 6;
const MAX_GENRES = 3;
const MAX_RESULTS = 12;

const readCache = () => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.timestamp < CACHE_TTL && Array.isArray(cached.items)) {
      return cached.items;
    }
  } catch {
    // Ignore cache failures.
  }
  return null;
};

const writeCache = (items) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), items }));
  } catch {
    // Ignore cache failures.
  }
};

const PersonalizedSection = () => {
  const [items, setItems] = useState(() => readCache() || []);
  const [loading, setLoading] = useState(() => !readCache()?.length);

  useEffect(() => {
    let active = true;

    const buildRecommendations = async () => {
      try {
        const [favorites, watched] = await Promise.all([
          getLibrary("favorites").catch(() => []),
          getLibrary("watched").catch(() => []),
        ]);

        const seedMap = new Map();
        [...favorites, ...watched].forEach((item) => {
          const key = `${item.contentType}-${item.contentId}`;
          if (!seedMap.has(key)) seedMap.set(key, item);
        });

        const seeds = [...seedMap.values()].slice(0, MAX_SEEDS);
        if (!seeds.length) {
          if (active) setLoading(false);
          return;
        }

        const details = await Promise.all(
          seeds.map((seed) =>
            seed.contentType === "movie"
              ? contentService.movies.details(seed.contentId)
              : contentService.tv.details(seed.contentId)
          )
        );

        const genreScores = new Map();
        details.forEach((detail, index) => {
          const weight = index < 2 ? 3 : 2;
          (detail?.genres || []).forEach((genre) => {
            genreScores.set(
              genre.id,
              (genreScores.get(genre.id) || 0) + weight
            );
          });
        });

        const topGenres = [...genreScores.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, MAX_GENRES)
          .map(([id]) => id);

        if (!topGenres.length) {
          if (active) setLoading(false);
          return;
        }

        const recommendations = await Promise.all(
          topGenres.flatMap((genre) => [
            contentService.movies.discover({
              genre,
              sort: "vote_average.desc",
            }),
            contentService.tv.discover({
              genre,
              sort: "vote_average.desc",
            }),
          ])
        );

        const seedKeys = new Set(
          seeds.map((seed) => `${seed.contentType}-${seed.contentId}`)
        );
        const ranked = new Map();

        recommendations.forEach((response, index) => {
          const type = index % 2 === 0 ? "movie" : "tv";
          (response?.results || []).forEach((item) => {
            const key = `${type}-${item.id}`;
            if (seedKeys.has(key)) return;

            const score =
              (item.vote_average || 0) * 2 +
              Math.log10((item.vote_count || 0) + 10) +
              (item.popularity || 0) / 100;

            const existing = ranked.get(key);
            if (!existing || score > existing.score) {
              ranked.set(key, { ...item, type, score });
            }
          });
        });

        const unique = [...ranked.values()]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_RESULTS)
          .map((item) => ({
            id: item.id,
            type: item.type,
            title: item.type === "movie" ? item.title : item.name,
            image: item.poster_path
              ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
              : "",
            year: (item.release_date || item.first_air_date || "").slice(0, 4),
            rating:
              typeof item.vote_average === "number"
                ? item.vote_average.toFixed(1)
                : "",
          }));

        if (active) {
          setItems(unique);
          writeCache(unique);
        }
      } catch (error) {
        console.error("Personalized recommendations:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    buildRecommendations();

    return () => {
      active = false;
    };
  }, []);

  if (!loading && !items.length) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/30">
            <Sparkles size={13} /> Personalized
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Picked for You</h2>
          <p className="mt-2 text-sm text-white/40">
            Based on your saved and watched content.
          </p>
        </div>
        <Link
          to="/movies"
          className="text-sm text-white/40 hover:text-white"
        >
          Explore all
        </Link>
      </div>

      <ContentGrid items={items} animation="depth" />
    </section>
  );
};

export default PersonalizedSection;
