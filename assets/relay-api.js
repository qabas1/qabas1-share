/** @typedef {{key:string,type:string,label:string,required:boolean,description?:string,placeholder?:string,errorMessage?:string,constraints?:Record<string,any>}} RelayField */
/** @typedef {{schemaVersion:number,locale:string,title:string,fields:RelayField[]}} RelayForm */
/** @typedef {{title:string,instructions?:string,expiresAt:string,allowPartial:boolean,allowMultiple:boolean,status:string,form:RelayForm}} RelayRequest */
export class RelayError extends Error {
  constructor(status, code, message, field) { super(message || code || 'request_failed'); this.status=status; this.code=code; this.field=field; }
}
export function createRelayApi(origin, token) {
  const base = `${origin.replace(/\/+$/, '')}/api/v1/r/${encodeURIComponent(token)}`;
  async function call(path='', method='GET', body, binary=false, onProgress) {
    const url=base+path;
    const headers={Accept:'application/json'};
    if (body !== undefined) headers['Content-Type']=binary?'application/octet-stream':'application/json';
    if (binary && onProgress) {
      return await new Promise((resolve,reject)=>{
        const xhr=new XMLHttpRequest(); xhr.open(method,url); xhr.withCredentials=false;
        xhr.setRequestHeader('Accept','application/json'); xhr.setRequestHeader('Content-Type','application/octet-stream');
        xhr.upload.onprogress=e=>{ if(e.lengthComputable) onProgress(Math.round(e.loaded/e.total*100)); };
        xhr.onerror=()=>reject(new RelayError(0,'network','Network error'));
        xhr.onload=()=>{let payload={};try{payload=JSON.parse(xhr.responseText)}catch{}; if(xhr.status<200||xhr.status>=300||payload.success===false) reject(new RelayError(xhr.status,payload.error?.code,payload.error?.message,payload.error?.field));else resolve(payload.data);};
        xhr.send(body);
      });
    }
    const response=await fetch(url,{method,headers,body:body===undefined?undefined:binary?body:JSON.stringify(body),cache:'no-store',referrerPolicy:'no-referrer'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||payload.success!==true) throw new RelayError(response.status,payload.error?.code,payload.error?.message,payload.error?.field);
    return payload.data;
  }
  return {
    /** @returns {Promise<RelayRequest>} */ get:()=>call(),
    createUpload:(fieldKey,file)=>call('/uploads','POST',{fieldKey,name:file.name,mimeType:file.type,sizeBytes:file.size}),
    completeUpload:(sessionId,file,onProgress)=>call(`/uploads/${encodeURIComponent(sessionId)}/complete`,'POST',file,true,onProgress),
    evidence:id=>call(`/evidence/${encodeURIComponent(id)}`),
    submit:(idempotencyKey,answers,supersedesSubmissionId)=>call('/submissions','POST',{idempotencyKey,answers,...(supersedesSubmissionId?{supersedesSubmissionId}:{})})
  };
}
