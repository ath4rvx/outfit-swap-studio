const $=id=>document.getElementById(id);
const state={person:null,outfit:null,result:null};

function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),3500)}
function valid(f){if(!f)return false;if(!["image/jpeg","image/png","image/webp"].includes(f.type)){toast("Use JPG, PNG or WebP.");return false}if(f.size>15*1024*1024){toast("Each image must be 15 MB or smaller.");return false}return true}
function dataUrl(f){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})}

async function choose(kind,file){
  if(!valid(file))return;
  const d=await dataUrl(file);state[kind]=d;
  const cap=kind==="person"?"Person":"Outfit";
  $((kind==="person"?"personPreview":"outfitPreview")).src=d;
  $((kind==="person"?"personPreview":"outfitPreview")).classList.remove("hidden");
  $((kind==="person"?"personEmpty":"outfitEmpty")).classList.add("hidden");
  $("clear"+cap).classList.remove("hidden");
  $("swap").disabled=!(state.person&&state.outfit);
}
$("personInput").onchange=e=>choose("person",e.target.files[0]);
$("outfitInput").onchange=e=>choose("outfit",e.target.files[0]);

for(const [id,kind] of [["personDrop","person"],["outfitDrop","outfit"]]){
  const z=$(id);
  ["dragenter","dragover"].forEach(x=>z.addEventListener(x,e=>{e.preventDefault();z.style.borderColor="#a875ff"}));
  ["dragleave","drop"].forEach(x=>z.addEventListener(x,e=>{e.preventDefault();z.style.borderColor="";}));
  z.addEventListener("drop",e=>choose(kind,e.dataTransfer.files[0]));
}

function clear(kind){
  state[kind]=null;
  const cap=kind==="person"?"Person":"Outfit";
  $(kind+"Input").value="";
  $(kind+"Preview").classList.add("hidden");
  $(kind+"Preview").src="";
  $(kind+"Empty").classList.remove("hidden");
  $("clear"+cap).classList.add("hidden");
  $("swap").disabled=true;
}
$("clearPerson").onclick=e=>{e.preventDefault();clear("person")};
$("clearOutfit").onclick=e=>{e.preventDefault();clear("outfit")};

$("swap").onclick=async()=>{
  $("result").classList.remove("hidden");
  $("loading").classList.remove("hidden");
  $("resultImage").classList.add("hidden");
  $("swap").disabled=true;
  $("swap").querySelector("span").textContent="Working…";
  $("result").scrollIntoView({behavior:"smooth",block:"start"});
  try{
    const r=await fetch("/api/outfit-swap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({personImage:state.person,outfitImage:state.outfit})});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||"Generation failed.");
    state.result=d.image;
    $("resultImage").src=d.image;
    $("resultImage").classList.remove("hidden");
    $("loading").classList.add("hidden");
  }catch(e){
    $("loading").classList.add("hidden");
    toast(e.message);
  }finally{
    $("swap").disabled=!(state.person&&state.outfit);
    $("swap").querySelector("span").textContent="Change Outfit";
  }
};

$("download").onclick=()=>{
  if(!state.result)return;
  const a=document.createElement("a");a.href=state.result;a.download="outfit-swap-result.png";a.click();
};
