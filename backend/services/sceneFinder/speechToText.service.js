const fs = require("fs");

const {
pipeline,
} = require("@huggingface/transformers");

const {
WaveFile,
} = require("wavefile");

let transcriber = null;
let transcriberPromise = null;

const getTranscriber = async () => {
if (transcriber) {
return transcriber;
}

if (transcriberPromise) {
return transcriberPromise;
}

console.log(
"Loading Whisper speech-to-text model..."
);

transcriberPromise =
pipeline(
"automatic-speech-recognition",
"Xenova/whisper-tiny.en"
)
.then((model) => {
transcriber = model;


    console.log(
      "Whisper model loaded successfully."
    );

    return transcriber;
  })
  .catch((error) => {
    transcriberPromise = null;

    throw error;
  });


return transcriberPromise;
};

const loadWavAudio = (
audioPath
) => {
if (!fs.existsSync(audioPath)) {
throw new Error(
"Audio file was not found."
);
}

const buffer =
fs.readFileSync(audioPath);

const wav =
new WaveFile(buffer);

wav.toBitDepth("32f");

const samples =
wav.getSamples();

const sampleRate =
wav.fmt.sampleRate;

let audioData;

if (Array.isArray(samples)) {
if (samples.length > 1) {
const left = samples[0];
const right = samples[1];


  const length = Math.min(
    left.length,
    right.length
  );

  audioData =
    new Float32Array(
      length
    );

  for (
    let i = 0;
    i < length;
    i++
  ) {
    audioData[i] =
      (left[i] +
        right[i]) /
      2;
  }
} else {
  audioData =
    Float32Array.from(
      samples[0] || []
    );
}


} else {
audioData =
Float32Array.from(
samples || []
);
}

return {
audioData,
sampleRate,
};
};

const MAX_TRANSCRIPTION_CHARS = Math.max(
  200,
  Number(
    process.env.SCENE_FINDER_MAX_TRANSCRIPTION_CHARS ||
      12000
  )
);

const transcribeAudio = async (
audioPath
) => {
if (!audioPath) {
throw new Error(
"Audio path is required for speech-to-text."
);
}

const transcriber =
await getTranscriber();

const {
audioData,
sampleRate,
} =
loadWavAudio(audioPath);

console.log(
`Audio loaded: ${sampleRate} Hz`
);

const result =
await transcriber(
audioData,
{
sampling_rate:
sampleRate,


    chunk_length_s: 30,

    stride_length_s: 5,
  }
);


return {
text:
(result.text?.trim() || "").slice(
  0,
  MAX_TRANSCRIPTION_CHARS
),
};
};

module.exports = {
transcribeAudio,
};
