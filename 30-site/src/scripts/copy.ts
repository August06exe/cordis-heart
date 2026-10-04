/** 复制文本：优先用剪贴板 API；非安全上下文里不可用时，退回 textarea 方案 */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.setAttribute('readonly', '');
    Object.assign(ta.style, { position: 'fixed', opacity: '0' });
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
