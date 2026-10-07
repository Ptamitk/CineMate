const mongoose=require("mongoose");
const commentSchema=new mongoose.Schema({post:{type:mongoose.Schema.Types.ObjectId,ref:"Post",required:true,index:true},user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},text:{type:String,required:true,trim:true,maxlength:1000}},{timestamps:true});
commentSchema.index({post:1,createdAt:-1});
module.exports=mongoose.model("Comment",commentSchema);