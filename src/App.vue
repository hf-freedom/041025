<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ExerciseRecord, RecordType, ExerciseOption } from './types'
import { PRESET_EXERCISES } from './types'

const STORAGE_KEY = 'exercise-records'

type ViewMode = 'today' | 'history' | 'calendar' | 'stats'

const records = ref<ExerciseRecord[]>([])
const currentView = ref<ViewMode>('today')
const filterExerciseType = ref<string>('')

const selectedExercise = ref<string>('')
const customExerciseName = ref<string>('')
const recordType = ref<RecordType>('duration')
const duration = ref<number>(0)
const count = ref<number>(0)
const customUnit = ref<string>('')

const editingRecord = ref<ExerciseRecord | null>(null)
const editSelectedExercise = ref<string>('')
const editCustomExerciseName = ref<string>('')
const editRecordType = ref<RecordType>('duration')
const editDuration = ref<number>(0)
const editCount = ref<number>(0)
const editCustomUnit = ref<string>('')
const showEditModal = ref(false)

const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth())
const selectedCalendarDate = ref<string | null>(null)

const exerciseOptions = computed(() => {
  return PRESET_EXERCISES.map(e => e.name)
})

const selectedExerciseInfo = computed<ExerciseOption | null>(() => {
  return PRESET_EXERCISES.find(e => e.name === selectedExercise.value) || null
})

const editSelectedExerciseInfo = computed<ExerciseOption | null>(() => {
  return PRESET_EXERCISES.find(e => e.name === editSelectedExercise.value) || null
})

const currentUnit = computed(() => {
  if (selectedExerciseInfo.value) {
    return selectedExerciseInfo.value.unit
  }
  if (customUnit.value) {
    return customUnit.value
  }
  return recordType.value === 'duration' ? '分钟' : '次'
})

const editCurrentUnit = computed(() => {
  if (editSelectedExerciseInfo.value) {
    return editSelectedExerciseInfo.value.unit
  }
  if (editCustomUnit.value) {
    return editCustomUnit.value
  }
  return editRecordType.value === 'duration' ? '分钟' : '次'
})

const isCustomExercise = computed(() => {
  return selectedExercise.value === '__custom__'
})

const isEditCustomExercise = computed(() => {
  return editSelectedExercise.value === '__custom__'
})

const exerciseName = computed(() => {
  if (isCustomExercise.value) {
    return customExerciseName.value
  }
  return selectedExercise.value
})

const editExerciseName = computed(() => {
  if (isEditCustomExercise.value) {
    return editCustomExerciseName.value
  }
  return editSelectedExercise.value
})

const canSubmit = computed(() => {
  if (!exerciseName.value.trim()) return false
  if (recordType.value === 'duration') {
    return duration.value > 0
  }
  return count.value > 0
})

const canEditSubmit = computed(() => {
  if (!editExerciseName.value.trim()) return false
  if (editRecordType.value === 'duration') {
    return editDuration.value > 0
  }
  return editCount.value > 0
})

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

const todayRecords = computed(() => {
  const today = getToday()
  let filtered = records.value.filter(r => r.date === today)
  if (filterExerciseType.value) {
    filtered = filtered.filter(r => r.name === filterExerciseType.value)
  }
  return filtered
})

const todayStats = computed(() => {
  const today = getToday()
  const todayRecordsAll = records.value.filter(r => r.date === today)
  
  let totalDuration = 0
  let totalCount = 0
  const exerciseTypes = new Set<string>()
  
  todayRecordsAll.forEach(r => {
    exerciseTypes.add(r.name)
    if (r.type === 'duration' && r.duration) {
      totalDuration += r.duration
    } else if (r.type === 'count' && r.count) {
      totalCount += r.count
    }
  })
  
  return {
    totalDuration,
    totalCount,
    typeCount: exerciseTypes.size,
    recordCount: todayRecordsAll.length
  }
})

const allExerciseTypes = computed(() => {
  const types = new Set<string>()
  records.value.forEach(r => types.add(r.name))
  return Array.from(types)
})

const weekStats = computed(() => {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  const weekRecords = records.value.filter(r => {
    const recordDate = new Date(r.date)
    return recordDate >= monday && recordDate <= sunday
  })
  
  let totalDuration = 0
  weekRecords.forEach(r => {
    if (r.type === 'duration' && r.duration) {
      totalDuration += r.duration
    }
  })
  
  return {
    count: weekRecords.length,
    totalDuration
  }
})

const monthStats = computed(() => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const monthRecords = records.value.filter(r => {
    const recordDate = new Date(r.date)
    return recordDate >= firstDay && recordDate <= lastDay
  })
  
  let totalDuration = 0
  monthRecords.forEach(r => {
    if (r.type === 'duration' && r.duration) {
      totalDuration += r.duration
    }
  })
  
  return {
    count: monthRecords.length,
    totalDuration
  }
})

const calendarDays = computed(() => {
  const year = calendarYear.value
  const month = calendarMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay()
  
  const days: { date: string; day: number; isCurrentMonth: boolean; hasRecord: boolean }[] = []
  
  const prevMonth = new Date(year, month, 0)
  const prevMonthDays = prevMonth.getDate()
  
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day).toISOString().split('T')[0]
    days.push({ date, day, isCurrentMonth: false, hasRecord: hasRecordOnDate(date) })
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i).toISOString().split('T')[0]
    days.push({ date, day: i, isCurrentMonth: true, hasRecord: hasRecordOnDate(date) })
  }
  
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i).toISOString().split('T')[0]
    days.push({ date, day: i, isCurrentMonth: false, hasRecord: hasRecordOnDate(date) })
  }
  
  return days
})

const selectedDateRecords = computed(() => {
  if (!selectedCalendarDate.value) return []
  return records.value.filter(r => r.date === selectedCalendarDate.value)
})

function hasRecordOnDate(date: string): boolean {
  return records.value.some(r => r.date === date)
}

function prevMonth() {
  if (calendarMonth.value === 0) {
    calendarMonth.value = 11
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
}

function nextMonth() {
  if (calendarMonth.value === 11) {
    calendarMonth.value = 0
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
}

function selectCalendarDate(date: string) {
  selectedCalendarDate.value = date
}

function onExerciseChange() {
  if (selectedExerciseInfo.value) {
    recordType.value = selectedExerciseInfo.value.type
  }
}

function onEditExerciseChange() {
  if (editSelectedExerciseInfo.value) {
    editRecordType.value = editSelectedExerciseInfo.value.type
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function submitRecord() {
  if (!canSubmit.value) return

  const record: ExerciseRecord = {
    id: generateId(),
    name: exerciseName.value.trim(),
    type: recordType.value,
    date: getToday(),
    createdAt: Date.now()
  }

  if (recordType.value === 'duration') {
    record.duration = duration.value
    record.unit = currentUnit.value
  } else {
    record.count = count.value
    record.unit = currentUnit.value
  }

  records.value.unshift(record)
  resetForm()
  saveToStorage()
}

function resetForm() {
  selectedExercise.value = ''
  customExerciseName.value = ''
  duration.value = 0
  count.value = 0
  customUnit.value = ''
  recordType.value = 'duration'
}

function deleteRecord(id: string) {
  records.value = records.value.filter(r => r.id !== id)
  saveToStorage()
}

function openEditModal(record: ExerciseRecord) {
  editingRecord.value = { ...record }
  
  const isPreset = PRESET_EXERCISES.some(e => e.name === record.name)
  if (isPreset) {
    editSelectedExercise.value = record.name
  } else {
    editSelectedExercise.value = '__custom__'
    editCustomExerciseName.value = record.name
  }
  
  editRecordType.value = record.type
  if (record.type === 'duration') {
    editDuration.value = record.duration || 0
  } else {
    editCount.value = record.count || 0
  }
  editCustomUnit.value = record.unit || ''
  
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingRecord.value = null
  editSelectedExercise.value = ''
  editCustomExerciseName.value = ''
  editDuration.value = 0
  editCount.value = 0
  editCustomUnit.value = ''
  editRecordType.value = 'duration'
}

function saveEdit() {
  if (!editingRecord.value || !canEditSubmit.value) return
  
  const index = records.value.findIndex(r => r.id === editingRecord.value!.id)
  if (index === -1) return
  
  records.value[index] = {
    ...records.value[index],
    name: editExerciseName.value.trim(),
    type: editRecordType.value,
    duration: editRecordType.value === 'duration' ? editDuration.value : undefined,
    count: editRecordType.value === 'count' ? editCount.value : undefined,
    unit: editCurrentUnit.value
  }
  
  saveToStorage()
  closeEditModal()
}

function getRecordDetail(record: ExerciseRecord): string {
  if (record.type === 'duration') {
    return `时长: ${record.duration} ${record.unit}`
  }
  return `数量: ${record.count} ${record.unit}`
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
}

function loadFromStorage() {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      records.value = JSON.parse(data)
    } catch {
      records.value = []
    }
  }
}

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const weekDayNames = ['日', '一', '二', '三', '四', '五', '六']

onMounted(() => {
  loadFromStorage()
})
</script>

<template>
  <h1>每日运动打卡</h1>
  
  <div class="tabs">
    <button 
      class="tab-btn" 
      :class="{ active: currentView === 'today' }"
      @click="currentView = 'today'"
    >
      今日打卡
    </button>
    <button 
      class="tab-btn" 
      :class="{ active: currentView === 'history' }"
      @click="currentView = 'history'"
    >
      历史记录
    </button>
    <button 
      class="tab-btn" 
      :class="{ active: currentView === 'calendar' }"
      @click="currentView = 'calendar'"
    >
      日历视图
    </button>
    <button 
      class="tab-btn" 
      :class="{ active: currentView === 'stats' }"
      @click="currentView = 'stats'"
    >
      统计
    </button>
  </div>

  <template v-if="currentView === 'today'">
    <div class="container">
      <h2>添加运动记录</h2>
      
      <div class="form-group">
        <label>选择运动项目</label>
        <select v-model="selectedExercise" @change="onExerciseChange">
          <option value="">请选择...</option>
          <option v-for="name in exerciseOptions" :key="name" :value="name">
            {{ name }}
          </option>
          <option value="__custom__">自定义运动...</option>
        </select>
        
        <div v-if="isCustomExercise" class="custom-input">
          <input 
            v-model="customExerciseName" 
            type="text" 
            placeholder="请输入运动名称"
          />
        </div>
      </div>

      <div class="form-group">
        <label>记录类型</label>
        <div class="radio-group">
          <label 
            class="radio-label" 
            :class="{ active: recordType === 'duration' }"
          >
            <input 
              type="radio" 
              v-model="recordType" 
              value="duration"
            />
            记录时长
          </label>
          <label 
            class="radio-label" 
            :class="{ active: recordType === 'count' }"
          >
            <input 
              type="radio" 
              v-model="recordType" 
              value="count"
            />
            记录次数/组数
          </label>
        </div>
      </div>

      <div class="form-group">
        <label v-if="recordType === 'duration'">运动时长</label>
        <label v-else>运动数量</label>
        
        <div class="input-row">
          <input 
            v-if="recordType === 'duration'"
            v-model.number="duration" 
            type="number" 
            min="1"
            placeholder="请输入时长"
          />
          <input 
            v-else
            v-model.number="count" 
            type="number" 
            min="1"
            placeholder="请输入数量"
          />
          <span>{{ currentUnit }}</span>
        </div>
        
        <div v-if="isCustomExercise" class="custom-input">
          <input 
            v-model="customUnit" 
            type="text" 
            placeholder="自定义单位（可选）"
          />
        </div>
      </div>

      <button 
        class="btn btn-primary" 
        :disabled="!canSubmit"
        @click="submitRecord"
      >
        打卡记录
      </button>
    </div>

    <div class="container">
      <h2>今日汇总</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ todayStats.totalDuration }}</div>
          <div class="stat-label">运动总时长(分钟)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ todayStats.recordCount }}</div>
          <div class="stat-label">打卡次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ todayStats.typeCount }}</div>
          <div class="stat-label">运动类型数</div>
        </div>
      </div>
    </div>

    <div class="container">
      <h2>今日记录</h2>
      
      <div class="form-group">
        <label>按运动类型筛选</label>
        <select v-model="filterExerciseType">
          <option value="">全部</option>
          <option v-for="name in allExerciseTypes" :key="name" :value="name">
            {{ name }}
          </option>
        </select>
      </div>
      
      <div v-if="todayRecords.length === 0" class="empty-state">
        暂无运动记录，开始打卡吧！
      </div>
      
      <div v-else>
        <div 
          v-for="record in todayRecords" 
          :key="record.id" 
          class="record-item"
        >
          <div class="record-header">
            <span class="record-title">{{ record.name }}</span>
            <div>
              <span class="record-time">{{ formatDateTime(record.createdAt) }}</span>
              <button 
                class="edit-btn" 
                @click="openEditModal(record)"
              >
                编辑
              </button>
              <button 
                class="delete-btn" 
                @click="deleteRecord(record.id)"
              >
                删除
              </button>
            </div>
          </div>
          <div class="record-detail">
            {{ getRecordDetail(record) }}
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else-if="currentView === 'history'">
    <div class="container">
      <h2>历史记录</h2>
      
      <div v-if="records.length === 0" class="empty-state">
        暂无运动记录
      </div>
      
      <div v-else class="history-list">
        <div 
          v-for="record in records" 
          :key="record.id" 
          class="record-item"
        >
          <div class="record-header">
            <span class="record-title">{{ record.name }}</span>
            <div>
              <span class="record-date">{{ formatDate(record.date) }}</span>
              <button 
                class="edit-btn" 
                @click="openEditModal(record)"
              >
                编辑
              </button>
              <button 
                class="delete-btn" 
                @click="deleteRecord(record.id)"
              >
                删除
              </button>
            </div>
          </div>
          <div class="record-detail">
            {{ getRecordDetail(record) }}
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else-if="currentView === 'calendar'">
    <div class="container">
      <h2>打卡日历</h2>
      
      <div class="calendar-header">
        <button class="calendar-nav-btn" @click="prevMonth">&lt;</button>
        <span class="calendar-title">{{ calendarYear }}年 {{ monthNames[calendarMonth] }}</span>
        <button class="calendar-nav-btn" @click="nextMonth">&gt;</button>
      </div>
      
      <div class="calendar-weekdays">
        <div v-for="day in weekDayNames" :key="day" class="weekday">{{ day }}</div>
      </div>
      
      <div class="calendar-grid">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          class="calendar-day"
          :class="{ 
            'other-month': !day.isCurrentMonth,
            'has-record': day.hasRecord,
            'selected': selectedCalendarDate === day.date,
            'today': day.date === getToday()
          }"
          @click="selectCalendarDate(day.date)"
        >
          {{ day.day }}
        </div>
      </div>
      
      <div v-if="selectedCalendarDate" class="selected-date-records">
        <h3>{{ formatDate(selectedCalendarDate) }} 的记录</h3>
        <div v-if="selectedDateRecords.length === 0" class="empty-state">
          当天无运动记录
        </div>
        <div v-else>
          <div 
            v-for="record in selectedDateRecords" 
            :key="record.id" 
            class="record-item"
          >
            <div class="record-header">
              <span class="record-title">{{ record.name }}</span>
              <div>
                <span class="record-time">{{ formatDateTime(record.createdAt) }}</span>
                <button 
                  class="edit-btn" 
                  @click="openEditModal(record)"
                >
                  编辑
                </button>
                <button 
                  class="delete-btn" 
                  @click="deleteRecord(record.id)"
                >
                  删除
                </button>
              </div>
            </div>
            <div class="record-detail">
              {{ getRecordDetail(record) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <template v-else-if="currentView === 'stats'">
    <div class="container">
      <h2>本周统计</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ weekStats.count }}</div>
          <div class="stat-label">运动总次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ weekStats.totalDuration }}</div>
          <div class="stat-label">累计时长(分钟)</div>
        </div>
      </div>
    </div>

    <div class="container">
      <h2>本月统计</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ monthStats.count }}</div>
          <div class="stat-label">运动总次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ monthStats.totalDuration }}</div>
          <div class="stat-label">累计时长(分钟)</div>
        </div>
      </div>
    </div>
  </template>

  <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
    <div class="modal-content">
      <h2>编辑记录</h2>
      
      <div class="form-group">
        <label>选择运动项目</label>
        <select v-model="editSelectedExercise" @change="onEditExerciseChange">
          <option value="">请选择...</option>
          <option v-for="name in exerciseOptions" :key="name" :value="name">
            {{ name }}
          </option>
          <option value="__custom__">自定义运动...</option>
        </select>
        
        <div v-if="isEditCustomExercise" class="custom-input">
          <input 
            v-model="editCustomExerciseName" 
            type="text" 
            placeholder="请输入运动名称"
          />
        </div>
      </div>

      <div class="form-group">
        <label>记录类型</label>
        <div class="radio-group">
          <label 
            class="radio-label" 
            :class="{ active: editRecordType === 'duration' }"
          >
            <input 
              type="radio" 
              v-model="editRecordType" 
              value="duration"
            />
            记录时长
          </label>
          <label 
            class="radio-label" 
            :class="{ active: editRecordType === 'count' }"
          >
            <input 
              type="radio" 
              v-model="editRecordType" 
              value="count"
            />
            记录次数/组数
          </label>
        </div>
      </div>

      <div class="form-group">
        <label v-if="editRecordType === 'duration'">运动时长</label>
        <label v-else>运动数量</label>
        
        <div class="input-row">
          <input 
            v-if="editRecordType === 'duration'"
            v-model.number="editDuration" 
            type="number" 
            min="1"
            placeholder="请输入时长"
          />
          <input 
            v-else
            v-model.number="editCount" 
            type="number" 
            min="1"
            placeholder="请输入数量"
          />
          <span>{{ editCurrentUnit }}</span>
        </div>
        
        <div v-if="isEditCustomExercise" class="custom-input">
          <input 
            v-model="editCustomUnit" 
            type="text" 
            placeholder="自定义单位（可选）"
          />
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-secondary" @click="closeEditModal">取消</button>
        <button 
          class="btn btn-primary" 
          :disabled="!canEditSubmit"
          @click="saveEdit"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>
