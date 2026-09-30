/**
 * 全套驗算：規則、美術、端到端、持久化。
 *
 * 分成兩個程序跑是因為持久化測試要自己開關伺服器，
 * 會和同一個程序裡的其他 WebSocket 測試搶埠口。
 *
 *   bun run shop:check     規則 + 美術（不需要伺服器）
 *   bun run shop:e2e       三角色協作（需要伺服器）
 *   bun run shop:persist   關機重開（自己開關伺服器）
 */

import { spawnSync } from 'node:child_process'

const steps: [string, string[]][] = [
  ['規則引擎', ['run', 'scripts/shop-sim/verify.ts']],
  ['美術與場景', ['run', 'scripts/shop-sim/scene-check.ts']],
]

let failed = 0
for (const [name, args] of steps) {
  console.log(`\n${'─'.repeat(52)}\n${name}\n${'─'.repeat(52)}`)
  const r = spawnSync('bun', args, { stdio: 'inherit' })
  if (r.status !== 0) failed++
}

console.log(`\n${'═'.repeat(52)}`)
if (failed === 0) {
  console.log('規則與美術全部通過。')
  console.log('接下來這兩支需要伺服器：')
  console.log('  bun run shop          # 開一個終端機')
  console.log('  bun run shop:e2e      # 另一個終端機：三角色協作')
  console.log('  bun run shop:persist  # 關機重開，不需要另外開伺服器')
} else {
  console.log(`${failed} 支未通過`)
  process.exit(1)
}
