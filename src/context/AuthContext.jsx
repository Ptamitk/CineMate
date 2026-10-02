import {
createContext,
useContext,
useEffect,
useState,
} from "react";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "cinemate_auth";

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(null);
const [token, setToken] = useState(null);
const [loading, setLoading] = useState(true);

/* TELEGRAM REALTIME SEARCH */
const [telegramSearchResult, setTelegramSearchResult] =
useState(null);

/* TELEGRAM SCENE FINDER */
const [telegramSceneResult, setTelegramSceneResult] =
useState(null);

useEffect(() => {
const restoreAuth = async () => {
try {
const storedAuth =
localStorage.getItem(AUTH_STORAGE_KEY);


    if (!storedAuth) {
      setLoading(false);
      return;
    }

    const parsedAuth =
      JSON.parse(storedAuth);

    if (!parsedAuth?.token) {
      localStorage.removeItem(
        AUTH_STORAGE_KEY
      );

      setLoading(false);
      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/auth/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${parsedAuth.token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Session is no longer valid."
      );
    }

    setToken(parsedAuth.token);
    setUser(data.user);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: parsedAuth.token,
        user: data.user,
      })
    );
  } catch (error) {
    console.error(
      "Auth Restore Error:",
      error
    );

    localStorage.removeItem(
      AUTH_STORAGE_KEY
    );

    setToken(null);
    setUser(null);
  } finally {
    setLoading(false);
  }
};

restoreAuth();


}, []);

/* =================================
TELEGRAM SSE CONNECTION
================================= */

useEffect(() => {
if (!token) {
setTelegramSearchResult(null);
setTelegramSceneResult(null);
return;
}

let stopped = false;
let reconnectTimer = null;
let controller = null;
let reconnectDelay = 1000;
const seenSceneEvents = new Set();

const connectTelegramStream = async () => {
  if (stopped) {
    return;
  }

  controller = new AbortController();

  try {
    const response = await fetch(
      "http://localhost:5000/api/telegram-events/search-stream",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Telegram stream error: ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error(
        "Telegram stream is not supported by this browser."
      );
    }

    reconnectDelay = 1000;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (!stopped) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const dataLine = event
          .split("\n")
          .find((line) => line.startsWith("data:"));

        if (!dataLine) {
          continue;
        }

        const jsonData = dataLine
          .replace(/^data:\s*/, "")
          .trim();

        if (!jsonData) {
          continue;
        }

        try {
          const data = JSON.parse(jsonData);

          if (
            data.type === "search" &&
            Array.isArray(data.results)
          ) {
            setTelegramSearchResult(data);
          }

          if (data.type === "scene") {
            const sceneEventKey =
              data.jobId
                ? `${data.jobId}:${data.status || "unknown"}`
                : "";

            if (
              sceneEventKey &&
              seenSceneEvents.has(sceneEventKey)
            ) {
              continue;
            }

            if (sceneEventKey) {
              seenSceneEvents.add(sceneEventKey);

              if (seenSceneEvents.size > 100) {
                const oldestKey =
                  seenSceneEvents.values().next().value;

                seenSceneEvents.delete(oldestKey);
              }
            }

            setTelegramSceneResult(data);
          }
        } catch (error) {
          console.error(
            "Telegram SSE Parse Error:",
            error
          );
        }
      }
    }

    if (!stopped) {
      scheduleReconnect();
    }
  } catch (error) {
    if (
      error.name !== "AbortError" &&
      !stopped
    ) {
      console.error(
        "Telegram SSE Connection Error:",
        error
      );

      scheduleReconnect();
    }
  }
};

const scheduleReconnect = () => {
  if (stopped || reconnectTimer) {
    return;
  }

  const delay = reconnectDelay;
  reconnectDelay = Math.min(
    reconnectDelay * 2,
    30000
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectTelegramStream();
  }, delay);
};

connectTelegramStream();

return () => {
  stopped = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }

  controller?.abort();
};
}, [token]);

const login = (authData) => {
const {
token: authToken,
...userData
} = authData;


const auth = {
  token: authToken,
  user: userData,
};

localStorage.setItem(
  AUTH_STORAGE_KEY,
  JSON.stringify(auth)
);

setToken(authToken);
setUser(userData);


};

const updateUser = (updatedUser) => {
const updatedAuth = {
token,
user: updatedUser,
};


localStorage.setItem(
  AUTH_STORAGE_KEY,
  JSON.stringify(updatedAuth)
);

setUser(updatedUser);


};

const logout = () => {
localStorage.removeItem(
AUTH_STORAGE_KEY
);


setToken(null);
setUser(null);

setTelegramSearchResult(null);
setTelegramSceneResult(null);


};

const clearTelegramSearchResult = () => {
setTelegramSearchResult(null);
};

const clearTelegramSceneResult = () => {
setTelegramSceneResult(null);
};

const isAuthenticated =
Boolean(token && user);

return (
<AuthContext.Provider
value={{
user,
token,
loading,
isAuthenticated,
login,
updateUser,
logout,


    /* TELEGRAM SEARCH */
    telegramSearchResult,
    clearTelegramSearchResult,

    /* TELEGRAM SCENE FINDER */
    telegramSceneResult,
    clearTelegramSceneResult,
  }}
>
  {children}
</AuthContext.Provider>


);
};

export const useAuth = () => {
const context =
useContext(AuthContext);

if (!context) {
throw new Error(
"useAuth must be used inside AuthProvider"
);
}

return context;
};
