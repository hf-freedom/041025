# 运动打卡应用 - 代码分析报告

## 1. 项目概述

这是一个基于 Vue 3 + TypeScript 的运动打卡记录应用。用户可以通过该应用记录每日运动情况，支持多种运动类型，提供今日打卡、历史记录、日历视图和统计功能。

### 技术栈
- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建工具**: Vite
- **存储**: LocalStorage

---

## 2. 项目结构

```
project-root/
├── src/
│   ├── types/
│   │   └── index.ts          # 类型定义和预设运动数据
│   ├── App.vue               # 主应用组件（核心逻辑）
│   ├── main.ts               # 应用入口
│   ├── style.css             # 全局样式
│   └── vite-env.d.ts         # Vite 类型声明
├── index.html                # HTML 入口
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
├── vite.config.ts            # Vite 配置
└── docs/
    └── code-analysis-report.md # 本报告
```

---

## 3. 主要流程总览

本项目包含以下 **7 个核心流程**：

| 序号 | 流程名称 | 功能描述 |
|:----:|----------|----------|
| 1 | [应用启动流程](#31-应用启动流程) | 初始化 Vue 应用，挂载到 DOM |
| 2 | [数据加载流程](#32-数据加载流程) | 从 LocalStorage 加载历史记录 |
| 3 | [添加运动记录流程](#33-添加运动记录流程) | 用户填写表单并提交新记录 |
| 4 | [编辑记录流程](#34-编辑记录流程) | 修改已有运动记录 |
| 5 | [删除记录流程](#35-删除记录流程) | 删除指定运动记录 |
| 6 | [视图切换流程](#36-视图切换流程) | 切换今日/历史/日历/统计视图 |
| 7 | [日历导航流程](#37-日历导航流程) | 日历月份切换和日期选择 |

---

## 4. 流程详细分析

### 4.1 应用启动流程

**流程概述**: 初始化 Vue 3 应用实例并挂载到页面 DOM

```
main.ts → createApp(App) → mount('#app') → App.vue 初始化
```

**详细步骤**:

1. **导入依赖**
   - 导入 Vue 的 `createApp` 函数
   - 导入 App 根组件
   - 导入全局样式文件

2. **创建应用实例**
   - 调用 `createApp(App)` 创建应用实例

3. **挂载到 DOM**
   - 调用 `mount('#app')` 将应用挂载到 id 为 app 的 DOM 元素

4. **组件初始化**
   - App.vue 组件开始初始化
   - 设置响应式状态
   - 注册计算属性

---

### 4.2 数据加载流程

**流程概述**: 应用启动后从 LocalStorage 加载历史运动记录

```
App.vue onMounted → loadFromStorage() → localStorage.getItem() → 解析数据 → records.value
```

**详细步骤**:

1. **触发加载时机**
   - 组件挂载完成后触发 `onMounted` 生命周期钩子
   - 调用 `loadFromStorage()` 函数

2. **读取存储数据**
   - 使用 `localStorage.getItem(STORAGE_KEY)` 读取数据
   - `STORAGE_KEY` 值为 `'exercise-records'`

3. **解析数据**
   - 检查数据是否存在
   - 使用 `JSON.parse()` 将 JSON 字符串解析为数组
   - 异常处理：解析失败时设置为空数组

4. **更新状态**
   - 将解析后的数据赋值给 `records` 响应式变量
   - 触发视图更新

**入参出参**:
| 函数 | 入参 | 出参 | 说明 |
|------|------|------|------|
| `loadFromStorage()` | 无 | 无 | 副作用：修改 `records.value` |
| `localStorage.getItem()` | `STORAGE_KEY: 'exercise-records'` | `string \| null` | 获取存储的原始数据 |
| `JSON.parse()` | `data: string` | `ExerciseRecord[]` | 解析为记录数组 |

---

### 4.3 添加运动记录流程

**流程概述**: 用户填写表单并提交新的运动记录

```
用户填写表单 → 选择运动类型 → 输入数值 → 点击打卡 → submitRecord() → 生成记录 → 保存到 localStorage
```

**详细步骤**:

1. **表单填写阶段**
   - **选择运动项目**
     - 从预设列表选择（跑步、瑜伽等12种）
     - 或选择"自定义运动"并输入名称
   - **选择记录类型**
     - 时长类型：记录运动持续时间
     - 次数类型：记录运动次数/组数
   - **输入数值**
     - 根据类型输入时长或次数
     - 自定义运动可指定单位

2. **提交验证阶段**
   - 点击"打卡记录"按钮
   - 触发 `submitRecord()` 函数
   - **验证表单**
     - 检查运动名称是否为空
     - 检查数值是否大于0
     - 验证失败则阻止提交

3. **记录生成阶段**
   - **生成唯一 ID**
     - 调用 `generateId()` 函数
     - 基于时间戳和随机数生成
   - **构建记录对象**
     - 组装 `ExerciseRecord` 对象
     - 包含 id、name、type、duration/count、unit、date、createdAt

4. **数据保存阶段**
   - **添加到数组**
     - 使用 `unshift()` 将新记录添加到数组开头
   - **持久化存储**
     - 调用 `saveToStorage()` 保存到 LocalStorage
   - **重置表单**
     - 调用 `resetForm()` 清空表单状态

**入参出参**:
| 函数 | 入参 | 出参 | 说明 |
|------|------|------|------|
| `submitRecord()` | 无（使用响应式状态） | 无 | 创建并保存新记录 |
| `generateId()` | 无 | `string` | 生成唯一标识符 |
| `getToday()` | 无 | `string` | 返回当前日期 YYYY-MM-DD |
| `saveToStorage()` | 无 | 无 | 保存到 localStorage |
| `resetForm()` | 无 | 无 | 清空表单状态 |

**生成的记录结构**:
```typescript
interface ExerciseRecord {
  id: string           // 唯一标识
  name: string         // 运动名称
  type: RecordType     // 'duration' | 'count'
  duration?: number    // 时长（可选）
  count?: number       // 次数（可选）
  unit?: string        // 单位
  date: string         // 日期 YYYY-MM-DD
  createdAt: number    // 时间戳
}
```

---

### 4.4 编辑记录流程

**流程概述**: 修改已有运动记录的内容

```
点击编辑按钮 → openEditModal(record) → 填充编辑表单 → 用户修改 → saveEdit() → 更新记录 → 保存到 localStorage
```

**详细步骤**:

1. **打开编辑弹窗**
   - 用户点击记录的"编辑"按钮
   - 调用 `openEditModal(record)`，传入要编辑的记录
   - **填充表单数据**
     - 判断是否为预设运动
     - 设置运动名称/类型/数值到编辑状态
   - 显示编辑弹窗 (`showEditModal = true`)

2. **用户修改阶段**
   - 用户在弹窗中修改各项数据
   - 可修改：运动项目、记录类型、数值、单位

3. **保存修改**
   - 点击"保存"按钮
   - 触发 `saveEdit()` 函数
   - **验证表单**
     - 检查运动名称是否为空
     - 检查数值是否大于0
   - **查找并更新记录**
     - 使用 `findIndex()` 在数组中定位记录
     - 更新对应索引的记录数据

4. **完成编辑**
   - 调用 `saveToStorage()` 持久化
   - 调用 `closeEditModal()` 关闭弹窗
   - 清理编辑状态

**入参出参**:
| 函数 | 入参 | 出参 | 说明 |
|------|------|------|------|
| `openEditModal(record)` | `record: ExerciseRecord` | 无 | 打开编辑弹窗并填充数据 |
| `saveEdit()` | 无（使用 `editingRecord` 状态） | 无 | 保存修改后的记录 |
| `closeEditModal()` | 无 | 无 | 关闭弹窗并清理状态 |

---

### 4.5 删除记录流程

**流程概述**: 删除指定的运动记录

```
点击删除按钮 → deleteRecord(id) → 过滤数组 → 保存到 localStorage
```

**详细步骤**:

1. **触发删除**
   - 用户点击记录的"删除"按钮
   - 调用 `deleteRecord(id)`，传入记录 ID

2. **移除记录**
   - 使用 `filter()` 方法过滤掉指定 ID 的记录
   - 返回新数组（不包含被删除记录）
   - 更新 `records.value`

3. **持久化更新**
   - 调用 `saveToStorage()` 保存更新后的数据

**入参出参**:
| 函数 | 入参 | 出参 | 说明 |
|------|------|------|------|
| `deleteRecord(id)` | `id: string` | 无 | 删除指定记录 |

---

### 4.6 视图切换流程

**流程概述**: 在四个功能视图之间切换

```
点击标签按钮 → 修改 currentView → 条件渲染对应视图
```

**详细步骤**:

1. **用户点击**
   - 用户点击顶部导航标签按钮

2. **更新视图状态**
   - 修改 `currentView` 响应式变量
   - 可选值：`'today'`, `'history'`, `'calendar'`, `'stats'`

3. **条件渲染**
   - Vue 根据 `currentView` 值条件渲染对应视图
   - 使用 `<template v-if="currentView === 'xxx'">` 控制显示

**视图类型**:
| 视图 | 值 | 功能描述 |
|------|-----|----------|
| 今日打卡 | `'today'` | 添加记录、查看今日汇总和记录列表 |
| 历史记录 | `'history'` | 查看所有历史记录 |
| 日历视图 | `'calendar'` | 按月查看打卡情况，点击日期查看详情 |
| 统计 | `'stats'` | 查看本周和本月统计数据 |

---

### 4.7 日历导航流程

**流程概述**: 日历视图中切换月份和选择日期

```
点击上一月/下一月按钮 → prevMonth()/nextMonth() → 更新年月 → 重新计算日历天数
```

**详细步骤**:

1. **月份导航**
   - 用户点击"<"或">"按钮
   - **切换到上一月**
     - 调用 `prevMonth()`
     - 如果当前是1月，年份减1，月份设为12月
     - 否则月份减1
   - **切换到下一月**
     - 调用 `nextMonth()`
     - 如果当前是12月，年份加1，月份设为1月
     - 否则月份加1

2. **重新计算日历**
   - `calendarYear` 或 `calendarMonth` 变化
   - `calendarDays` 计算属性自动重新计算
   - 生成新的日历网格数据

3. **日期选择**
   - 用户点击日历中的某一天
   - 调用 `selectCalendarDate(date)`
   - 更新 `selectedCalendarDate`
   - 显示该日期的记录列表

**入参出参**:
| 函数 | 入参 | 出参 | 说明 |
|------|------|------|------|
| `prevMonth()` | 无 | 无 | 切换到上一个月 |
| `nextMonth()` | 无 | 无 | 切换到下一个月 |
| `selectCalendarDate(date)` | `date: string` | 无 | 选择特定日期 |

---

## 5. 计算属性分析

### 5.1 数据过滤类

| 计算属性 | 依赖 | 返回值 | 功能 |
|----------|------|--------|------|
| `todayRecords` | `records`, `filterExerciseType` | `ExerciseRecord[]` | 过滤今日记录 |
| `selectedDateRecords` | `records`, `selectedCalendarDate` | `ExerciseRecord[]` | 获取选中日期的记录 |
| `allExerciseTypes` | `records` | `string[]` | 获取所有运动类型 |

### 5.2 统计类

| 计算属性 | 依赖 | 返回值 | 功能 |
|----------|------|--------|------|
| `todayStats` | `records` | `{totalDuration, totalCount, typeCount, recordCount}` | 今日统计数据 |
| `weekStats` | `records` | `{count, totalDuration}` | 本周统计数据 |
| `monthStats` | `records` | `{count, totalDuration}` | 本月统计数据 |

### 5.3 表单辅助类

| 计算属性 | 依赖 | 返回值 | 功能 |
|----------|------|--------|------|
| `exerciseOptions` | `PRESET_EXERCISES` | `string[]` | 预设运动名称列表 |
| `selectedExerciseInfo` | `selectedExercise` | `ExerciseOption \| null` | 当前选中运动信息 |
| `currentUnit` | `selectedExerciseInfo`, `customUnit`, `recordType` | `string` | 当前单位显示 |
| `isCustomExercise` | `selectedExercise` | `boolean` | 是否自定义运动 |
| `exerciseName` | `isCustomExercise`, `customExerciseName`, `selectedExercise` | `string` | 运动名称 |
| `canSubmit` | `exerciseName`, `recordType`, `duration`, `count` | `boolean` | 是否可提交 |

### 5.4 日历类

| 计算属性 | 依赖 | 返回值 | 功能 |
|----------|------|--------|------|
| `calendarDays` | `calendarYear`, `calendarMonth`, `records` | `CalendarDay[]` | 日历天数数组 |

---

## 6. 工具函数分析

| 函数 | 入参 | 出参 | 功能描述 |
|------|------|------|----------|
| `generateId()` | 无 | `string` | 基于时间戳和随机数生成唯一 ID |
| `getToday()` | 无 | `string` | 获取当前日期 (YYYY-MM-DD) |
| `formatDate(dateStr)` | `dateStr: string` | `string` | 格式化日期显示 |
| `formatDateTime(timestamp)` | `timestamp: number` | `string` | 格式化时间显示 (HH:MM) |
| `hasRecordOnDate(date)` | `date: string` | `boolean` | 检查指定日期是否有记录 |
| `getRecordDetail(record)` | `record: ExerciseRecord` | `string` | 获取记录详情文本 |
| `onExerciseChange()` | 无 | 无 | 运动选择变化时更新记录类型 |
| `onEditExerciseChange()` | 无 | 无 | 编辑时运动选择变化处理 |
| `saveToStorage()` | 无 | 无 | 保存记录到 localStorage |
| `loadFromStorage()` | 无 | 无 | 从 localStorage 加载记录 |

---

## 7. 类型定义

### 7.1 核心类型

```typescript
// 记录类型：时长或次数
type RecordType = 'duration' | 'count'

// 运动记录接口
interface ExerciseRecord {
  id: string
  name: string
  type: RecordType
  duration?: number
  count?: number
  unit?: string
  date: string
  createdAt: number
}

// 运动选项接口
interface ExerciseOption {
  name: string
  type: RecordType
  unit: string
}
```

### 7.2 视图类型

```typescript
type ViewMode = 'today' | 'history' | 'calendar' | 'stats'
```

### 7.3 预设运动数据

```typescript
const PRESET_EXERCISES: ExerciseOption[] = [
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
```

---

## 8. 状态管理

### 8.1 核心数据状态

| 状态名 | 类型 | 初始值 | 说明 |
|--------|------|--------|------|
| `records` | `Ref<ExerciseRecord[]>` | `[]` | 所有运动记录 |
| `currentView` | `Ref<ViewMode>` | `'today'` | 当前视图 |
| `filterExerciseType` | `Ref<string>` | `''` | 运动类型筛选 |

### 8.2 添加表单状态

| 状态名 | 类型 | 初始值 | 说明 |
|--------|------|--------|------|
| `selectedExercise` | `Ref<string>` | `''` | 选中的运动 |
| `customExerciseName` | `Ref<string>` | `''` | 自定义运动名称 |
| `recordType` | `Ref<RecordType>` | `'duration'` | 记录类型 |
| `duration` | `Ref<number>` | `0` | 时长值 |
| `count` | `Ref<number>` | `0` | 次数值 |
| `customUnit` | `Ref<string>` | `''` | 自定义单位 |

### 8.3 编辑表单状态

| 状态名 | 类型 | 初始值 | 说明 |
|--------|------|--------|------|
| `editingRecord` | `Ref<ExerciseRecord \| null>` | `null` | 正在编辑的记录 |
| `editSelectedExercise` | `Ref<string>` | `''` | 编辑时选中的运动 |
| `editCustomExerciseName` | `Ref<string>` | `''` | 编辑时自定义名称 |
| `editRecordType` | `Ref<RecordType>` | `'duration'` | 编辑时记录类型 |
| `editDuration` | `Ref<number>` | `0` | 编辑时时长 |
| `editCount` | `Ref<number>` | `0` | 编辑时次数 |
| `editCustomUnit` | `Ref<string>` | `''` | 编辑时自定义单位 |
| `showEditModal` | `Ref<boolean>` | `false` | 是否显示编辑弹窗 |

### 8.4 日历状态

| 状态名 | 类型 | 初始值 | 说明 |
|--------|------|--------|------|
| `calendarYear` | `Ref<number>` | 当前年份 | 日历年份 |
| `calendarMonth` | `Ref<number>` | 当前月份 | 日历月份 (0-11) |
| `selectedCalendarDate` | `Ref<string \| null>` | `null` | 选中的日历日期 |

---

## 9. 存储机制

### 9.1 LocalStorage 键值

| 键名 | 值类型 | 说明 |
|------|--------|------|
| `exercise-records` | `JSON string` | 存储所有运动记录 |

### 9.2 存储流程

```
数据变更 → saveToStorage() → JSON.stringify() → localStorage.setItem()
```

### 9.3 读取流程

```
应用启动 → loadFromStorage() → localStorage.getItem() → JSON.parse() → records.value
```

---

## 10. 功能模块总结

### 10.1 今日打卡模块
- 添加新的运动记录
- 支持预设运动和自定义运动
- 支持时长和次数两种记录方式
- 显示今日汇总统计
- 显示今日记录列表（支持筛选）
- 编辑和删除今日记录

### 10.2 历史记录模块
- 显示所有历史记录（按时间倒序）
- 每条记录显示日期、时间、详情
- 支持编辑和删除记录

### 10.3 日历视图模块
- 按月显示日历
- 有记录的日期高亮显示
- 支持切换月份
- 点击日期查看当天记录
- 支持编辑和删除记录

### 10.4 统计模块
- 本周统计：运动次数、累计时长
- 本月统计：运动次数、累计时长

---

## 11. 数据流图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户交互层                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 今日打卡  │ │ 历史记录  │ │ 日历视图  │ │  统计    │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
└───────┼────────────┼────────────┼────────────┼─────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                        业务逻辑层                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  submitRecord  │  deleteRecord  │  saveEdit         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  openEditModal │  closeEditModal │  resetForm       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  prevMonth │ nextMonth │ selectCalendarDate         │   │
│  └─────────────────────────────────────────────────────┘   │
└───────┬────────────────────────────────────────┬────────────┘
        │                                        │
        ▼                                        ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据管理层                            │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  records (Ref)  │◄──►│  计算属性: todayRecords,        │ │
│  │  所有运动记录    │    │  weekStats, monthStats, etc.   │ │
│  └────────┬────────┘    └─────────────────────────────────┘ │
└───────────┼─────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                        持久化层                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LocalStorage: 'exercise-records'                   │   │
│  │  saveToStorage() / loadFromStorage()                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. 总结

本应用是一个功能完整的单页面运动打卡应用，采用 Vue 3 Composition API 开发，具有以下特点：

1. **响应式设计**: 使用 Vue 的响应式系统管理状态
2. **本地存储**: 使用 LocalStorage 实现数据持久化
3. **类型安全**: 使用 TypeScript 提供类型检查
4. **模块化**: 类型定义、组件逻辑分离清晰
5. **用户友好**: 提供多种视图和统计功能
