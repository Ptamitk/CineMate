const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "${API_BASE_URL}";
const API_URL = "${API_BASE_URL}/watchlist";

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
"Watchlist Auth Read Error:",
error
);


return null;


}
};

/* =========================
GET WATCHLIST
========================= */

export const getWatchlist = async () => {
try {
const token = getToken();


if (!token) {
  return [];
}

const response = await fetch(API_URL, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();

if (!response.ok) {
  throw new Error(
    data.message ||
      "Failed to fetch watchlist."
  );
}

return data.watchlist || [];


} catch (error) {
console.error(
"Watchlist Read Error:",
error
);


return [];


}
};

/* =========================
CHECK WATCHLIST
========================= */

export const isInWatchlist = async (
contentId,
contentType
) => {
if (!contentId || !contentType) {
return false;
}

const watchlist =
await getWatchlist();

return watchlist.some(
(item) =>
Number(item?.contentId) ===
Number(contentId) &&
item?.contentType === contentType
);
};

/* =========================
ADD TO WATCHLIST
========================= */

export const addToWatchlist = async (
content
) => {
if (
!content?.id ||
!content?.type
) {
return [];
}

try {
const token = getToken();


if (!token) {
  return [];
}

const response = await fetch(API_URL, {
  method: "POST",

  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },

  body: JSON.stringify({
    contentId: content.id,
    contentType: content.type,
    title: content.title,
    image: content.image || "",
    year: content.year || "",
    rating: content.rating || "",
  }),
});

const data = await response.json();

if (!response.ok) {
  throw new Error(
    data.message ||
      "Failed to add to watchlist."
  );
}

return getWatchlist();


} catch (error) {
console.error(
"Watchlist Add Error:",
error
);


return getWatchlist();


}
};

/* =========================
REMOVE FROM WATCHLIST
========================= */

export const removeFromWatchlist = async (
contentId,
contentType
) => {
if (!contentId || !contentType) {
return [];
}

try {
const token = getToken();


if (!token) {
  return [];
}

const response = await fetch(
  `${API_URL}/${contentType}/${contentId}`,
  {
    method: "DELETE",

    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();

if (!response.ok) {
  throw new Error(
    data.message ||
      "Failed to remove from watchlist."
  );
}

return getWatchlist();


} catch (error) {
console.error(
"Watchlist Remove Error:",
error
);


return getWatchlist();


}
};

/* =========================
TOGGLE WATCHLIST
========================= */

export const toggleWatchlist = async (
content
) => {
if (
!content?.id ||
!content?.type
) {
return [];
}

const exists =
await isInWatchlist(
content.id,
content.type
);

if (exists) {
return removeFromWatchlist(
content.id,
content.type
);
}

return addToWatchlist(content);
};
