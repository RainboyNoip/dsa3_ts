<script setup lang="ts">
import { formatDistance, type Matrix, type FloydFrame } from './floyd'
const props = defineProps<{ matrix: Matrix; ids: string[]; title: string; frame?: FloydFrame; sources?: boolean; target?: boolean }>()
function roles(i: number, j: number): string[] {
  const f = props.frame
  if (!f || f.phase === 'initial') return []
  const roles: string[] = []
  if (props.sources && i === f.i && j === f.k - 1) roles.push('left')
  if (props.sources && i === f.k - 1 && j === f.j) roles.push('right')
  if (props.target && i === f.i && j === f.j) roles.push(f.phase === 'result' && f.changed ? 'updated' : 'target')
  return roles
}
const labels: Record<string, string> = { left: '来源①', right: '来源②', target: '目标', updated: '已更新' }
</script>
<template>
  <div class="table-scroll">
    <table>
      <caption>{{ title }}</caption>
      <thead><tr><th scope="col">i ＼ j</th><th v-for="id in ids" :key="id" scope="col">{{ id }}</th></tr></thead>
      <tbody><tr v-for="(row, i) in matrix" :key="i">
        <th scope="row">{{ ids[i] }}</th>
        <td v-for="(value, j) in row" :key="j" :class="roles(i, j)">
          <span>{{ formatDistance(value) }}</span>
          <small v-for="role in roles(i, j)" :key="role">{{ labels[role] }}</small>
        </td>
      </tr></tbody>
    </table>
  </div>
</template>
<style scoped>
.table-scroll { overflow-x: auto; min-width: 0; }
table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
caption { text-align: left; font-weight: 650; padding: 8px 0; }
th, td { border: 1px solid #cbd5e1; text-align: center; min-width: 38px; height: 38px; padding: 3px; }
th { background: #f1f5f9; } td { transition: background-color 160ms; }
small { display: block; font-size: 10px; white-space: nowrap; }
.left { background: #dbeafe; color: #1e40af; }
.right { background: #ffedd5; color: #9a3412; }
.left.right { background: #ede9fe; color: #5b21b6; }
.target { outline: 2px solid #7c3aed; outline-offset: -2px; }
.updated { outline: 3px solid #15803d; outline-offset: -3px; background: #dcfce7; color: #166534; }
@media (prefers-reduced-motion: reduce) { td { transition: none; } }
</style>
