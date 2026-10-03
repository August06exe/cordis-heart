// 风格铁律对比度实算：钴蓝 #2148B8 各透明度档对纸白 #FAFAF7，WCAG 相对亮度公式
// 口径：alpha 先在 sRGB 上按 8-bit 取整合成，再算对比度（与 04-DesignRead-定稿.md 规则 2 同法）
const paper = [0xFA, 0xFA, 0xF7];
const ink = [0x21, 0x48, 0xB8];
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = rgb => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const mix = a => ink.map((c, i) => Math.round(c * a + paper[i] * (1 - a)));
const cr = (f, b) => { const x = L(f), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const rows = [
  [1.0, '标题实印 / 徽标墨底'],
  [0.82, '正文'],
  [0.80, '图内编号'],
  [0.78, '小字 / 注脚（文字下限档）'],
  [0.70, '图解线 / 表意图形（≥3 线）'],
  [0.20, '分隔细线（装饰豁免）'],
  [0.14, '基座色块（装饰豁免）'],
];
for (const [a, use] of rows) {
  const c = mix(a);
  console.log(`ink @${a}  rgb(${c.join(',')})  vs paper  ${cr(c, paper).toFixed(3)}:1  ${use}`);
}
