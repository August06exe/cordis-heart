/** 正文里的代码对照片段。放在这里而不是 MDX 里，是因为 MDX 解析不了嵌套组件里的多行模板字符串。
 *  行首「+ 」= 强调的好写法，「- 」= 问题行，「//」开头 = 注释。 */
export const SNIP = {
  undoOld: `// 装的时候
function activate() {
  db = openDatabase()
  bot.on('message', onMessage)
  timer = setInterval(check, 60000)
}
// 卸的时候，另写一份
function deactivate() {
  bot.off('message', onMessage)
  db.close()
- // 少了 clearInterval(timer)，幽灵诞生
}`,
  undoNew: `export function apply(ctx) {
+ ctx.effect(() => {
+   const db = openDatabase()
+   return () => db.close()   // 回执
+ })
  ctx.on('message', onMessage)
  ctx.setInterval(check, 60000)
}
// 没有卸载函数。
// on、setInterval 都走 ctx，
// 回执由框架自动登记。`,
  depsOld: `function sendReminder() {
- if (!db || !db.connected) {
-   retryLater()    // 每个插件都写一遍
-   return
- }
  db.query(...)
}`,
  depsNew: `export const inject = ['database']

export function apply(ctx) {
  // 能走到这里，数据库一定在
  ctx.on('message', () => {
    ctx.database.query(...)
  })
}`,
  answer: `// 先列清单，不改代码：
// ─ 第 1 招 · 当场交回执
- src/plugins/weather.ts:41
-   setInterval(refresh, 3600000) 没有对应的清理
// ─ 第 9 招 · 状态进总账
- src/plugins/admin.ts:7
-   let commandCount = 0 是模块级变量，重载后不归零
// ─ 第 5 招 · 依赖写成清单
- src/plugins/remind.ts:18
-   直接 import 了 db.ts，没有声明依赖
// 建议先改 weather.ts：它会留下幽灵任务。
// 要我开始改吗？`,
};
