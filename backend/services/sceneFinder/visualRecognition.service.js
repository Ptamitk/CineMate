const fs = require("fs");
let pipelinePromise = null;
const MODEL_NAME = "Xenova/clip-vit-base-patch32";
let imageEmbeddingPipelinePromise = null;

const loadImageEmbeddingModel = async () => {
  if (!imageEmbeddingPipelinePromise) {
    imageEmbeddingPipelinePromise = import("@huggingface/transformers").then(async ({ pipeline }) => {
      console.log("Loading CLIP image embedding model...");
      const model = await pipeline("image-feature-extraction", MODEL_NAME);
      console.log("CLIP image embedding model loaded successfully.");
      return model;
    }).catch(error => { imageEmbeddingPipelinePromise = null; throw error; });
  }
  return imageEmbeddingPipelinePromise;
};

const loadVisionModel = async () => {
  if (!pipelinePromise) {
    pipelinePromise = import("@huggingface/transformers").then(async ({ pipeline }) => {
      console.log("Loading CLIP zero-shot scene model...");
      return pipeline("zero-shot-image-classification", MODEL_NAME);
    }).catch(error => { pipelinePromise = null; throw error; });
  }
  return pipelinePromise;
};

const tensorToVectors = (output, expectedCount) => {
  if (!output) return [];
  const data = Array.from(output.data || output);
  const size = Number(output.size || 0);
  if (!data.length) return [];
  const vectorSize = size && expectedCount ? Math.floor(size / expectedCount) : 512;
  const vectors = [];
  for (let i = 0; i + vectorSize <= data.length; i += vectorSize) {
    const vector = data.slice(i, i + vectorSize).map(Number);
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (magnitude) vectors.push(vector.map(value => value / magnitude));
  }
  return vectors;
};

const cosineSimilarity = (a, b) => {
  const length = Math.min(a.length, b.length);
  let score = 0;
  for (let i = 0; i < length; i += 1) score += a[i] * b[i];
  return score;
};

const extractImageEmbeddings = async (images = []) => {
  if (!Array.isArray(images) || !images.length) return [];
  const model = await loadImageEmbeddingModel();
  return tensorToVectors(await model(images), images.length);
};

const temporalConsistency = (scores, threshold = 0.72) => {
  const indexes = scores.map((score, index) => score >= threshold ? index : -1).filter(index => index >= 0);
  if (indexes.length < 2) return 0;
  let longest = 1, current = 1;
  for (let i = 1; i < indexes.length; i += 1) {
    current = indexes[i] === indexes[i - 1] + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return Math.min(1, (longest / Math.max(2, scores.length)) * 1.8);
};

const analyzeArtworkSimilarity = async ({ frameFiles = [], candidateArtwork = [] }) => {
  if (!Array.isArray(frameFiles) || !frameFiles.length || !Array.isArray(candidateArtwork) || !candidateArtwork.length) return [];
  const validArtwork = candidateArtwork.filter(item => item?.imageUrl);
  if (!validArtwork.length) return [];

  try {
    const frameEmbeddings = await extractImageEmbeddings(frameFiles);
    if (frameEmbeddings.length !== frameFiles.length) return [];
    const artworkResults = [];
    const chunkSize = Math.max(4, Math.min(24, Number(process.env.SCENE_FINDER_ARTWORK_EMBED_BATCH || 16)));

    for (let start = 0; start < validArtwork.length; start += chunkSize) {
      const chunk = validArtwork.slice(start, start + chunkSize);
      const embeddings = await extractImageEmbeddings(chunk.map(item => item.imageUrl));

      for (let index = 0; index < chunk.length; index += 1) {
        const artworkEmbedding = embeddings[index];
        if (!artworkEmbedding) continue;
        const frameScores = frameEmbeddings.map(frame => cosineSimilarity(frame, artworkEmbedding));
        const similarities = [...frameScores].sort((a, b) => b - a);
        const topScores = similarities.slice(0, 3);
        if (!topScores.length) continue;
        const averageTopScore = topScores.reduce((sum, value) => sum + value, 0) / topScores.length;
        const matchedIndexes = frameScores.map((score, i) => score >= 0.72 ? i : -1).filter(i => i >= 0);

        artworkResults.push({
          label: chunk[index].label || "",
          contentId: chunk[index].contentId,
          contentType: chunk[index].contentType,
          seasonNumber: chunk[index].seasonNumber,
          episodeNumber: chunk[index].episodeNumber,
          episodeName: chunk[index].episodeName || "",
          imageSimilarity: Number(Math.max(0, Math.min(1, averageTopScore)).toFixed(4)),
          imageMaxSimilarity: Number(Math.max(0, Math.min(1, similarities[0] || 0)).toFixed(4)),
          imageFramesMatched: matchedIndexes.length,
          matchedFrameIndexes: matchedIndexes,
          temporalConsistency: Number(temporalConsistency(frameScores).toFixed(4))
        });
      }
    }
    return artworkResults.sort((a, b) => b.imageSimilarity - a.imageSimilarity);
  } catch (error) {
    console.error("Artwork similarity analysis failed:", error.message);
    return [];
  }
};

const analyzeCandidateVisualLabels = async ({ frameFiles = [], candidates = [] }) => {
  if (!Array.isArray(frameFiles) || !frameFiles.length || !Array.isArray(candidates) || candidates.length < 2) return [];

  const selected = candidates.filter(item => item?.title).slice(0, Math.max(4, Math.min(28, Number(process.env.SCENE_FINDER_VISUAL_LABEL_CANDIDATES || 24))));
  if (selected.length < 2) return [];

  try {
    const model = await loadVisionModel();
    const labels = selected.map(item => item.title);
    const rows = selected.map(item => ({ item, frameScores: [] }));

    for (let frameIndex = 0; frameIndex < frameFiles.length; frameIndex += 1) {
      try {
        const results = await model(frameFiles[frameIndex], labels, {
          hypothesis_template: "A movie or TV scene from {}."
        });

        const byLabel = new Map(results.map(result => [String(result.label), Number(result.score || 0)]));
        const raw = labels.map(label => byLabel.get(label) || 0);
        const sorted = [...raw].sort((a, b) => b - a);
        const high = sorted[0] || 0;
        const low = sorted[Math.min(sorted.length - 1, Math.max(2, Math.floor(sorted.length * 0.65)))] || 0;
        const range = Math.max(0.04, high - low);

        rows.forEach((row, index) => {
          const score = raw[index];
          row.frameScores.push(Math.max(0, Math.min(1, (score - low) / range)));
        });
      } catch (error) {
        console.error("Candidate visual classification frame failed:", error.message);
      }
    }

    return rows.map(row => {
      const scores = row.frameScores;
      const sorted = [...scores].sort((a, b) => b - a);
      const top = sorted.slice(0, Math.min(5, sorted.length));
      const average = top.length ? top.reduce((sum, value) => sum + value, 0) / top.length : 0;
      const matched = scores.filter(value => value >= 0.65).length;
      const temporal = temporalConsistency(scores, 0.65);

      return {
        contentId: row.item.contentId,
        contentType: row.item.contentType,
        label: row.item.title,
        visualLabelScore: Number(average.toFixed(4)),
        visualLabelMax: Number((sorted[0] || 0).toFixed(4)),
        visualLabelMatchedFrames: matched,
        visualLabelTemporalConsistency: Number(temporal.toFixed(4))
      };
    }).sort((a, b) => b.visualLabelScore - a.visualLabelScore);
  } catch (error) {
    console.error("Candidate visual classification failed:", error.message);
    return [];
  }
};

// Retained legacy zero-shot API for compatibility.
const classifyFrame = async ({ framePath, candidateLabels = [] }) => {
  if (!framePath || !fs.existsSync(framePath) || !candidateLabels.length) return [];
  const model = await loadVisionModel();
  const results = await model(framePath, candidateLabels, { hypothesis_template: "A frame from {}" });
  return results.map(result => ({ label: result.label, score: Number(result.score.toFixed(4)) }));
};

const analyzeVisualRecognition = async ({ frameFiles = [], candidateLabels = [] }) => {
  const frameResults = [];
  for (const framePath of frameFiles) {
    try {
      frameResults.push({ framePath, results: await classifyFrame({ framePath, candidateLabels }) });
    } catch (error) {
      console.error("Visual frame analysis error:", error.message);
    }
  }
  return { framesAnalyzed: frameResults.length, frameResults, matches: [] };
};

module.exports = {
  analyzeVisualRecognition,
  classifyFrame,
  analyzeArtworkSimilarity,
  analyzeCandidateVisualLabels
};
