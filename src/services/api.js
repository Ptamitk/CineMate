const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiFetch = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 15000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { timeoutMs: _timeoutMs, ...fetchOptions } = options;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(fetchOptions.headers || {}),
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const error = new Error(
        typeof data === "object" && data?.message
          ? data.message
          : `API request failed with status ${response.status}.`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export { API_BASE_URL };
