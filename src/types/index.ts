export type RecordType = 'duration' | 'count'

export interface ExerciseRecord {
  id: string
  name: string
  type: RecordType
  duration?: number
  count?: number
  unit?: string
  date: string
  createdAt: number
}

export interface ExerciseOption {
  name: string
  type: RecordType
  unit: string
}

export const PRESET_EXERCISES: ExerciseOption[] = [
  { name: '跑步', type: 'duration', unit: '分钟' },
  { name: '瑜伽', type: 'duration', unit: '分钟' },
  { name: '游泳', type: 'duration', unit: '分钟' },
  { name: '骑行', type: 'duration', unit: '分钟' },
  { name: '健走', type: 'duration', unit: '分钟' },
  { name: '深蹲', type: 'count', unit: '组' },
  { name: '俯卧撑', type: 'count', unit: '次' },
  { name: '跳绳', type: 'count', unit: '次' },
  { name: '仰卧起坐', type: 'count', unit: '次' },
  { name: '引体向上', type: 'count', unit: '次' },
  { name: '平板支撑', type: 'duration', unit: '秒' },
  { name: '哑铃训练', type: 'count', unit: '组' },
]
