const APIFY_API_URL =
"https://api.apify.com/v2/acts/maximedupre~instagram-downloader-api/run-sync-get-dataset-items";

const normalizeInstagramReelUrl = (reelUrl) => {
if (!reelUrl?.trim()) {
throw new Error(
"Instagram Reel URL is required."
);
}

let url;

try {
url = new URL(reelUrl.trim());
} catch {
throw new Error(
"Invalid Instagram Reel URL."
);
}

const hostname =
url.hostname.toLowerCase();

const isInstagramHost =
hostname === "instagram.com" ||
hostname === "www.instagram.com" ||
hostname.endsWith(".instagram.com");

const isReelPath =
/^\/reels?\/[^/]+\/?$/i.test(
url.pathname
);

if (!isInstagramHost || !isReelPath) {
throw new Error(
"Please provide a valid Instagram Reel URL."
);
}

return {
url: url.toString(),
pathname: url.pathname,
};
};

const getReelMediaInput = async (
reelUrl
) => {
const normalized =
normalizeInstagramReelUrl(
reelUrl
);

const token =
process.env.APIFY_API_TOKEN;

if (!token) {
throw new Error(
"APIFY_API_TOKEN is not configured."
);
}

const response = await fetch(
`${APIFY_API_URL}?token=${encodeURIComponent(
      token
    )}`,
{
method: "POST",


  headers: {
    "Content-Type":
      "application/json",
  },

  body: JSON.stringify({
    discoveryMethod: "urls",

    urls: [
      normalized.url,
    ],
  }),
}


);

if (!response.ok) {
const errorText =
await response.text();


throw new Error(
  `Instagram media service failed: ${response.status} ${errorText}`
);


}

const data =
await response.json();
console.log(
  "APIFY RAW RESULT:",
  JSON.stringify(data, null, 2)
);

const result =
Array.isArray(data)
? data[0]
: data;

const mediaUrl =
result?.download_url ||
result?.video_url ||
result?.url ||
null;

if (!mediaUrl) {
throw new Error(
"Instagram Reel video URL was not returned."
);
}

return {
sourceType: "reel_url",


source: mediaUrl,

mediaPath: null,

mediaUrl,

readyForAnalysis: true,

originalReelUrl:
  normalized.url,

// Instagram Reel caption
caption:
  result?.caption || "",


};
};

module.exports = {
normalizeInstagramReelUrl,
getReelMediaInput,
};
