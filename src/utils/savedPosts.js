const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API_URL =
  "${API_BASE_URL}/saved-posts";

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
      "Saved Posts Auth Error:",
      error
    );

    return null;
  }
};

export const getSavedPosts = async () => {
  try {
    const token = getToken();

    if (!token) {
      return [];
    }

    const response =
      await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      });

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch saved posts."
      );
    }

    return data.savedPosts || [];
  } catch (error) {
    console.error(
      "Get Saved Posts Error:",
      error
    );

    return [];
  }
};

export const isPostSaved = async (
  postId
) => {
  if (!postId) {
    return false;
  }

  try {
    const token = getToken();

    if (!token) {
      return false;
    }

    const response =
      await fetch(
        `${API_URL}/${postId}`,
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
          "Failed to check saved status."
      );
    }

    return Boolean(data.saved);
  } catch (error) {
    console.error(
      "Check Saved Post Error:",
      error
    );

    return false;
  }
};

export const toggleSavedPost =
  async (postId) => {
    if (!postId) {
      return false;
    }

    try {
      const token = getToken();

      if (!token) {
        return false;
      }

      const response =
        await fetch(
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
            "Failed to update saved post."
        );
      }

      return Boolean(
        data.saved
      );
    } catch (error) {
      console.error(
        "Toggle Saved Post Error:",
        error
      );

      return false;
    }
  };

