import { apiFetch } from "../services/api";
const getToken=()=>{try{return JSON.parse(localStorage.getItem("cinemate_auth")||"{}")?.token||null}catch{return null}};
export const sharePost=async(postId)=>{if(!postId)return null;const token=getToken();if(!token)return null;try{return await apiFetch("/post-shares/"+postId,{method:"POST",headers:{Authorization:"Bearer "+token}})}catch(error){console.error("Share Post Error:",error);return null}};
