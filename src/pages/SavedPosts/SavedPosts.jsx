
import { useEffect, useState } from "react";
import {
  Bookmark,
  LoaderCircle,
  UserCircle,
} from "lucide-react";

import { getSavedPosts } from "../../utils/savedPosts";

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        setLoading(true);

        const data =
          await getSavedPosts();

        setSavedPosts(data);
      } catch (error) {
        console.error(
          "Saved Posts Page Error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPosts();
  }, []);

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
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <Bookmark
              size={26}
              fill="currentColor"
            />

            <h1 className="text-2xl font-semibold sm:text-3xl">
              Saved Posts
            </h1>
          </div>

          <p className="text-sm text-white/50">
            Posts you saved on CineMate.
          </p>
        </div>

        {savedPosts.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 text-center">
            <Bookmark
              size={42}
              className="mb-4 text-white/30"
            />

            <h2 className="text-lg font-medium">
              No saved posts yet
            </h2>

            <p className="mt-2 max-w-md text-sm text-white/40">
              When you save a post, it will
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((savedItem) => {
              const post =
                savedItem.post;

              if (!post) {
                return null;
              }

              const author =
                post.user;

              return (
                <article
                  key={savedItem._id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
                    {author?.profilePicture ? (
                      <img
                        src={
                          author.profilePicture
                        }
                        alt={
                          author.name ||
                          "User"
                        }
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircle
                        size={40}
                        className="text-white/30"
                      />
                    )}

                    <div>
                      <p className="text-sm font-medium">
                        {author?.name ||
                          "CineMate User"}
                      </p>

                      <p className="text-xs text-white/40">
                        Saved post
                      </p>
                    </div>

                    <Bookmark
                      size={18}
                      fill="currentColor"
                      className="ml-auto text-white/70"
                    />
                  </div>

                  {post.text && (
                    <p className="whitespace-pre-wrap px-4 py-4 text-sm leading-6 text-white/80">
                      {post.text}
                    </p>
                  )}

                  {post.mediaUrl && (
                    <div className="overflow-hidden">
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="max-h-[600px] w-full object-cover"
                      />
                    </div>
                  )}

                  {post.contentId &&
                    post.contentType && (
                      <div className="mx-4 my-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                        <p className="text-xs uppercase tracking-wider text-white/40">
                          Shared Content
                        </p>

                        <p className="mt-1 text-sm capitalize text-white/80">
                          {post.contentType}
                        </p>
                      </div>
                    )}

                  <div className="flex items-center gap-5 border-t border-white/10 px-4 py-3 text-xs text-white/40">
                    <span>
                      {post.likesCount || 0} likes
                    </span>

                    <span>
                      {post.commentsCount || 0} comments
                    </span>

                    <span>
                      {post.sharesCount || 0} shares
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default SavedPosts;

