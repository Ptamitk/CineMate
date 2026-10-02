const SOCIAL_STORAGE_KEY = "cinemate_social_posts";

const getStoredPosts = () => {
try {
const stored = localStorage.getItem(SOCIAL_STORAGE_KEY);


if (!stored) {
  return [];
}

const parsed = JSON.parse(stored);

return Array.isArray(parsed) ? parsed : [];


} catch (error) {
console.error("Social Posts Read Error:", error);
return [];
}
};

const savePosts = (posts) => {
try {
localStorage.setItem(
SOCIAL_STORAGE_KEY,
JSON.stringify(posts)
);


return posts;


} catch (error) {
console.error("Social Posts Save Error:", error);
return posts;
}
};

export const socialService = {
getPosts() {
return getStoredPosts();
},

createPost(postData) {
const posts = getStoredPosts();


const newPost = {
  id: `post-${Date.now()}`,
  author: postData.author || {
    name: "CineMate User",
    avatar: "",
  },
  content: postData.content || "",
  sharedContent: postData.sharedContent || null,
  image: postData.image || "",
  likes: [],
  comments: [],
  shares: 0,
  saves: [],
  createdAt: new Date().toISOString(),
};

return savePosts([newPost, ...posts]);

},

toggleLike(postId, userId = "current-user") {
const posts = getStoredPosts();


const updatedPosts = posts.map((post) => {
  if (post.id !== postId) {
    return post;
  }

  const likes = Array.isArray(post.likes)
    ? post.likes
    : [];

  const alreadyLiked = likes.includes(userId);

  return {
    ...post,
    likes: alreadyLiked
      ? likes.filter((id) => id !== userId)
      : [...likes, userId],
  };
});

return savePosts(updatedPosts);


},

toggleSave(postId, userId = "current-user") {
const posts = getStoredPosts();


const updatedPosts = posts.map((post) => {
  if (post.id !== postId) {
    return post;
  }

  const saves = Array.isArray(post.saves)
    ? post.saves
    : [];

  const alreadySaved = saves.includes(userId);

  return {
    ...post,
    saves: alreadySaved
      ? saves.filter((id) => id !== userId)
      : [...saves, userId],
  };
});

return savePosts(updatedPosts);


},

addComment(postId, commentData) {
const posts = getStoredPosts();


const updatedPosts = posts.map((post) => {
  if (post.id !== postId) {
    return post;
  }

  const comments = Array.isArray(post.comments)
    ? post.comments
    : [];

  const newComment = {
    id: `comment-${Date.now()}`,
    author: commentData.author || {
      name: "CineMate User",
      avatar: "",
    },
    text: commentData.text || "",
    createdAt: new Date().toISOString(),
  };

  return {
    ...post,
    comments: [...comments, newComment],
  };
});

return savePosts(updatedPosts);


},

incrementShare(postId) {
const posts = getStoredPosts();


const updatedPosts = posts.map((post) => {
  if (post.id !== postId) {
    return post;
  }

  return {
    ...post,
    shares: (post.shares || 0) + 1,
  };
});

return savePosts(updatedPosts);


},

deletePost(postId) {
const posts = getStoredPosts();


const updatedPosts = posts.filter(
  (post) => post.id !== postId
);

return savePosts(updatedPosts);


},
};

export default socialService;
