const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isDialogueLike,
  isTitleCandidate,
  shouldRejectSpeechOnlyMatch,
} = require("../services/sceneFinder/sceneDecisionGuard.service");

const {
  parseFfmpegMetadata,
} = require("../services/sceneFinder/videoAnalysis.service");

const {
  extractQueries,
} = require("../services/sceneFinder/sceneDiscovery.service");

test("dialogue-only sentence is not treated as a title candidate", () => {
  assert.equal(isTitleCandidate("What's wrong with you?"), false);
  assert.equal(isDialogueLike("What's wrong with you?"), true);
});

test("title-like text remains valid", () => {
  assert.equal(isTitleCandidate("The Dark Knight"), true);
  assert.equal(isTitleCandidate("Movie: The Dark Knight"), false);
});

test("speech-only discovery query is rejected when it is conversational dialogue", () => {
  const queries = extractQueries({
    caption: "",
    ocr: "",
    speech: "What's wrong with you?",
  });

  assert.equal(queries.length, 0);
});

test("language-only metadata parser extracts visible video profile", () => {
  const parsed = parseFfmpegMetadata(`
    Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'clip.mp4':
    Metadata:
    major_brand: isom
    minor_version: 1
    Duration: 00:00:23.40, start: 0.000000, bitrate: 1732000
    Stream #0:0(eng): Video: h264 (High), yuv420p, 1280x720 [SAR 1:1 DAR 16:9], 29.97 fps, 29.97 tbr, 30k tbn
    Stream #0:1(eng): Audio: aac (LC), 48000 Hz, stereo
  `);

  assert.equal(parsed.valid, true);
  assert.equal(parsed.width, 1280);
  assert.equal(parsed.height, 720);
  assert.equal(parsed.aspectRatio, 1280 / 720);
  assert.equal(parsed.audioPresent, true);
});

test("speech-only match is rejected as unsafe when visual evidence is weak", () => {
  const rejection = shouldRejectSpeechOnlyMatch({
    bestMatch: {
      evidenceType: "text-corroborated",
      title: "What’s wrong with you?",
    },
    evidence: {
      visualLabelScore: 0.1,
      artworkAverage: 0.12,
    },
    speechText: "What's wrong with you?",
  });

  assert.equal(rejection, true);
});
