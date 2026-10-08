const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiFetch = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || 15000);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const fetchOptions = { ...options };
    delete fetchOptions.timeoutMs;
    if (!fetchOptions.signal) fetchOptions.signal = controller.signal;
    if (!(fetchOptions.body instanceof FormData)) {
      fetchOptions.headers = { "Content-Type": "application/json", ...(fetchOptions.headers || {}) };
    } else if (fetchOptions.headers?.["Content-Type"]) {
      const headers = { ...fetchOptions.headers };
      delete headers["Content-Type"];
      fetchOptions.headers = headers;
    }
    const response = await fetch(API_BASE_URL + endpoint, fetchOptions);
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof data === "object" && data?.message ? data.message : "API request failed with status " + response.status + ".";
      const error = new Error(message, { cause: data });
      error.status = response.status; error.data = data; throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Request timed out. Please try again.", { cause: error });
    throw error;
  } finally { clearTimeout(timeoutId); }
};

export { API_BASE_URL };