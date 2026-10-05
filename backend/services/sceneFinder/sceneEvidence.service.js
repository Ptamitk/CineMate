const { analyzeSceneSignals } = require("./sceneSignals.service");
const { discoverSceneCandidates } = require("./sceneDiscovery.service");
const { getCandidateArtwork } = require("./tmdbArtwork.service");
const { getCandidateEpisodeArtwork } = require("./tvEpisodeArtwork.service");
const { analyzeArtworkSimilarity } = require("./visualRecognition.service");
const { selectUsefulFrames } = require("./frameSelection.service");
const { overlapScore, exactTitle, extractTextEvidence } = require("./evidenceCleanup.service");

const aggregate = (matches, candidate) => {
  const rows = (matches || []).filter(
    item => Number(item.contentId) === Number(candidate.contentId) &&
      item.contentType === candidate.contentType
  );
  if (!rows.length) return { average: 0, max: 0, matchedFrames: 0, temporalConsistency: 0, bestEpisode: null };

  const scores = rows.map(x => Number(x.imageSimilarity || 0)).sort((a,b) => b-a);
  const strong = rows.filter(x => Number(x.imageSimilarity || 0) >= 0.72);
  return {
    average: scores.slice(0,3).reduce((a,b)=>a+b,0) / Math.min(3,scores.length),
    max: scores[0] || 0,
    matchedFrames: Math.max(0,...strong.map(x=>Number(x.imageFramesMatched||0))),
    temporalConsistency: Math.max(0,...rows.map(x=>Number(x.temporalConsistency||0))),
    bestEpisode: rows.filter(x=>x.seasonNumber).sort((a,b)=>Number(b.imageSimilarity||0)-Number(a.imageSimilarity||0))[0] || null,
  };
};

const textEvidence = (candidate, text) => {
  const captionScore = overlapScore(text.caption,candidate.title,candidate.originalTitle);
  const ocrScore = overlapScore(text.ocr,candidate.title,candidate.originalTitle);
  const stableOcrScore = overlapScore(text.stableOcr,candidate.title,candidate.originalTitle);
  const speechScore = overlapScore(text.speech,candidate.title,candidate.originalTitle);
  const exact = [text.caption,text.ocr,text.speech].some(x=>exactTitle(x,candidate.title,candidate.originalTitle));
  const independent = [stableOcrScore,speechScore,captionScore].filter(x=>x>=0.72).length;
  return {captionScore,ocrScore,stableOcrScore,speechScore,exact,independent};
};

const analyzeSceneEvidence = async ({frameFiles=[],ocrFrameFiles=[],audioPath=null,caption=""}) => {
  const signals = await analyzeSceneSignals({
    frameFiles: ocrFrameFiles.length ? ocrFrameFiles : frameFiles,
    audioPath,
  });

  const text = extractTextEvidence({
    caption,
    ocrResults: signals.ocr.results || [],
    speech: signals.speech.text || "",
  });

  const visualFrames = selectUsefulFrames({
    frameFiles,
    maxFrames: Math.max(12,Math.min(24,Number(process.env.SCENE_FINDER_VISUAL_FRAMES||20))),
  });

  const candidateResult = await discoverSceneCandidates({
    caption:text.caption,
    ocrText:text.stableOcr || text.ocr,
    speechText:text.speech,
  });
  const candidates = candidateResult?.candidates || [];

  if (!candidates.length || !visualFrames.length) {
    return {signals,caption,queries:candidateResult?.queries||[],candidates:[],bestMatch:null,artworkSimilarityMatches:[],episodeSimilarityMatches:[]};
  }

  const artworkCandidates = await getCandidateArtwork(
    candidates,
    Math.min(candidates.length,Math.max(16,Number(process.env.SCENE_FINDER_ARTWORK_CANDIDATES||48)))
  );
  const tvCandidates = candidates.filter(x=>x.contentType==="tv");
  const episodeArtwork = await getCandidateEpisodeArtwork(
    tvCandidates,
    Math.min(tvCandidates.length,Number(process.env.SCENE_FINDER_EPISODE_CANDIDATES||6))
  );
  const artworkFrames = selectUsefulFrames({
    frameFiles:visualFrames,
    maxFrames:Math.min(16,Number(process.env.SCENE_FINDER_ARTWORK_FRAMES||14)),
  });

  const [artworkSimilarityMatches,episodeSimilarityMatches] = await Promise.all([
    analyzeArtworkSimilarity({frameFiles:artworkFrames,candidateArtwork:artworkCandidates}),
    analyzeArtworkSimilarity({frameFiles:artworkFrames,candidateArtwork:episodeArtwork}),
  ]);

  const scored = candidates.map(candidate=>{
    const t=textEvidence(candidate,text);
    const art=aggregate(artworkSimilarityMatches,candidate);
    const ep=aggregate(episodeSimilarityMatches,candidate);

    const textScore=t.exact ? 0.97 : Math.max(
      t.stableOcrScore*0.46,
      t.captionScore*0.40,
      t.speechScore*0.34
    );
    const visualScore=Math.max(
      art.average*0.58+art.max*0.17+art.temporalConsistency*0.25,
      ep.average*0.62+ep.max*0.18+ep.temporalConsistency*0.20
    );
    const visualCorroborated =
      (art.average>=0.58 && art.matchedFrames>=2) ||
      (ep.average>=0.58 && ep.matchedFrames>=2);
    const textCorroborated=t.exact || t.independent>=1;

    let score=textScore*0.42+visualScore*0.58;
    if(!textCorroborated && !visualCorroborated) score=Math.min(score,0.54);
    if(t.exact) score=Math.max(score,0.92);

    const episode=ep.bestEpisode;
    return {
      title:candidate.title,contentId:candidate.contentId,contentType:candidate.contentType,
      releaseDate:candidate.releaseDate,rating:candidate.rating,image:candidate.image,
      confidence:Math.round(Math.min(0.98,score)*100),
      sceneScore:Number(Math.min(0.98,score).toFixed(4)),
      evidenceType:episode?"episode-visual":visualCorroborated?"visual":t.exact?"text-exact":t.independent?"text-corroborated":"weak",
      episode:episode?{seasonNumber:episode.seasonNumber,episodeNumber:episode.episodeNumber,episodeName:episode.episodeName||""}:null,
      evidence:{
        captionScore:Number(t.captionScore.toFixed(4)),ocrScore:Number(t.ocrScore.toFixed(4)),
        stableOcrScore:Number(t.stableOcrScore.toFixed(4)),speechScore:Number(t.speechScore.toFixed(4)),
        artworkAverage:Number(art.average.toFixed(4)),artworkMax:Number(art.max.toFixed(4)),
        artworkMatchedFrames:art.matchedFrames,artworkTemporalConsistency:Number(art.temporalConsistency.toFixed(4)),
        episodeArtworkAverage:Number(ep.average.toFixed(4)),episodeArtworkMax:Number(ep.max.toFixed(4)),
        episodeArtworkMatchedFrames:ep.matchedFrames,episodeTemporalConsistency:Number(ep.temporalConsistency.toFixed(4)),
      },
    };
  }).sort((a,b)=>b.sceneScore-a.sceneScore);

  const best=scored[0]||null, second=scored[1]||null;
  const margin=best&&second?best.sceneScore-second.sceneScore:0;
  const accepted=Boolean(best)&&(
    (best.sceneScore>=0.72&&margin>=0.07) ||
    (best.evidenceType==="text-exact"&&best.sceneScore>=0.92&&margin>=0.035)
  );

  console.log("Scene Finder production ranking:",scored.slice(0,8).map(x=>({title:x.title,score:x.sceneScore,evidenceType:x.evidenceType,episode:x.episode,evidence:x.evidence})));

  return {signals,caption,queries:candidateResult?.queries||[],candidates:scored,bestMatch:accepted?best:null,artworkSimilarityMatches,episodeSimilarityMatches};
};

module.exports={analyzeSceneEvidence};
