const Watchlist = require("../models/watchlist.model");
const Watched = require("../models/watched.model");
const Favorite = require("../models/favorite.model");

const validateContent = (body) => Number.isInteger(Number(body.contentId)) && ["movie", "tv"].includes(body.contentType) && Boolean(String(body.title || "").trim());
const payload = (body) => ({ contentId:Number(body.contentId), contentType:body.contentType, title:String(body.title).trim(), image:body.image||"", year:body.year||"", rating:body.rating||"" });

const factory = (Model, label) => ({
 list: async (req,res) => { try { const items=await Model.find({user:req.userId}).sort({createdAt:-1}).lean(); res.json({items}); } catch(e){ console.error(`Get ${label} Error:`,e); res.status(500).json({message:`Unable to fetch ${label.toLowerCase()}.`}); } },
 status: async (req,res) => { try { const item=await Model.findOne({user:req.userId,contentId:Number(req.params.contentId),contentType:req.params.contentType}).lean(); res.json({active:Boolean(item),item:item||null}); } catch { res.status(500).json({message:"Unable to check content status."}); } },
 add: async (req,res) => { try { if(!validateContent(req.body)) return res.status(400).json({message:"Valid content ID, type and title are required."}); const item=await Model.findOneAndUpdate({user:req.userId,contentId:Number(req.body.contentId),contentType:req.body.contentType},{ $set:{...payload(req.body),user:req.userId} },{new:true,upsert:true,setDefaultsOnInsert:true}); res.status(201).json({message:`${label} saved.`,item}); } catch(e){ console.error(`Add ${label} Error:`,e); res.status(500).json({message:`Unable to save ${label.toLowerCase()}.`}); } },
 remove: async (req,res) => { try { const item=await Model.findOneAndDelete({user:req.userId,contentId:Number(req.params.contentId),contentType:req.params.contentType}); if(!item) return res.status(404).json({message:`Content is not in your ${label.toLowerCase()}.`}); res.json({message:`${label} removed.`}); } catch(e){ console.error(`Remove ${label} Error:`,e); res.status(500).json({message:`Unable to remove from ${label.toLowerCase()}.`}); } }
});

const watched=factory(Watched,"Watched");
const favorites=factory(Favorite,"Favorites");

const listWatchlist=async(req,res)=>{try{const items=await Watchlist.find({user:req.userId}).sort({createdAt:-1}).lean();res.json({items});}catch(e){res.status(500).json({message:"Unable to fetch watchlist."});}};
module.exports={getWatched:watched.list,getWatchedStatus:watched.status,addWatched:watched.add,removeWatched:watched.remove,getFavorites:favorites.list,getFavoriteStatus:favorites.status,addFavorite:favorites.add,removeFavorite:favorites.remove,listWatchlist};