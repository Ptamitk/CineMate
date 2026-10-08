import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  LoaderCircle,
  UserCircle,
} from "lucide-react";

import {
  getNotifications,
  markNotificationAsRead,
} from "../../utils/notifications";

const Notifications = () => {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchNotifications =
      async () => {
        try {
          setLoading(true);

          const data =
            await getNotifications(1, 30);

          setNotifications(data.notifications || []);
          setPage(data.page || 1);
          setHasMore(Boolean(data.hasMore));
        } catch (error) {
          console.error(
            "Notifications Page Error:",
            error
          );
        } finally {
          setLoading(false);
        }
      };

    fetchNotifications();
  }, []);

  const loadMoreNotifications = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const data = await getNotifications(page + 1, 30);
      setNotifications((current) => [
        ...current,
        ...(data.notifications || []),
      ]);
      setPage(data.page || page + 1);
      setHasMore(Boolean(data.hasMore));
    } catch (error) {
      console.error("Load More Notifications Error:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAsRead =
    async (notificationId) => {
      const success =
        await markNotificationAsRead(
          notificationId
        );

      if (!success) {
        return;
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification._id ===
              notificationId
                ? {
                    ...notification,
                    isRead: true,
                  }
                : notification
          )
      );
    };

  const getNotificationText =
    (notification) => {
      const name =
        notification.sender?.name ||
        "Someone";

      if (
        notification.type ===
        "like"
      ) {
        return `${name} liked your post.`;
      }

      if (
        notification.type ===
        "comment"
      ) {
        return `${name} commented on your post.`;
      }

      if (
        notification.type ===
        "follow"
      ) {
        return `${name} started following you.`;
      }

      if (
        notification.type ===
        "share"
      ) {
        return `${name} shared your post.`;
      }

      return "You have a new notification.";
    };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 pt-28 text-white">
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoaderCircle
            size={32}
            className="animate-spin text-white/60"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <Bell size={26} />

            <h1 className="text-2xl font-semibold sm:text-3xl">
              Notifications
            </h1>
          </div>

          <p className="text-sm text-white/50">
            Your latest CineMate activity.
          </p>
        </div>

        {notifications.length ===
        0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 text-center">
            <Bell
              size={42}
              className="mb-4 text-white/30"
            />

            <h2 className="text-lg font-medium">
              No notifications yet
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Likes, comments, follows
              and shares will appear here.
            </p>
          </div>
        ) : (
          <>
          <div className="space-y-3">
            {notifications.map(
              (notification) => (
                <article
                  key={
                    notification._id
                  }
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                    notification.isRead
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-white/20 bg-white/[0.06]"
                  }`}
                >
                  {notification.sender
                    ?.profilePicture ? (
                    <img
                      src={
                        notification
                          .sender
                          .profilePicture
                      }
                      alt={
                        notification
                          .sender
                          .name ||
                        "User"
                      }
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle
                      size={40}
                      className="shrink-0 text-white/30"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-white/80">
                      {getNotificationText(
                        notification
                      )}
                    </p>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() =>
                          handleMarkAsRead(
                            notification._id
                          )
                        }
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/50 transition hover:text-white"
                      >
                        <Check size={14} />
                        Mark as read
                      </button>
                    )}
                  </div>

                  {!notification.isRead && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-white" />
                  )}
                </article>
              )
            )}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-3">
              <button
                type="button"
                onClick={loadMoreNotifications}
                disabled={loadingMore}
                className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loadingMore ? "Loading..." : "Load more notifications"}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </main>
  );
};

export default Notifications;