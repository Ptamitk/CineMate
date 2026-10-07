const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_URL =
  API_BASE_URL + "/notifications";

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
      "Notifications Auth Error:",
      error
    );

    return null;
  }
};

export const getNotifications =
  async () => {
    try {
      const token = getToken();

      if (!token) {
        return [];
      }

      const response = await fetch(
        API_URL + "?page=1&limit=50",
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
            "Failed to fetch notifications."
        );
      }

      return data.notifications || [];
    } catch (error) {
      console.error(
        "Get Notifications Error:",
        error
      );

      return [];
    }
  };

export const markNotificationAsRead =
  async (notificationId) => {
    if (!notificationId) {
      return false;
    }

    try {
      const token = getToken();

      if (!token) {
        return false;
      }

      const response = await fetch(
        `${API_URL}/${notificationId}/read`,
        {
          method: "PUT",
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
            "Failed to mark notification as read."
        );
      }

      return true;
    } catch (error) {
      console.error(
        "Mark Notification Error:",
        error
      );

      return false;
    }
  };

  export const getUnreadNotificationCount = async () => {
  try {
    const token = getToken();
    if (!token) return 0;

    const response = await fetch(
      API_URL + "/unread-count",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch unread notifications.");
    }

    return Number(data.count) || 0;
  } catch (error) {
    console.error("Unread Notifications Error:", error);
    return 0;
  }
};
