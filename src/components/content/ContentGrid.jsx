
import ContentCard from "./ContentCard";

const ContentGrid = ({
  items = [],
  loading = false,
  skeletonCount = 12,
  showRemoveButton = false,
  onRemove,
}) => {
  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({
          length: Math.max(1, skeletonCount),
        }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="aspect-[2/3] animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]"
          />
        ))}
      </div>
    );
  }

  /* =========================
     EMPTY STATE
  ========================= */

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 text-center">
        <p className="text-sm text-white/35">
          No content found.
        </p>
      </div>
    );
  }

  /* =========================
     CONTENT GRID
  ========================= */

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {items.map((item, index) => {
        if (!item?.id || !item?.type) {
          return null;
        }

        return (
          <ContentCard
            key={`${item.type}-${item.id}`}
            content={item}
            index={index}
            showRemoveButton={
              showRemoveButton
            }
            onRemove={onRemove}
          />
        );
      })}
    </div>
  );
};

export default ContentGrid;

