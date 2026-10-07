const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API_URL =
  API_BASE_URL + "/posts";

const getToken = () => {
  try {
    const storedAuth =
      localStorage.getItem(
        "cinemate_auth"
      );

    if (!storedAuth) {
      return null;
    }

    const parsedAuth =
      JSON.parse(storedAuth);

    return parsedAuth?.token || null;
  } catch (error) {
    console.error(
      "Posts Auth Error:",
      error
    );

    return null;
  }
};

export const updatePost = async (
  postId,
  text
) => {
  if (!postId) {
    return null;
  }

  try {
    const token = getToken();

    if (!token) {
      return null;
    }

    const response = await fetch(
      `${API_URL}/${postId}`,
      {
        method: "PUT",
        headers: {
          Authorization:
            `Bearer ${token}`,
          "Content-Type":
            "application/json",
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
          "Failed to update post."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Update Post Error:",
      error
    );

    return null;
  }
};

