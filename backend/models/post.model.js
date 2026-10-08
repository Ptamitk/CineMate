const mongoose=require("mongoose");
const postSchema=new mongoose.Schema({
user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
contentId:{type:Number,default:null},contentType:{type:String,enum:["movie","tv","person","music","song","album","game","book","documentary","special","event"],default:null,index:true},
text:{type:String,trim:true,maxlength:2000,default:""},mediaUrl:{type:String,default:""},likesCount:{type:Number,default:0},commentsCount:{type:Number,default:0},sharesCount:{type:Number,default:0}
},{timestamps:true});
postSchema.index({user:1,createdAt:-1});postSchema.index({contentId:1,contentType:1,createdAt:-1});
module.exports=mongoose.model("Post",postSchema);