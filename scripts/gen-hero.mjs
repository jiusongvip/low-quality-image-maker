// Generate hero-after.jpg using the same Nuked pipeline as public/js/tool.js
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const beforePath = path.resolve(__dirname, '..', 'public', 'img', 'hero-before.jpg');
const afterPath = path.resolve(__dirname, '..', 'public', 'img', 'hero-after.jpg');

const b64 = fs.readFileSync(beforePath).toString('base64');
const dataUrl = 'data:image/jpeg;base64,' + b64;

const html = `
<!doctype html><html><body>
<img id="src" src="${dataUrl}" />
<script>
function mime(f){ return f==='webp'?'image/webp':f==='png'?'image/png':'image/jpeg'; }
async function processImage(img, quality, pixel, noise, blur, brightness, format, presetLabel){
  var w=img.naturalWidth||img.width, h=img.naturalHeight||img.height;
  var canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
  var ctx=canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
  if(pixel>1){
    var pw=Math.max(1,Math.floor(w/pixel)), ph=Math.max(1,Math.floor(h/pixel));
    var tmp=document.createElement('canvas'); tmp.width=pw; tmp.height=ph;
    tmp.getContext('2d').drawImage(canvas,0,0,pw,ph);
    ctx.imageSmoothingEnabled=false; ctx.clearRect(0,0,w,h);
    ctx.drawImage(tmp,0,0,pw,ph,0,0,w,h); ctx.imageSmoothingEnabled=true;
  }
  if(blur>0){
    var scale=Math.max(0.05,1-(blur/20)*0.95);
    var bw=Math.max(1,Math.floor(w*scale)), bh=Math.max(1,Math.floor(h*scale));
    var tmp=document.createElement('canvas'); tmp.width=bw; tmp.height=bh;
    tmp.getContext('2d').drawImage(canvas,0,0,bw,bh);
    ctx.clearRect(0,0,w,h); ctx.drawImage(tmp,0,0,bw,bh,0,0,w,h);
  }
  if(noise>0){
    var id=ctx.getImageData(0,0,w,h), d=id.data, intensity=noise*2.55;
    for(var i=0;i<d.length;i+=4){
      var n=(Math.random()-0.5)*intensity*2;
      d[i]=Math.min(255,Math.max(0,d[i]+n));
      d[i+1]=Math.min(255,Math.max(0,d[i+1]+n));
      d[i+2]=Math.min(255,Math.max(0,d[i+2]+n));
    }
    ctx.putImageData(id,0,0);
  }
  if(brightness!==0){
    var id=ctx.getImageData(0,0,w,h), d=id.data, bv=brightness*2.55;
    for(var i=0;i<d.length;i+=4){
      d[i]=Math.min(255,Math.max(0,d[i]+bv));
      d[i+1]=Math.min(255,Math.max(0,d[i+1]+bv));
      d[i+2]=Math.min(255,Math.max(0,d[i+2]+bv));
    }
    ctx.putImageData(id,0,0);
  }
  if(presetLabel==='nuked'){
    ctx.globalCompositeOperation='overlay';
    ctx.fillStyle='rgba(255,255,200,0.3)';
    ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation='source-over';
  }
  return new Promise(function(resolve){
    canvas.toBlob(function(blob){
      var r=new FileReader(); r.onloadend=function(){ resolve(r.result); }; r.readAsDataURL(blob);
    }, mime(format), quality/100);
  });
}
window.onload = async function(){
  var img = document.getElementById('src');
  var data = await processImage(img, 10, 8, 35, 0, 20, 'jpeg', 'nuked');
  document.title = 'DONE:' + data;
};
</script>
</body></html>
`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('console', (m) => console.log('[browser]', m.text()));
  await page.setContent(html);
  await page.waitForFunction('document.title.startsWith("DONE:")', { timeout: 30000 });
  const dataUrl = await page.evaluate(() => document.title.slice(5));
  const base64 = dataUrl.split(',')[1];
  fs.writeFileSync(afterPath, Buffer.from(base64, 'base64'));
  await browser.close();
  const size = fs.statSync(afterPath).size;
  console.log('hero-after.jpg written:', size, 'bytes');
})().catch((e) => { console.error(e); process.exit(1); });
