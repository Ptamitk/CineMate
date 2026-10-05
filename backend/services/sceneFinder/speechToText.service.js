const fs=require("fs");
const {pipeline}=require("@huggingface/transformers");
const {WaveFile}=require("wavefile");
let transcriber=null,transcriberPromise=null;

const getTranscriber=async()=>{
  if(transcriber)return transcriber;
  if(transcriberPromise)return transcriberPromise;
  const modelName=process.env.SCENE_FINDER_WHISPER_MODEL||"Xenova/whisper-tiny";
  console.log(`Loading Whisper speech-to-text model: ${modelName}`);
  transcriberPromise=pipeline("automatic-speech-recognition",modelName).then(model=>{
    transcriber=model; console.log("Whisper model loaded successfully."); return model;
  }).catch(error=>{transcriberPromise=null;throw error;});
  return transcriberPromise;
};

const MAX_WAV_BYTES=Math.max(5*1024*1024,Number(process.env.SCENE_FINDER_MAX_AUDIO_BYTES||25*1024*1024));
const loadWavAudio=audioPath=>{
  if(!fs.existsSync(audioPath))throw new Error("Audio file was not found.");
  if(fs.statSync(audioPath).size>MAX_WAV_BYTES)throw new Error("Audio file exceeds the Scene Finder Whisper memory safety limit.");
  const wav=new WaveFile(fs.readFileSync(audioPath)); wav.toBitDepth("32f");
  const samples=wav.getSamples(),sampleRate=wav.fmt.sampleRate;
  let audioData;
  if(Array.isArray(samples)){
    if(samples.length>1){
      const left=samples[0],right=samples[1],length=Math.min(left.length,right.length);
      audioData=new Float32Array(length);
      for(let i=0;i<length;i++)audioData[i]=(left[i]+right[i])/2;
    }else audioData=Float32Array.from(samples[0]||[]);
  }else audioData=Float32Array.from(samples||[]);
  return {audioData,sampleRate};
};

const cleanTranscript=(value="")=>{
  const raw=String(value).replace(/\s+/g," ").trim();
  if(!raw)return "";
  const words=raw.split(" ").filter(Boolean);
  if(words.length<3)return raw;
  const unique=new Set(words.map(w=>w.toLowerCase().replace(/[^\p{L}\p{N}]/gu,"")));
  // Whisper hallucinations often repeat a tiny vocabulary for most of a short clip.
  if(words.length>=12 && unique.size/words.length<0.22)return "";
  const kept=[]; let run=0,last="";
  for(const word of words){
    const normalized=word.toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
    if(normalized&&normalized===last){run+=1;if(run>=3)continue;}
    else run=1;
    last=normalized; kept.push(word);
  }
  return kept.join(" ").slice(0,Math.max(200,Number(process.env.SCENE_FINDER_MAX_TRANSCRIPTION_CHARS||12000)));
};

const transcribeAudio=async(audioPath)=>{
  if(!audioPath)throw new Error("Audio path is required for speech-to-text.");
  const transcriber=await getTranscriber();
  const {audioData,sampleRate}=loadWavAudio(audioPath);
  console.log(`Audio loaded: ${sampleRate} Hz`);
  const result=await transcriber(audioData,{sampling_rate:sampleRate,chunk_length_s:30,stride_length_s:5});
  return {text:cleanTranscript(result.text||"")};
};

module.exports={transcribeAudio};
