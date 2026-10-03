import sharp from 'sharp';

async function vec(file, box, tw, th) {
  let img = sharp(file);
  if (box) img = img.extract(box);
  const { data } = await img.resize(tw, th, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
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

const pairs = [
  { name: '图02', src: 'public/images/web/steal-this-3.jpg', box: { left: 308, top: 1591, width: 436, height: 581 } },
  { name: '图03', src: 'public/images/web/steal-this-1.jpg', box: { left: 308, top: 3011, width: 436, height: 581 } },
  { name: '图04', src: 'public/images/web/steal-this-2.jpg', box: { left: 308, top: 7323, width: 436, height: 581 } },
  { name: '词卡1', src: 'public/images/web/cards/steal-this-card1.jpg', box: { left: 324, top: 8111, width: 257, height: 257 } },
  { name: '词卡2', src: 'public/images/web/cards/steal-this-card2.jpg', box: { left: 641, top: 8111, width: 255, height: 257 } },
];

for (const p of pairs) {
  const a = await vec(p.src, null, 48, 64);
  const b = await vec('.tmp-gen/full-1440.png', p.box, 48, 64);
  console.log(p.name, 'NCC', ncc(a, b).toFixed(4));
}
