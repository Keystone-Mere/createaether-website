/** Local OBS WebSocket v5 client. No credentials or settings are persisted. */
export class ObsCueConnection {
 private socket:WebSocket|null=null;
 private identified=false;
 private handshake:ReturnType<typeof setTimeout>|undefined;
 private sequence=0;
 private pending=new Map<string,{resolve:()=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 constructor(private report:(message:string,connected:boolean)=>void){}
 get connected(){return this.identified;}
 connect(port:number,password:string){
  this.disconnect(false);
  if(!Number.isInteger(port)||port<1||port>65535){this.report('Enter a valid OBS port.',false);return;}
  this.report('Connecting to OBS…',false);
  let socket:WebSocket;
  try{socket=new WebSocket(`ws://127.0.0.1:${port}`);}catch{password='';this.report('Could not open OBS connection. Use Live Director on localhost.',false);return;}
  this.socket=socket;
  const fail=(message:string)=>{if(this.socket!==socket)return;password='';this.disconnect(false);this.report(message,false);};
  this.handshake=setTimeout(()=>fail('OBS connection timed out. Check OBS WebSocket settings and port.'),10000);
  socket.onmessage=async(event)=>{
   if(this.socket!==socket)return;
   try{
    const packet=JSON.parse(event.data);
    if(packet.op===0){
     let authentication:string|undefined;
     if(packet.d.authentication){
      const {salt,challenge}=packet.d.authentication;
      if(typeof salt!=='string'||typeof challenge!=='string')throw new Error('Invalid OBS challenge');
      authentication=await obsAuthentication(password,salt,challenge);
     }
     password='';
     if(this.socket!==socket||socket.readyState!==WebSocket.OPEN)return;
     socket.send(JSON.stringify({op:1,d:{rpcVersion:1,eventSubscriptions:0,...(authentication?{authentication}:{})}}));
    }else if(packet.op===2){
     clearTimeout(this.handshake);this.identified=true;
     this.report('Connected to OBS. Select a cue or send the current cue.',true);
    }else if(packet.op===7){
     const pending=this.pending.get(packet.d.requestId);if(!pending)return;
     clearTimeout(pending.timer);this.pending.delete(packet.d.requestId);
     if(packet.d.requestStatus?.result)pending.resolve();
     else pending.reject(new Error(`OBS rejected cue (code ${packet.d.requestStatus?.code??'unknown'}). Check OBS browser support.`));
    }
   }catch{fail('OBS connection failed. Check your password and OBS WebSocket version.');}
  };
  socket.onerror=()=>fail('Cannot reach OBS. Check that OBS is open and WebSocket server is enabled.');
  socket.onclose=(event)=>fail(event.code===4009?'OBS authentication failed. Re-enter the WebSocket password.':'OBS disconnected. Reconnect to send cues.');
 }
 sendCue(cue:string):Promise<void>{
  if(!['dry','gentle','shower','clearing','ending'].includes(cue))return Promise.reject(new Error('Unknown garden cue.'));
  const socket=this.socket;
  if(!socket||!this.identified||socket.readyState!==WebSocket.OPEN)return Promise.reject(new Error('OBS is disconnected. Preview controls still work.'));
  const requestId=`aether-garden-${++this.sequence}`;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{this.pending.delete(requestId);reject(new Error('OBS did not acknowledge the cue. Try sending again.'));},5000);
   this.pending.set(requestId,{resolve,reject,timer});
   try{socket.send(JSON.stringify({op:6,d:{requestType:'CallVendorRequest',requestId,requestData:{vendorName:'obs-browser',requestType:'emit_event',requestData:{event_name:'aether_garden_cue',event_data:{scene:'garden',cue}}}}}));}
   catch{clearTimeout(timer);this.pending.delete(requestId);reject(new Error('Could not send cue to OBS.'));}
  });
 }
 disconnect(announce=true){
  clearTimeout(this.handshake);this.identified=false;
  const socket=this.socket;this.socket=null;
  if(socket){socket.onmessage=null;socket.onerror=null;socket.onclose=null;socket.close();}
  for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(new Error('OBS disconnected.'));}
  this.pending.clear();if(announce)this.report('OBS disconnected. Preview controls still work.',false);
 }
}
export async function obsAuthentication(password:string,salt:string,challenge:string):Promise<string>{
 const hash=async(value:string)=>{
  const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...bytes));
 };
 return hash((await hash(password+salt))+challenge);
}
