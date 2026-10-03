// 模板匹配：把源 JPG 缩成 12x16 灰度模板，在截图粗带内滑动找最佳归一化相关
import sharp from 'sharp';

async function gray(file, w, h) {
  const { data } = await sharp(file).resize(w, h, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}

async function cropGray(file, x, y, w, h) {
  const { data } = await sharp(file).extract({ left: x, top: y, width: w, height: h })
    .resize(12, 16, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}

function ncc(a, b) {
  const n = a.length;
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const va = a[i] - ma, vb = b[i] - mb;
    num += va * vb; da += va * va; db += vb * vb;
  }
  return num / Math.sqrt(da * db);
}

const shot = process.argv[2];
const shotMeta = await sharp(shot).metadata();

const figs = [
  { name: '图02/steal-this-3', src: 'public/images/web/steal-this-3.jpg', yRange: [1200, 2600], w: 330, h: 440 },
  { name: '图03/steal-this-1', src: 'public/images/web/steal-this-1.jpg', yRange: [2600, 4000], w: 330, h: 440 },
  { name: '图04/steal-this-2', src: 'public/images/web/steal-this-2.jpg', yRange: [9300, 10600], w: 330, h: 440 },
  { name: '词卡1/card1', src: 'public/images/web/cards/steal-this-card1.jpg', yRange: [10600, 11400], w: 300, h: 300 },
  { name: '词卡2/card2', src: 'public/images/web/cards/steal-this-card2.jpg', yRange: [10600, 11400], w: 300, h: 300 },
];

for (const f of figs) {
  const tpl = await gray(f.src, 12, 16);
  let best = { r: -2 };
  for (let y = f.yRange[0]; y + f.h <= Math.min(f.yRange[1], shotMeta.height); y += 24) {
    for (const x of [16, 20, 24]) {
      const cand = await cropGray(shot, x, y, f.w, f.h);
      const r = ncc(tpl, cand);
      if (r > best.r) best = { r, x, y };
    }
  }
  console.log(f.name, 'best NCC', best.r.toFixed(3), 'at x' + best.x + ' y' + best.y);
}
