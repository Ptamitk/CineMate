const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const DIST_DIR = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end("Method Not Allowed");
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  const requestedPath = path.resolve(DIST_DIR, "." + pathname);
  if (requestedPath !== DIST_DIR && !requestedPath.startsWith(DIST_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  const sendFile = (filePath) => {
    fs.stat(filePath, (statError, stat) => {
      if (statError || !stat.isFile()) {
        res.writeHead(404);
        return res.end("Not Found");
      }

      res.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "Content-Length": stat.size,
        "X-Content-Type-Options": "nosniff",
      });

      if (req.method === "HEAD") return res.end();
      fs.createReadStream(filePath).pipe(res);
    });
  };

  fs.stat(requestedPath, (error, stat) => {
    if (!error && stat.isFile()) return sendFile(requestedPath);

    // Vite SPA fallback: deep links should load the React app.
    sendFile(path.join(DIST_DIR, "index.html"));
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`CineMate frontend running on port ${PORT}`);
});
