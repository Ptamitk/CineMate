const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calculateCandidateScore,
  normalizeTitle,
} = require("../../services/sceneFinder/sceneMatcher.service");

test("normalizeTitle removes articles and normalizes punctuation", () => {
  assert.equal(
    normalizeTitle("The Dark-Knight"),
    "dark knight"
  );
});

test("exact distinctive title gets strong caption evidence", () => {
  const result = calculateCandidateScore({
    candidate: {
      title: "Dhurandhar",
      originalTitle: "Dhurandhar",
      releaseDate: "2025-12-05",
      contentType: "movie",
    },
    extractedCaptionTitle: "Dhurandhar",
    captionYear: 2025,
    captionType: "movie",
  });

  assert.equal(result.captionTitleExact, 1);
  assert.equal(result.evidenceType, "caption-exact");
  assert.ok(result.finalScore >= 0.98);
});

test("generic promotional caption is not accepted as a title", () => {
  const result = calculateCandidateScore({
    candidate: {
      title: "Now",
      originalTitle: "Now",
      releaseDate: "2024-01-01",
      contentType: "movie",
    },
    extractedCaptionTitle: "Now Playing",
    captionYear: null,
    captionType: "",
  });

  assert.notEqual(result.evidenceType, "caption-exact");
  assert.ok(result.finalScore < 0.9);
});

test("single weak dialogue signal stays below strong text acceptance", () => {
  const result = calculateCandidateScore({
    candidate: {
      title: "Home",
      originalTitle: "Home",
      releaseDate: "2015-01-01",
      contentType: "movie",
    },
    ocrText: "",
    speechText: "I am going home now",
  });

  assert.ok(result.finalScore < 0.62);
});
