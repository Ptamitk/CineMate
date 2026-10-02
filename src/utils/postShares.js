const API_URL =
  "http://localhost:5000/api/post-shares";

const getToken = () => {
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
      "Share Auth Error:",
      error
    );

    return null;
  }
};

export const sharePost = async (
  postId
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
          "Failed to share post."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Share Post Error:",
      error
    );

    return null;
  }
};