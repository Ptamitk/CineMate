const {
searchMulti,
} = require("../../services/tmdb.service");

const detectIntent = (message = "") => {
const text = message.trim();

if (!text) {
return {
type: "unknown",
value: "",
};
}

if (
/^https?:\/\//i.test(text)
) {
return {
type: "link",
value: text,
};
}

return {
type: "content_search",
value: text,
};
};

const handleIntent = async (
message = ""
) => {
const intent =
detectIntent(message);

if (
intent.type === "unknown"
) {
return {
type: "unknown",
message:
"I couldn't understand the request.",
};
}

if (
intent.type === "link"
) {
return {
type: "link",
value: intent.value,
message:
"This link can be processed by CineMate.",
};
}

const results =
await searchMulti(
intent.value
);

return {
type: "content_search",
query: intent.value,
results:
results.results || [],
};
};

module.exports = {
detectIntent,
handleIntent,
};
