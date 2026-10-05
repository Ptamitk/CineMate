const fs = require("fs");

let pipelinePromise = null;

const MODEL_NAME =
"Xenova/clip-vit-base-patch32";

let imageEmbeddingPipelinePromise = null;

const loadImageEmbeddingModel = async () => {
  if (!imageEmbeddingPipelinePromise) {
    imageEmbeddingPipelinePromise =
      import("@huggingface/transformers")
        .then(async ({ pipeline }) => {
          console.log(
            "Loading CLIP image embedding model..."
          );

          const model = await pipeline(
            "image-feature-extraction",
            MODEL_NAME
          );

          console.log(
            "CLIP image embedding model loaded successfully."
          );

          return model;
        })
        .catch((error) => {
          imageEmbeddingPipelinePromise = null;

          console.error(
            "CLIP image embedding model loading failed:",
            error.message
          );

          throw error;
        });
  }

  return imageEmbeddingPipelinePromise;
};

const tensorToVectors = (output, expectedCount) => {
  if (!output) {
    return [];
  }

  const data = Array.from(output.data || output);
  const size = Number(output.size || 0);

  if (!data.length) {
    return [];
  }

  const vectorSize =
    size && expectedCount
      ? Math.floor(size / expectedCount)
      : 512;

  const vectors = [];

  for (
    let index = 0;
    index + vectorSize <= data.length;
    index += vectorSize
  ) {
    const vector = data
      .slice(index, index + vectorSize)
      .map(Number);

    const magnitude = Math.sqrt(
      vector.reduce(
        (sum, value) =>
          sum + value * value,
        0
      )
    );

    if (!magnitude) {
      continue;
    }

    vectors.push(
      vector.map(
        (value) => value / magnitude
      )
    );
  }

  return vectors;
};

const cosineSimilarity = (a, b) => {
  const length = Math.min(
    a.length,
    b.length
  );

  let score = 0;

  for (let index = 0; index < length; index += 1) {
    score += a[index] * b[index];
  }

  return score;
};

const extractImageEmbeddings = async (
  images = []
) => {
  if (!Array.isArray(images) || !images.length) {
    return [];
  }

  const model =
    await loadImageEmbeddingModel();

  const output = await model(
    images,
    {
      pool: true,
    }
  );

  return tensorToVectors(
    output,
    images.length
  );
};

const analyzeArtworkSimilarity = async ({
  frameFiles = [],
  candidateArtwork = [],
}) => {
  if (!Array.isArray(frameFiles) || !frameFiles.length) return [];
  if (!Array.isArray(candidateArtwork) || !candidateArtwork.length) return [];

  const validArtwork = candidateArtwork.filter(
    (item) => item?.label && item?.imageUrl
  );

  if (!validArtwork.length) return [];

  try {
    const frameEmbeddings = await extractImageEmbeddings(frameFiles);
    if (frameEmbeddings.length !== frameFiles.length) return [];

    const artworkResults = [];
    const chunkSize = Math.max(
      4,
      Math.min(24, Number(process.env.SCENE_FINDER_ARTWORK_EMBED_BATCH || 16))
    );

    for (let start = 0; start < validArtwork.length; start += chunkSize) {
      const chunk = validArtwork.slice(start, start + chunkSize);
      const embeddings = await extractImageEmbeddings(
        chunk.map((item) => item.imageUrl)
      );

      for (let index = 0; index < chunk.length; index += 1) {
        const artworkEmbedding = embeddings[index];
        if (!artworkEmbedding) continue;

        const similarities = frameEmbeddings
          .map((frameEmbedding) =>
            cosineSimilarity(frameEmbedding, artworkEmbedding)
          )
          .filter(Number.isFinite)
          .sort((a, b) => b - a);

        if (!similarities.length) continue;

        const topScores = similarities.slice(0, 3);
        const averageTopScore =
          topScores.reduce((sum, score) => sum + score, 0) /
          topScores.length;

        artworkResults.push({
          label: chunk[index].label,
          contentId: chunk[index].contentId,
          contentType: chunk[index].contentType,
          imageSimilarity: Number(
            Math.max(0, Math.min(1, averageTopScore)).toFixed(4)
          ),
          imageMaxSimilarity: Number(
            Math.max(0, Math.min(1, similarities[0] || 0)).toFixed(4)
          ),
          imageFramesMatched: similarities.filter((score) => score >= 0.72).length,
        });
      }
    }

    return artworkResults.sort(
      (a, b) => b.imageSimilarity - a.imageSimilarity
    );
  } catch (error) {
    console.error("Artwork similarity analysis failed:", error.message);
    return [];
  }
};

/*
Load the CLIP feature-extraction pipeline
only once and reuse it for all frames.
*/

const loadVisionModel = async () => {
if (!pipelinePromise) {
pipelinePromise =
import("@huggingface/transformers")
.then(
async ({
pipeline,
}) => {
console.log(
"Loading visual recognition model..."
);


        const model =
          await pipeline(
            "zero-shot-image-classification",
            MODEL_NAME
          );

        console.log(
          "Visual recognition model loaded successfully."
        );

        return model;
      }
    )
    .catch((error) => {
      pipelinePromise = null;

      console.error(
        "Visual recognition model loading failed:",
        error.message
      );

      throw error;
    });


}

return pipelinePromise;
};

/*
Analyze one frame against a list of
possible visual descriptions.
*/

const classifyFrame = async ({
framePath,
candidateLabels = [],
}) => {
if (!framePath) {
return [];
}

if (!fs.existsSync(framePath)) {
console.warn(
"Visual recognition frame not found:",
framePath
);


return [];


}

if (
!Array.isArray(candidateLabels) ||
candidateLabels.length === 0
) {
return [];
}

const model =
await loadVisionModel();

const results =
await model(
framePath,
candidateLabels,
{
hypothesis_template:
"A frame from {}",
}
);

return results.map(
(result) => ({
label:
result.label,


  score:
    Number(
      result.score.toFixed(4)
    ),
})


);
};

/*
Analyze multiple extracted frames.

The labels are supplied by the candidate
movies/series found through TMDB.

Example:

[
"Spider-Man: Brand New Day",
"Avengers: Endgame",
"Interstellar"
]
*/

const analyzeVisualRecognition = async ({
frameFiles = [],
candidateLabels = [],
}) => {
if (
!Array.isArray(frameFiles) ||
frameFiles.length === 0
) {
return {
framesAnalyzed: 0,
matches: [],
};
}

if (
!Array.isArray(candidateLabels) ||
candidateLabels.length === 0
) {
return {
framesAnalyzed: 0,
matches: [],
};
}

const frameResults = [];

for (const framePath of frameFiles) {
try {
const results =
await classifyFrame({
framePath,
candidateLabels,
});


  frameResults.push({
    framePath,
    results,
  });

  console.log(
    "Visual frame analyzed:",
    framePath
  );
} catch (error) {
  console.error(
    "Visual frame analysis error:",
    error.message
  );
}


}

/*
Aggregate scores across frames.

```
If the same movie gets a strong score
across multiple frames, its overall
visual confidence increases.
```

*/

const scoreMap =
new Map();

for (const frame of frameResults) {
  const frameMaxScore = Math.max(
    ...frame.results.map(
      (result) => Number(result.score || 0)
    ),
    0
  );

  for (const result of frame.results) {
    const rawScore = Number(
      result.score || 0
    );

    const relativeScore =
      frameMaxScore > 0
        ? rawScore / frameMaxScore
        : 0;

    if (!scoreMap.has(result.label)) {
      scoreMap.set(
        result.label,
        {
          totalScore: 0,
          frameCount: 0,
          maxScore: 0,
          totalRelativeScore: 0,
          maxRelativeScore: 0,
          topFrameCount: 0,
        }
      );
    }

    const current =
      scoreMap.get(result.label);

    current.totalScore += rawScore;
    current.frameCount += 1;
    current.maxScore =
      Math.max(
        current.maxScore,
        rawScore
      );

    current.totalRelativeScore +=
      relativeScore;

    current.maxRelativeScore =
      Math.max(
        current.maxRelativeScore,
        relativeScore
      );

    /*
     * A label being returned is not enough: CLIP returns every
     * supplied label. Count a frame as supporting evidence only
     * when the title is both near the frame winner and among the
     * top two predictions.
     */
    const resultRank =
      frame.results.findIndex(
        (item) => item.label === result.label
      );

    if (
      resultRank >= 0 &&
      resultRank < 2 &&
      relativeScore >= 0.75
    ) {
      current.topFrameCount += 1;
    }
  }
}

const matches =
Array.from(
  scoreMap.entries()
)
.map(
  ([
    label,
    data,
  ]) => ({
    label,

    averageScore:
      Number(
        (
          data.totalScore /
          data.frameCount
        ).toFixed(4)
      ),

    maxScore:
      Number(
        data.maxScore.toFixed(4)
      ),

    relativeAverageScore:
      Number(
        (
          data.totalRelativeScore /
          data.frameCount
        ).toFixed(4)
      ),

    relativeMaxScore:
      Number(
        data.maxRelativeScore.toFixed(4)
      ),

    framesMatched:
      data.frameCount,

    topFrameCount:
      data.topFrameCount,
  })
)
.sort(
  (a, b) =>
    b.relativeAverageScore -
    a.relativeAverageScore
);


return {
framesAnalyzed:
frameResults.length,


frameResults,

matches,


};
};

module.exports = {
analyzeVisualRecognition,
classifyFrame,
analyzeArtworkSimilarity,
};
