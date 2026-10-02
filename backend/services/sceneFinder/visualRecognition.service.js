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
{
candidate_labels:
candidateLabels,
hypothesis_template:
"A scene from {}",
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
for (const result of frame.results) {
if (
!scoreMap.has(result.label)
) {
scoreMap.set(
result.label,
{
totalScore: 0,
frameCount: 0,
maxScore: 0,
}
);
}


  const current =
    scoreMap.get(
      result.label
    );

  current.totalScore +=
    result.score;

  current.frameCount += 1;

  current.maxScore =
    Math.max(
      current.maxScore,
      result.score
    );
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

      framesMatched:
        data.frameCount,
    })
  )
  .sort(
    (a, b) =>
      b.averageScore -
      a.averageScore
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
