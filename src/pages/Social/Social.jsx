
import { useEffect, useRef, useState } from "react";

import {
  Bookmark,
  Check,
  Heart,
  Image as ImageIcon,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Share2,
  Trash2,
  X,
  Pencil,
} from "lucide-react";

import { contentService } from "../../services/content/contentService";

import {
  isPostSaved,
  toggleSavedPost,
} from "../../utils/savedPosts";

import { sharePost } from "../../utils/postShares";

import { updatePost } from "../../utils/posts";

const API_BASE_URL = "http://localhost:5000";

const getAuthToken = () => {
  try {
    const storedAuth =
      localStorage.getItem("cinemate_auth");

    if (!storedAuth) {
      return null;
    }

    const parsedAuth =
      JSON.parse(storedAuth);

    return parsedAuth?.token || null;
  } catch (error) {
    console.error(
      "Social Auth Read Error:",
      error
    );

    return null;
  }
};

const getCurrentUserId = () => {
  try {
    const storedAuth =
      localStorage.getItem("cinemate_auth");

    if (!storedAuth) {
      return null;
    }

    const parsedAuth =
      JSON.parse(storedAuth);

    return parsedAuth?.user?.id || null;
  } catch {
    return null;
  }
};

const Social = () => {
  const currentUserId =
    getCurrentUserId();

  const [posts, setPosts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [postText, setPostText] =
    useState("");

  const [creatingPost, setCreatingPost] =
    useState(false);

  const [postError, setPostError] =
    useState("");

  const [comments, setComments] =
    useState({});

  const [commentText, setCommentText] =
    useState({});

  const [openComments, setOpenComments] =
    useState({});

  const [commentsLoading, setCommentsLoading] =
    useState({});

  const [likedPosts, setLikedPosts] =
    useState({});

  const [savedPosts, setSavedPosts] =
    useState({});

  const [saveLoading, setSaveLoading] =
    useState({});

  const [followedUsers, setFollowedUsers] =
    useState({});

  const [followLoading, setFollowLoading] =
    useState({});

  const [deletingPosts, setDeletingPosts] =
    useState({});

  const [shareLoading, setShareLoading] =
    useState({});

  const [editingPostId, setEditingPostId] =
    useState(null);

  const [editingText, setEditingText] =
    useState("");

  const [updatingPost, setUpdatingPost] =
    useState({});

  /* =========================
     COMMENT EDIT
  ========================= */

  const [
    editingCommentId,
    setEditingCommentId,
  ] = useState(null);

  const [
    editingCommentText,
    setEditingCommentText,
  ] = useState("");

  const [
    updatingComment,
    setUpdatingComment,
  ] = useState({});

  /* =========================
     CONTENT PICKER
  ========================= */

  const [
    showContentPicker,
    setShowContentPicker,
  ] = useState(false);

  const [
    contentQuery,
    setContentQuery,
  ] = useState("");

  const [
    contentResults,
    setContentResults,
  ] = useState([]);

  const [
    contentSearching,
    setContentSearching,
  ] = useState(false);

  const [
    selectedContent,
    setSelectedContent,
  ] = useState(null);

  /* =========================
     IMAGE PICKER
  ========================= */

  const imageInputRef =
    useRef(null);

  const [
    selectedImage,
    setSelectedImage,
  ] = useState(null);

  const [
    imagePreview,
    setImagePreview,
  ] = useState("");

  /* =========================
     FETCH FEED
  ========================= */

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const token =
        getAuthToken();

      if (!token) {
        setPosts([]);
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/posts`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to fetch posts."
        );
      }

      setPosts(
        data.posts || []
      );
    } catch (error) {
      console.error(
        "Social Feed Error:",
        error
      );

      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LIKE STATUS
  ========================= */

  const fetchLikeStatus = async (
    postId
  ) => {
    try {
      const token =
        getAuthToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/posts/${postId}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        return;
      }

      setLikedPosts(
        (current) => ({
          ...current,
          [postId]:
            Boolean(data.liked),
        })
      );
    } catch (error) {
      console.error(
        "Like Status Error:",
        error
      );
    }
  };

  /* =========================
     SAVED STATUS
  ========================= */

  const fetchSavedStatus = async (
    postId
  ) => {
    try {
      const saved =
        await isPostSaved(
          postId
        );

      setSavedPosts(
        (current) => ({
          ...current,
          [postId]: saved,
        })
      );
    } catch (error) {
      console.error(
        "Saved Status Error:",
        error
      );
    }
  };

  /* =========================
     FOLLOW STATUS
  ========================= */

  const fetchFollowStatus = async (
    userId
  ) => {
    try {
      const token =
        getAuthToken();

      if (!token || !userId) {
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/follows/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        return;
      }

      setFollowedUsers(
        (current) => ({
          ...current,
          [userId]:
            Boolean(
              data.following
            ),
        })
      );
    } catch (error) {
      console.error(
        "Follow Status Error:",
        error
      );
    }
  };

  /* =========================
     FOLLOW / UNFOLLOW
  ========================= */

  const handleFollow = async (
    userId
  ) => {
    try {
      const token =
        getAuthToken();

      if (!token || !userId) {
        return;
      }

      setFollowLoading(
        (current) => ({
          ...current,
          [userId]: true,
        })
      );

      const response =
        await fetch(
          `${API_BASE_URL}/api/follows/${userId}`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update follow status."
        );
      }

      setFollowedUsers(
        (current) => ({
          ...current,
          [userId]:
            Boolean(
              data.following
            ),
        })
      );
    } catch (error) {
      console.error(
        "Follow User Error:",
        error
      );
    } finally {
      setFollowLoading(
        (current) => ({
          ...current,
          [userId]: false,
        })
      );
    }
  };

  /* =========================
     SAVE / UNSAVE
  ========================= */

  const handleSavePost = async (
    postId
  ) => {
    try {
      const token =
        getAuthToken();

      if (!token) {
        return;
      }

      setSaveLoading(
        (current) => ({
          ...current,
          [postId]: true,
        })
      );

      const saved =
        await toggleSavedPost(
          postId
        );

      setSavedPosts(
        (current) => ({
          ...current,
          [postId]: saved,
        })
      );
    } catch (error) {
      console.error(
        "Save Post Error:",
        error
      );
    } finally {
      setSaveLoading(
        (current) => ({
          ...current,
          [postId]: false,
        })
      );
    }
  };

  /* =========================
     SHARE POST
  ========================= */

  const handleSharePost = async (
    post
  ) => {
    try {
      setShareLoading(
        (current) => ({
          ...current,
          [post._id]: true,
        })
      );

      let shareCompleted = false;

      const shareUrl =
        `${window.location.origin}/social`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "CineMate",
            text:
              "Check out this post on CineMate.",
            url: shareUrl,
          });

          shareCompleted = true;
        } catch (error) {
          if (
            error.name ===
            "AbortError"
          ) {
            return;
          }

          throw error;
        }
      } else {
        await navigator.clipboard.writeText(
          shareUrl
        );

        shareCompleted = true;

        alert(
          "Post link copied!"
        );
      }

      if (!shareCompleted) {
        return;
      }

      const data =
        await sharePost(
          post._id
        );

      if (
        data?.sharesCount !==
        undefined
      ) {
        setPosts(
          (currentPosts) =>
            currentPosts.map(
              (currentPost) =>
                currentPost._id ===
                  post._id
                  ? {
                    ...currentPost,
                    sharesCount:
                      data.sharesCount,
                  }
                  : currentPost
            )
        );
      }
    } catch (error) {
      console.error(
        "Share Post Error:",
        error
      );
    } finally {
      setShareLoading(
        (current) => ({
          ...current,
          [post._id]: false,
        })
      );
    }
  };

  /* =========================
     EDIT POST
  ========================= */

  const handleStartEdit = (
    post
  ) => {
    setEditingPostId(
      post._id
    );

    setEditingText(
      post.text || ""
    );
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingText("");
  };

  const handleUpdatePost = async (
    postId
  ) => {
    try {
      const trimmedText =
        editingText.trim();

      if (!trimmedText) {
        return;
      }

      setUpdatingPost(
        (current) => ({
          ...current,
          [postId]: true,
        })
      );

      const data =
        await updatePost(
          postId,
          trimmedText
        );

      if (!data?.post) {
        return;
      }

      setPosts(
        (currentPosts) =>
          currentPosts.map(
            (post) =>
              post._id === postId
                ? {
                  ...post,
                  ...data.post,
                }
                : post
          )
      );

      setEditingPostId(null);
      setEditingText("");
    } catch (error) {
      console.error(
        "Update Post Error:",
        error
      );
    } finally {
      setUpdatingPost(
        (current) => ({
          ...current,
          [postId]: false,
        })
      );
    }
  };

  /* =========================
     INITIAL FEED
  ========================= */

  useEffect(() => {
    fetchPosts();
  }, []);

  /* =========================
     LOAD POST STATUSES
  ========================= */

  useEffect(() => {
    if (!posts.length) {
      return;
    }

    posts.forEach(
      (post) => {
        fetchLikeStatus(
          post._id
        );

        fetchSavedStatus(
          post._id
        );

        const userId =
          post.user?._id;

        if (
          userId &&
          String(userId) !==
          String(currentUserId)
        ) {
          fetchFollowStatus(
            userId
          );
        }
      }
    );
  }, [posts, currentUserId]);

  /* =========================
     CONTENT SEARCH
  ========================= */

  useEffect(() => {
    const query =
      contentQuery.trim();

    if (!query) {
      setContentResults([]);
      return;
    }

    const timer =
      setTimeout(
        async () => {
          try {
            setContentSearching(
              true
            );

            const data =
              await contentService
                .universal
                .search(query);

            const results =
              (data.results || [])
                .filter(
                  (item) =>
                    item.media_type ===
                    "movie" ||
                    item.media_type ===
                    "tv" ||
                    item.media_type ===
                    "person"
                )
                .slice(0, 8);

            setContentResults(
              results
            );
          } catch (error) {
            console.error(
              "Content Search Error:",
              error
            );

            setContentResults([]);
          } finally {
            setContentSearching(
              false
            );
          }
        },
        400
      );

    return () =>
      clearTimeout(timer);
  }, [contentQuery]);

  /* =========================
     SELECT CONTENT
  ========================= */

  const handleSelectContent = (
    item
  ) => {
    const type =
      item.media_type;

    setSelectedContent({
      id: item.id,
      type,
      title:
        type === "person"
          ? item.name
          : type === "tv"
            ? item.name
            : item.title,
      image:
        item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : item.profile_path
            ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
            : "",
    });

    setShowContentPicker(false);
    setContentQuery("");
    setContentResults([]);
  };

  const removeSelectedContent =
    () => {
      setSelectedContent(null);
    };

  /* =========================
     IMAGE SELECT
  ========================= */

  const handleImageSelect = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setPostError(
        "Please select an image file."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setPostError(
        "Image must be smaller than 5MB."
      );

      return;
    }

    setPostError("");
    setSelectedImage(file);

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setImagePreview(
      previewUrl
    );
  };

  const removeSelectedImage =
    () => {
      setSelectedImage(null);

      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }

      setImagePreview("");

      if (
        imageInputRef.current
      ) {
        imageInputRef.current.value =
          "";
      }
    };

  /* =========================
     CREATE POST
  ========================= */

  const handleCreatePost =
    async (event) => {
      event?.preventDefault();

      const text =
        postText.trim();

      if (
        !text &&
        !selectedContent &&
        !selectedImage
      ) {
        setPostError(
          "Write something, add content, or add an image."
        );

        return;
      }

      try {
        setCreatingPost(true);
        setPostError("");

        const token =
          getAuthToken();

        if (!token) {
          setPostError(
            "Please login again."
          );

          return;
        }

        const formData =
          new FormData();

        if (text) {
          formData.append(
            "text",
            text
          );
        }

        if (selectedContent) {
          formData.append(
            "contentId",
            String(
              selectedContent.id
            )
          );

          formData.append(
            "contentType",
            selectedContent.type
          );
        }

        if (selectedImage) {
          formData.append(
            "media",
            selectedImage
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/posts`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              body: formData,
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to create post."
          );
        }

        if (data.post) {
          setPosts(
            (currentPosts) => [
              data.post,
              ...currentPosts,
            ]
          );
        }

        setPostText("");
        setSelectedContent(null);
        removeSelectedImage();
      } catch (error) {
        console.error(
          "Create Post Error:",
          error
        );

        setPostError(
          error.message ||
          "Failed to create post."
        );
      } finally {
        setCreatingPost(false);
      }
    };

  /* =========================
     LIKE / UNLIKE
  ========================= */

  const handleLike = async (
    postId
  ) => {
    try {
      const token =
        getAuthToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/posts/${postId}`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to update like."
        );
      }

      setLikedPosts(
        (current) => ({
          ...current,
          [postId]:
            Boolean(data.liked),
        })
      );

      setPosts(
        (currentPosts) =>
          currentPosts.map(
            (post) =>
              post._id === postId
                ? {
                  ...post,
                  likesCount:
                    data.likesCount,
                }
                : post
          )
      );
    } catch (error) {
      console.error(
        "Like Post Error:",
        error
      );
    }
  };

  /* =========================
     FETCH COMMENTS
  ========================= */

  const fetchComments =
    async (postId) => {
      try {
        const token =
          getAuthToken();

        if (!token) {
          return;
        }

        setCommentsLoading(
          (current) => ({
            ...current,
            [postId]: true,
          })
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/comments/post/${postId}`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to fetch comments."
          );
        }

        setComments(
          (current) => ({
            ...current,
            [postId]:
              data.comments || [],
          })
        );
      } catch (error) {
        console.error(
          "Fetch Comments Error:",
          error
        );
      } finally {
        setCommentsLoading(
          (current) => ({
            ...current,
            [postId]: false,
          })
        );
      }
    };

  /* =========================
     TOGGLE COMMENTS
  ========================= */

  const handleToggleComments =
    async (postId) => {
      const isOpen =
        Boolean(
          openComments[postId]
        );

      setOpenComments(
        (current) => ({
          ...current,
          [postId]: !isOpen,
        })
      );

      if (
        !isOpen &&
        !comments[postId]
      ) {
        await fetchComments(
          postId
        );
      }
    };

  /* =========================
     ADD COMMENT
  ========================= */

  const handleCommentSubmit =
    async (postId) => {
      const text =
        commentText[
          postId
        ]?.trim();

      if (!text) {
        return;
      }

      try {
        const token =
          getAuthToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/comments/post/${postId}`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                text,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to add comment."
          );
        }

        setComments(
          (current) => ({
            ...current,
            [postId]: [
              ...(current[
                postId
              ] || []),
              data.comment,
            ],
          })
        );

        setCommentText(
          (current) => ({
            ...current,
            [postId]: "",
          })
        );

        setPosts(
          (currentPosts) =>
            currentPosts.map(
              (post) =>
                post._id === postId
                  ? {
                    ...post,
                    commentsCount:
                      (post.commentsCount ||
                        0) + 1,
                  }
                  : post
            )
        );
      } catch (error) {
        console.error(
          "Add Comment Error:",
          error
        );
      }
    };

  /* =========================
     START EDIT COMMENT
  ========================= */

  const handleStartEditComment = (
    comment
  ) => {
    setEditingCommentId(
      comment._id
    );

    setEditingCommentText(
      comment.text || ""
    );
  };

  /* =========================
     CANCEL EDIT COMMENT
  ========================= */

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  /* =========================
     UPDATE COMMENT
  ========================= */

  const handleUpdateComment =
    async (
      commentId,
      postId
    ) => {
      const trimmedText =
        editingCommentText.trim();

      if (!trimmedText) {
        return;
      }

      try {
        const token =
          getAuthToken();

        if (!token) {
          return;
        }

        setUpdatingComment(
          (current) => ({
            ...current,
            [commentId]: true,
          })
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/comments/${commentId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                text: trimmedText,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to update comment."
          );
        }

        setComments(
          (current) => ({
            ...current,
            [postId]: (
              current[postId] || []
            ).map(
              (comment) =>
                comment._id ===
                  commentId
                  ? data.comment
                  : comment
            ),
          })
        );

        setEditingCommentId(null);
        setEditingCommentText("");
      } catch (error) {
        console.error(
          "Update Comment Error:",
          error
        );
      } finally {
        setUpdatingComment(
          (current) => ({
            ...current,
            [commentId]: false,
          })
        );
      }
    };

  /* =========================
     DELETE POST
  ========================= */

  const handleDeletePost =
    async (postId) => {
      const shouldDelete =
        window.confirm(
          "Are you sure you want to delete this post?"
        );

      if (!shouldDelete) {
        return;
      }

      try {
        const token =
          getAuthToken();

        if (!token) {
          return;
        }

        setDeletingPosts(
          (current) => ({
            ...current,
            [postId]: true,
          })
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/posts/${postId}`,
            {
              method: "DELETE",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to delete post."
          );
        }

        setPosts(
          (currentPosts) =>
            currentPosts.filter(
              (post) =>
                post._id !== postId
            )
        );

        setComments(
          (current) => {
            const updated = {
              ...current,
            };

            delete updated[postId];

            return updated;
          }
        );

        setOpenComments(
          (current) => {
            const updated = {
              ...current,
            };

            delete updated[postId];

            return updated;
          }
        );

        if (
          editingPostId ===
          postId
        ) {
          handleCancelEdit();
        }
      } catch (error) {
        console.error(
          "Delete Post Error:",
          error
        );
      } finally {
        setDeletingPosts(
          (current) => ({
            ...current,
            [postId]: false,
          })
        );
      }
    };

  /* =========================
     DELETE COMMENT
  ========================= */

  const handleDeleteComment = async (
    commentId,
    postId
  ) => {
    try {
      const token =
        getAuthToken();

      if (!token) {
        return;
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/comments/${commentId}`,
          {
            method: "DELETE",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to delete comment."
        );
      }

      setComments(
        (current) => ({
          ...current,
          [postId]: (
            current[postId] || []
          ).filter(
            (comment) =>
              comment._id !==
              commentId
          ),
        })
      );

      setPosts(
        (currentPosts) =>
          currentPosts.map(
            (post) =>
              post._id === postId
                ? {
                  ...post,
                  commentsCount:
                    Math.max(
                      0,
                      (post.commentsCount ||
                        0) - 1
                    ),
                }
                : post
          )
      );

      if (
        editingCommentId ===
        commentId
      ) {
        handleCancelEditComment();
      }
    } catch (error) {
      console.error(
        "Delete Comment Error:",
        error
      );
    }
  };

  return (
    <main className="min-h-screen bg-black px-5 pb-20 pt-32 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">

        {/* =========================
            PAGE HEADER
        ========================= */}

        <section className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Community
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Social
            <span className="text-white/30">
              .
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/40 sm:text-base">
            Share what you're watching,
            discover new stories, and
            connect with other
            entertainment fans.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">

          <section className="space-y-6">

            {/* =========================
                CREATE POST
            ========================= */}

            <form
              onSubmit={
                handleCreatePost
              }
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold">
                  C
                </div>

                <input
                  type="text"
                  value={postText}
                  onChange={(
                    event
                  ) => {
                    setPostText(
                      event.target.value
                    );

                    if (postError) {
                      setPostError("");
                    }
                  }}
                  placeholder="Share something with the community..."
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20"
                />
              </div>

              {selectedContent && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">

                  {selectedContent.image ? (
                    <img
                      src={
                        selectedContent.image
                      }
                      alt={
                        selectedContent.title
                      }
                      className="h-14 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded-lg bg-white/10 text-[10px] text-white/40">
                      No
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
                      Selected Content
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {
                        selectedContent.title
                      }
                    </p>

                    <p className="mt-0.5 text-xs uppercase text-white/30">
                      {
                        selectedContent.type
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      removeSelectedContent
                    }
                    className="rounded-full p-2 text-white/30 hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <img
                    src={imagePreview}
                    alt="Selected"
                    className="max-h-80 w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={
                      removeSelectedImage
                    }
                    className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={
                  handleImageSelect
                }
                className="hidden"
              />

              {postError && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                  {postError}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowContentPicker(
                      true
                    )
                  }
                  className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/45 transition hover:border-white/20 hover:text-white"
                >
                  Add Content
                </button>

                <button
                  type="button"
                  onClick={() =>
                    imageInputRef.current?.click()
                  }
                  className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/45 transition hover:border-white/20 hover:text-white"
                >
                  <ImageIcon size={14} />
                  Add Image
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingPost ||
                    (
                      !postText.trim() &&
                      !selectedContent &&
                      !selectedImage
                    )
                  }
                  className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creatingPost ? (
                    <>
                      <LoaderCircle
                        size={14}
                        className="animate-spin"
                      />
                      Posting...
                    </>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </form>

            {/* =========================
                CONTENT PICKER
            ========================= */}

            {showContentPicker && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">

                <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0b] shadow-2xl">

                  <div className="flex items-center justify-between border-b border-white/10 p-5">

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                        CineMate
                      </p>

                      <h2 className="mt-1 text-lg font-semibold">
                        Add Content
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowContentPicker(
                          false
                        )
                      }
                      className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-5">

                    <div className="relative">
                      <Search
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                      />

                      <input
                        autoFocus
                        type="text"
                        value={contentQuery}
                        onChange={(
                          event
                        ) =>
                          setContentQuery(
                            event.target.value
                          )
                        }
                        placeholder="Search movies, TV shows or people..."
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/25"
                      />
                    </div>

                    <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">

                      {contentSearching ? (
                        <div className="flex items-center justify-center py-10 text-sm text-white/40">
                          <LoaderCircle
                            size={18}
                            className="mr-2 animate-spin"
                          />
                          Searching...
                        </div>
                      ) : contentResults.length > 0 ? (
                        contentResults.map(
                          (item) => {
                            const title =
                              item.media_type ===
                                "person"
                                ? item.name
                                : item.media_type ===
                                  "tv"
                                  ? item.name
                                  : item.title;

                            const image =
                              item.poster_path
                                ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
                                : item.profile_path
                                  ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                                  : "";

                            return (
                              <button
                                key={`${item.media_type}-${item.id}`}
                                type="button"
                                onClick={() =>
                                  handleSelectContent(
                                    item
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.05]"
                              >
                                {image ? (
                                  <img
                                    src={
                                      image
                                    }
                                    alt={
                                      title
                                    }
                                    className="h-16 w-11 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="flex h-16 w-11 items-center justify-center rounded-lg bg-white/10 text-[9px] text-white/30">
                                    N/A
                                  </div>
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">
                                    {title}
                                  </p>

                                  <p className="mt-1 text-xs uppercase text-white/30">
                                    {
                                      item.media_type
                                    }
                                  </p>
                                </div>

                                <Check
                                  size={17}
                                  className="text-white/20"
                                />
                              </button>
                            );
                          }
                        )
                      ) : contentQuery.trim() ? (
                        <p className="py-10 text-center text-sm text-white/30">
                          No content found.
                        </p>
                      ) : (
                        <p className="py-10 text-center text-sm text-white/30">
                          Search for something to
                          attach to your post.
                        </p>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================
                FEED
            ========================= */}

            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

                <p className="mt-5 text-sm text-white/40">
                  Loading community posts...
                </p>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">

                <h2 className="text-xl font-semibold">
                  No posts yet
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  Be the first one to share
                  something with the community.
                </p>
              </div>
            ) : (
              posts.map(
                (post) => {
                  const userName =
                    post.user?.name ||
                    "CineMate User";

                  const userInitial =
                    userName
                      .charAt(0)
                      .toUpperCase();

                  const isLiked =
                    Boolean(
                      likedPosts[
                        post._id
                      ]
                    );

                  const isOwnPost =
                    String(
                      post.user?._id
                    ) ===
                    String(
                      currentUserId
                    );

                  const postUserId =
                    post.user?._id;

                  const isFollowing =
                    Boolean(
                      followedUsers[
                        postUserId
                      ]
                    );

                  const isEditing =
                    editingPostId ===
                    post._id;

                  return (
                    <article
                      key={post._id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                    >

                      {/* =========================
                          POST HEADER
                      ========================= */}

                      <div className="flex items-center justify-between p-5 sm:p-6">

                        <div className="flex min-w-0 items-center gap-3">

                          {post.user?.profilePicture ? (
                            <img
                              src={
                                post.user
                                  .profilePicture
                              }
                              alt={
                                userName
                              }
                              className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold">
                              {
                                userInitial
                              }
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {
                                userName
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-white/30">
                              {post.createdAt
                                ? new Date(
                                  post.createdAt
                                ).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                        </div>

                        {isOwnPost ? (
                          <div className="flex items-center gap-1">

                            {!isEditing && (
                              <button
                                type="button"
                                aria-label="Edit post"
                                onClick={() =>
                                  handleStartEdit(
                                    post
                                  )
                                }
                                className="rounded-full p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                              >
                                <Pencil
                                  size={18}
                                />
                              </button>
                            )}

                            <button
                              type="button"
                              aria-label="Delete post"
                              onClick={() =>
                                handleDeletePost(
                                  post._id
                                )
                              }
                              disabled={
                                deletingPosts[
                                  post._id
                                ]
                              }
                              className="rounded-full p-2 text-white/30 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                            >
                              {deletingPosts[
                                post._id
                              ] ? (
                                <LoaderCircle
                                  size={18}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={18}
                                />
                              )}
                            </button>

                          </div>
                        ) : (
                          <div className="flex items-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleFollow(
                                  postUserId
                                )
                              }
                              disabled={
                                followLoading[
                                  postUserId
                                ]
                              }
                              className={`flex min-w-[82px] items-center justify-center rounded-full border px-4 py-2 text-xs font-medium transition ${
                                isFollowing
                                  ? "border-white/20 bg-white text-black"
                                  : "border-white/10 text-white/50 hover:border-white/25 hover:text-white"
                              }`}
                            >
                              {followLoading[
                                postUserId
                              ] ? (
                                <LoaderCircle
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : isFollowing ? (
                                "Following"
                              ) : (
                                "Follow"
                              )}
                            </button>

                            <button
                              type="button"
                              aria-label="Post options"
                              className="rounded-full p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
                            >
                              <MoreHorizontal
                                size={19}
                              />
                            </button>

                          </div>
                        )}

                      </div>

                      {/* =========================
                          POST CONTENT
                      ========================= */}

                      <div className="px-5 pb-5 sm:px-6">

                        {isEditing ? (
                          <div className="space-y-3">

                            <textarea
                              value={
                                editingText
                              }
                              onChange={(
                                event
                              ) =>
                                setEditingText(
                                  event.target.value
                                )
                              }
                              rows={4}
                              autoFocus
                              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/30 focus:border-white/25"
                            />

                            <div className="flex flex-wrap gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdatePost(
                                    post._id
                                  )
                                }
                                disabled={
                                  updatingPost[
                                    post._id
                                  ]
                                }
                                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
                              >
                                {updatingPost[
                                  post._id
                                ] ? (
                                  <>
                                    <LoaderCircle
                                      size={14}
                                      className="animate-spin"
                                    />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check
                                      size={14}
                                    />
                                    Save Changes
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={
                                  handleCancelEdit
                                }
                                disabled={
                                  updatingPost[
                                    post._id
                                  ]
                                }
                                className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                              >
                                Cancel
                              </button>

                            </div>

                          </div>
                        ) : (
                          <>
                            {post.text && (
                              <p className="text-sm leading-7 text-white/70">
                                {
                                  post.text
                                }
                              </p>
                            )}
                          </>
                        )}

                        {post.contentId && (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">

                            <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                              Shared Content
                            </p>

                            <p className="mt-2 text-base font-semibold">
                              {post.contentType?.toUpperCase()}
                              {" #"}
                              {
                                post.contentId
                              }
                            </p>

                          </div>
                        )}

                      </div>

                      {/* =========================
                          POST IMAGE
                      ========================= */}

                      {post.mediaUrl && (
                        <div className="aspect-video overflow-hidden border-y border-white/10 bg-white/[0.02]">

                          <img
                            src={
                              post.mediaUrl
                            }
                            alt="Post media"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />

                        </div>
                      )}

                      {/* =========================
                          POST ACTIONS
                      ========================= */}

                      <div className="flex items-center gap-1 px-4 py-3 sm:px-5">

                        <button
                          type="button"
                          onClick={() =>
                            handleLike(
                              post._id
                            )
                          }
                          className={`flex items-center gap-2 rounded-full px-3 py-2 transition ${
                            isLiked
                              ? "text-white"
                              : "text-white/40 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Heart
                            size={18}
                            fill={
                              isLiked
                                ? "currentColor"
                                : "none"
                            }
                          />

                          <span className="text-xs">
                            {
                              post.likesCount ||
                              0
                            }
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleComments(
                              post._id
                            )
                          }
                          className="flex items-center gap-2 rounded-full px-3 py-2 text-white/40 transition hover:bg-white/5 hover:text-white"
                        >
                          <MessageCircle
                            size={18}
                          />

                          <span className="text-xs">
                            {
                              post.commentsCount ||
                              0
                            }
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSharePost(
                              post
                            )
                          }
                          disabled={
                            shareLoading[
                              post._id
                            ]
                          }
                          className="rounded-full p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                          aria-label="Share post"
                        >
                          {shareLoading[
                            post._id
                          ] ? (
                            <LoaderCircle
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <Share2
                              size={18}
                            />
                          )}
                        </button>

                        {post.sharesCount >
                          0 && (
                          <span className="text-xs text-white/40">
                            {
                              post.sharesCount
                            }
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleSavePost(
                              post._id
                            )
                          }
                          disabled={
                            saveLoading[
                              post._id
                            ]
                          }
                          className={`ml-auto rounded-full p-2 transition ${
                            savedPosts[
                              post._id
                            ]
                              ? "text-white"
                              : "text-white/40 hover:bg-white/5 hover:text-white"
                          } disabled:opacity-40`}
                          aria-label={
                            savedPosts[
                              post._id
                            ]
                              ? "Unsave post"
                              : "Save post"
                          }
                        >
                          {saveLoading[
                            post._id
                          ] ? (
                            <LoaderCircle
                              size={18}
                              className="animate-spin"
                            />
                          ) : (
                            <Bookmark
                              size={18}
                              fill={
                                savedPosts[
                                  post._id
                                ]
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          )}
                        </button>

                      </div>

                      {/* =========================
                          COMMENTS
                      ========================= */}

                      {openComments[
                        post._id
                      ] && (
                        <div className="border-t border-white/10 px-5 py-4 sm:px-6">

                          <div className="flex gap-2">

                            <input
                              type="text"
                              value={
                                commentText[
                                  post._id
                                ] || ""
                              }
                              onChange={(
                                event
                              ) =>
                                setCommentText(
                                  (current) => ({
                                    ...current,
                                    [post._id]:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              onKeyDown={(
                                event
                              ) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  handleCommentSubmit(
                                    post._id
                                  );
                                }
                              }}
                              placeholder="Write a comment..."
                              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleCommentSubmit(
                                  post._id
                                )
                              }
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90"
                            >
                              <Send
                                size={16}
                              />
                            </button>

                          </div>

                          <div className="mt-4 space-y-3">

                            {commentsLoading[
                              post._id
                            ] ? (
                              <p className="text-xs text-white/30">
                                Loading comments...
                              </p>
                            ) : comments[
                              post._id
                            ]?.length ? (
                              comments[
                                post._id
                              ].map(
                                (
                                  comment
                                ) => {
                                  const isOwnComment =
                                    String(
                                      comment
                                        .user
                                        ?._id
                                    ) ===
                                    String(
                                      currentUserId
                                    );

                                  const isEditingComment =
                                    editingCommentId ===
                                    comment._id;

                                  return (
                                    <div
                                      key={
                                        comment._id
                                      }
                                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                                    >

                                      <div className="flex items-center gap-2">

                                        {comment
                                          .user
                                          ?.profilePicture ? (
                                          <img
                                            src={
                                              comment
                                                .user
                                                .profilePicture
                                            }
                                            alt={
                                              comment
                                                .user
                                                .name
                                            }
                                            className="h-7 w-7 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-bold">
                                            {(
                                              comment
                                                .user
                                                ?.name ||
                                              "C"
                                            )
                                              .charAt(
                                                0
                                              )
                                              .toUpperCase()}
                                          </div>
                                        )}

                                        <p className="text-xs font-semibold">
                                          {
                                            comment
                                              .user
                                              ?.name
                                          }
                                        </p>

                                      </div>

                                      {isEditingComment ? (
                                        <div className="mt-3 space-y-2">

                                          <textarea
                                            value={
                                              editingCommentText
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              setEditingCommentText(
                                                event
                                                  .target
                                                  .value
                                              )
                                            }
                                            rows={3}
                                            autoFocus
                                            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-white/25"
                                          />

                                          <div className="flex flex-wrap items-center gap-2">

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleUpdateComment(
                                                  comment._id,
                                                  post._id
                                                )
                                              }
                                              disabled={
                                                updatingComment[
                                                  comment._id
                                                ]
                                              }
                                              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                              {updatingComment[
                                                comment._id
                                              ] ? (
                                                <>
                                                  <LoaderCircle
                                                    size={
                                                      12
                                                    }
                                                    className="animate-spin"
                                                  />
                                                  Saving...
                                                </>
                                              ) : (
                                                <>
                                                  <Check
                                                    size={
                                                      12
                                                    }
                                                  />
                                                  Save
                                                </>
                                              )}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={
                                                handleCancelEditComment
                                              }
                                              disabled={
                                                updatingComment[
                                                  comment._id
                                                ]
                                              }
                                              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/45 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                                            >
                                              <X
                                                size={
                                                  12
                                                }
                                              />
                                              Cancel
                                            </button>

                                          </div>

                                        </div>
                                      ) : (
                                        <div className="mt-2 flex items-start justify-between gap-3">

                                          <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-white/60">
                                            {
                                              comment.text
                                            }
                                          </p>

                                          {isOwnComment && (
                                            <div className="flex shrink-0 items-center gap-1">

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleStartEditComment(
                                                    comment
                                                  )
                                                }
                                                aria-label="Edit comment"
                                                className="rounded-full p-1.5 text-white/25 transition hover:bg-white/5 hover:text-white"
                                              >
                                                <Pencil
                                                  size={
                                                    13
                                                  }
                                                />
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleDeleteComment(
                                                    comment._id,
                                                    post._id
                                                  )
                                                }
                                                aria-label="Delete comment"
                                                className="rounded-full p-1.5 text-white/25 transition hover:bg-red-500/10 hover:text-red-400"
                                              >
                                                <Trash2
                                                  size={
                                                    13
                                                  }
                                                />
                                              </button>

                                            </div>
                                          )}

                                        </div>
                                      )}

                                    </div>
                                  );
                                }
                              )
                            ) : (
                              <p className="text-xs text-white/30">
                                No comments yet.
                              </p>
                            )}

                          </div>

                        </div>
                      )}

                    </article>
                  );
                }
              )
            )}

          </section>

          {/* =========================
              SIDEBAR
          ========================= */}

          <aside className="hidden lg:block">

            <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.03] p-6">

              <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                CineMate
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                Build your community
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/35">
                Follow people with similar
                entertainment interests and
                discover what they're watching.
              </p>

              <div className="mt-6 space-y-3">

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium">
                    Share reviews
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Tell others what you think.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium">
                    Follow creators
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Keep up with people you like.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium">
                    Discover content
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Find your next favorite story.
                  </p>
                </div>

              </div>

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
};

export default Social;

