import { apiFetch } from "../services/api";
const getToken=()=>{try{return JSON.parse(localStorage.getItem("cinemate_auth")||"{}")?.token||null}catch{return null}};
export const updatePost=async(postId,text)=>{if(!postId)return null;const token=getToken();if(!token)return null;try{return await apiFetch("/posts/"+postId,{method:"PUT",headers:{Authorization:"Bearer "+token},body:JSON.stringify({text})})}catch(error){console.error("Update Post Error:",error);return null}};
