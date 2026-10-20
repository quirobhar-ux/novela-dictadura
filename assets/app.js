'use strict';
const $=s=>document.querySelector(s),stage=$('#stage'),fit=$('#fit'),rotation=$('#rotation'),book=$('#book'),hinge=$('#hinge');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let opened=false,busy=false,progress=0,zoom=1,rx=-9,ry=-24,rz=-3,paused=reduced.matches,readerZoom=0;
function view(){rotation.style.transform=`rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;const w=stage.clientWidth,h=stage.clientHeight;const scale=Math.min((w-46)/(340+340*progress),Math.max(90,h-48)/570)*zoom;fit.style.transform=`scale(${scale})`;book.style.transform=`translateX(${-170*(1-progress)}px)`;hinge.style.transform=`translateZ(30px) rotateY(${-180*progress}deg)`;$('#shadow').style.width=`${Math.min(w*.78,340*(1+progress)*scale)}px`;}
function setPaused(value){paused=value;document.body.classList.toggle('paused',value);$('#motion').textContent=value?'Reanudar':'Pausar';$('#motion').setAttribute('aria-label',value?'Reanudar flotación':'Pausar flotación');$('#motion').setAttribute('aria-pressed',String(value));}
function rest(){zoom=1;rx=opened?0:-9;ry=opened?0:-24;rz=opened?0:-3;view();}
function toggle(){if(busy)return;busy=true;opened=!opened;document.body.classList.toggle('open',opened);$('#toggle').disabled=true;const start=performance.now(),a=progress,b=opened?1:0,old=[rx,ry,rz],end=opened?[0,0,0]:[-9,-24,-3];zoom=1;const duration=reduced.matches?0:1800;
 function tick(now){const t=duration?Math.min(1,(now-start)/duration):1;const e=t*t*(3-2*t);progress=a+(b-a)*e;[rx,ry,rz]=old.map((v,i)=>v+(end[i]-v)*e);view();if(t<1){requestAnimationFrame(tick);}else{busy=false;$('#toggle').disabled=false;$('#toggle').textContent=opened?'Cerrar':'Abrir libro';document.querySelectorAll('.page').forEach(p=>p.setAttribute('aria-hidden',String(!opened)));$('#status').textContent=opened?'Libro abierto. Fragmento de la página 82.':'Libro cerrado.';}}
 requestAnimationFrame(tick);
}
function changeZoom(f){zoom=Math.max(.55,Math.min(2.8,zoom*f));view();}
$('#toggle').onclick=toggle;$('#reset').onclick=()=>{if(!busy)rest();};$('#in').onclick=()=>changeZoom(1.15);$('#out').onclick=()=>changeZoom(1/1.15);$('#motion').onclick=()=>setPaused(!paused);
reduced.addEventListener('change',()=>setPaused(reduced.matches));setPaused(paused);
new ResizeObserver(view).observe(stage);
const pointers=new Map();let drag=null,pinch=0;
stage.addEventListener('pointerdown',e=>{if(busy)return;stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
stage.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||busy)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch>0)changeZoom(d/pinch);pinch=d;}else if(drag){ry+=(e.clientX-drag.x)*.35;rx=Math.max(-75,Math.min(75,rx-(e.clientY-drag.y)*.25));view();}drag={x:e.clientX,y:e.clientY};});
function release(e){pointers.delete(e.pointerId);pinch=0;drag=pointers.size?[...pointers.values()][0]:null;}
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
stage.addEventListener('wheel',e=>{e.preventDefault();changeZoom(Math.exp(-e.deltaY*.001));},{passive:false});
stage.addEventListener('keydown',e=>{if(busy)return;let used=true;switch(e.key){case'ArrowLeft':ry-=8;break;case'ArrowRight':ry+=8;break;case'ArrowUp':rx=Math.min(75,rx+8);break;case'ArrowDown':rx=Math.max(-75,rx-8);break;case'+':case'=':changeZoom(1.15);break;case'-':changeZoom(1/1.15);break;case'Home':rest();break;case'Enter':case' ':toggle();break;default:used=false;}if(used){e.preventDefault();view();}});
const reader=$('#reader');
$('#read').onclick=()=>{reader.showModal();readerZoom=0;$('#original-page').style.width='min(100%,760px)';$('#reader-scroll').scrollTop=0;};$('#close-reader').onclick=()=>reader.close();
function readerScale(f){if(!readerZoom)readerZoom=$('#original-page').clientWidth;readerZoom=Math.min(3200,Math.max(240,readerZoom*f));$('#original-page').style.width=readerZoom+'px';}
$('#read-in').onclick=()=>readerScale(1.25);$('#read-out').onclick=()=>readerScale(.8);$('#read-fit').onclick=()=>{readerZoom=0;$('#original-page').style.width='min(100%,760px)';};
// Each original photograph stays unchanged. Only its surface coordinates are mapped.
// Coordinates are expressed in the 1152 x 2048 orientation shown by Photos.
const textures=[
 ['front-texture','assets/IMG_2273.jpeg',[[145,258],[997,292],[1090,1735],[88,1782]],680,1080],
 ['back-texture','assets/IMG_2275.jpeg',[[208,394],[978,478],[1088,1854],[22,1822]],680,1080],
 ['spine-texture','assets/IMG_2274.jpeg',[[818,561],[943,638],[351,1629],[155,1514]],180,1080],
 ['edge-texture','assets/IMG_2277.jpeg',[[164,735],[425,778],[402,1684],[176,1666]],150,1080]
];
function paintTriangle(ctx,img,src,dst){const [a,b,c]=src,[p,q,r]=dst;const det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);if(Math.abs(det)<1e-9)return;
 const A=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,B=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/det,C=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/det,D=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/det;
 ctx.save();ctx.beginPath();const center={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};[p,q,r].forEach((v,i)=>{const x=v.x+(v.x-center.x)*.008,y=v.y+(v.y-center.y)*.008;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.clip();ctx.setTransform(A,B,C,D,p.x-A*a.x-C*a.y,p.y-B*a.x-D*a.y);ctx.drawImage(img,0,0);ctx.restore();}
async function texture([id,url,quad,width,height]){const img=new Image();img.src=url;await img.decode();const canvas=document.getElementById(id);canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';const pts=quad.map(([x,y])=>({x:x/1152*img.naturalWidth,y:y/2048*img.naturalHeight}));
 const sample=(u,v)=>({x:(1-v)*((1-u)*pts[0].x+u*pts[1].x)+v*((1-u)*pts[3].x+u*pts[2].x),y:(1-v)*((1-u)*pts[0].y+u*pts[1].y)+v*((1-u)*pts[3].y+u*pts[2].y)});
 const n=24;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const uv=[[x/n,y/n],[(x+1)/n,y/n],[(x+1)/n,(y+1)/n],[x/n,(y+1)/n]],s=uv.map(([u,v])=>sample(u,v)),d=uv.map(([u,v])=>({x:u*width,y:v*height}));paintTriangle(ctx,img,[s[0],s[1],s[2]],[d[0],d[1],d[2]]);paintTriangle(ctx,img,[s[0],s[2],s[3]],[d[0],d[2],d[3]]);}canvas.dataset.loaded='true';}
Promise.all(textures.map(texture)).then(()=>{$('#loading').hidden=true;$('#toggle').disabled=false;view();}).catch(error=>{$('#loading').textContent='No se pudo cargar una fotografía. Comprueba que la carpeta assets esté junto a index.html.';console.error(error);});
view();

// Highlights use text offsets, never stored HTML; the original image stays intact.
const excerptNodes=[$('.left .passage p'),$('.right .passage p')];
const excerptText=excerptNodes.map(p=>p.textContent);
const textNodes=[...document.querySelectorAll('[data-paragraph]')];
const highlightKey='chivo-p82-highlights-v1';let highlights=[[],[]],pendingSelection=[];
try{const stored=JSON.parse(localStorage.getItem(highlightKey));if(Array.isArray(stored)&&stored.length===2)highlights=stored.map((ranges,i)=>Array.isArray(ranges)?ranges.filter(r=>Array.isArray(r)&&r.length===2&&r.every(Number.isInteger)&&r[0]>=0&&r[1]>r[0]&&r[1]<=excerptText[i].length):[]);}catch{}
function mergeRanges(ranges){return ranges.sort((a,b)=>a[0]-b[0]).reduce((out,r)=>{const prev=out[out.length-1];if(prev&&r[0]<=prev[1])prev[1]=Math.max(prev[1],r[1]);else out.push([...r]);return out;},[]);}
function renderHighlights(){highlights=highlights.map(mergeRanges);excerptText.forEach((text,i)=>{for(const el of [textNodes[i],excerptNodes[i]]){el.replaceChildren();let offset=0;for(const [a,b] of highlights[i]){el.append(document.createTextNode(text.slice(offset,a)));const mark=document.createElement('mark');mark.textContent=text.slice(a,b);el.append(mark);offset=b;}el.append(document.createTextNode(text.slice(offset)));}});}
function storeHighlights(){try{localStorage.setItem(highlightKey,JSON.stringify(highlights));$('#highlight-status').textContent='Guardado en este navegador. También visible en el libro.';}catch{$('#highlight-status').textContent='Resaltado aplicado durante esta sesión; el navegador no permite guardarlo.';}}
document.addEventListener('selectionchange',()=>{const selection=getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount){return;}const range=selection.getRangeAt(0);if(!$('#selectable-text').contains(range.startContainer)||!$('#selectable-text').contains(range.endContainer))return;pendingSelection=[];textNodes.forEach((el,i)=>{if(!range.intersectsNode(el))return;const before=document.createRange();before.selectNodeContents(el);let start=0,end=excerptText[i].length;if(el.contains(range.startContainer)){before.setEnd(range.startContainer,range.startOffset);start=before.toString().length;}if(el.contains(range.endContainer)){before.selectNodeContents(el);before.setEnd(range.endContainer,range.endOffset);end=before.toString().length;}if(end>start)pendingSelection.push({i,start,end});});$('#highlight').disabled=!pendingSelection.length;});
$('#highlight').onclick=()=>{for(const {i,start,end} of pendingSelection)highlights[i].push([start,end]);pendingSelection=[];getSelection()?.removeAllRanges();renderHighlights();storeHighlights();$('#highlight').disabled=true;};
$('#clear-highlights').onclick=()=>{highlights=[[],[]];pendingSelection=[];renderHighlights();storeHighlights();$('#highlight').disabled=true;$('#highlight-status').textContent='Resaltados borrados.';};
function readerMode(text){$('#selectable-text').hidden=!text;$('#original-page').hidden=text;$('#highlight-tools').hidden=!text;$('.reader-tools').hidden=text;$('#text-tab').setAttribute('aria-pressed',String(text));$('#image-tab').setAttribute('aria-pressed',String(!text));$('#reader-scroll').scrollTop=0;}
$('#text-tab').onclick=()=>readerMode(true);$('#image-tab').onclick=()=>readerMode(false);renderHighlights();readerMode(true);
