const fs = require("fs");

let pipelinePromise = null;

const MODEL_NAME =
"Xenova/clip-vit-base-patch32";

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
"A scene from the movie or TV show {}",
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
};
