# 每日运动打卡应用 - 代码分析报告

## 项目概述

**项目名称**: exercise-tracker (每日运动打卡)
**技术栈**: Vue 3.4 + TypeScript 5.3 + Vite 5.0
**项目类型**: 前端单页应用
**存储方式**: localStorage 本地存储

---

## 一、项目主要流程

### 1.1 四大核心业务流程

| 流程ID | 流程名称 | 流程描述 | 主要功能 |
|--------|---------|---------|---------|
| P1 | **运动记录管理主流程** | 运动记录的完整生命周期管理 | 添加记录、编辑记录、删除记录 |
| P2 | **数据持久化流程** | 本地数据的读写操作 | 应用启动加载、变更后存储 |
| P3 | **视图展示切换流程** | 多维度数据展示 | 今日视图、历史视图、日历视图、统计视图 |
| P4 | **数据统计聚合流程** | 多维度数据统计计算 | 今日/本周/本月数据分析 |

---

## 二、各流程详细步骤（分层级）

---

### 2.1 流程P1: 运动记录管理主流程

#### 2.1.1 子流程P1-1: 添加运动记录流程

**流程作用**: 用户完成一次运动打卡，将记录持久化存储

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| **阶段一: 表单输入** | | | |
| 1 | 初始化表单状态 | 准备接收用户输入 | • 清空selectedExercise下拉选择<br>• 清空customExerciseName自定义名称<br>• duration/count数值置0<br>• recordType默认设为duration |
| 2 | 选择运动项目 | 确定运动类型 | **分支A: 选择预设运动**<br> &nbsp;&nbsp;• 从12种预设运动中选择<br> &nbsp;&nbsp;• 自动设置该运动的默认记录类型<br> &nbsp;&nbsp;• 自动设置该运动的默认单位<br><br>**分支B: 自定义运动**<br> &nbsp;&nbsp;• 选择"自定义运动..."选项<br> &nbsp;&nbsp;• 输入自定义运动名称<br> &nbsp;&nbsp;• 可选择性输入自定义单位 |
| 3 | 选择记录类型 | 确定记录方式 | **分支A: 记录时长 (duration)**<br> &nbsp;&nbsp;• 适用于跑步、瑜伽等计时类运动<br> &nbsp;&nbsp;• 默认单位：分钟/秒<br><br>**分支B: 记录次数 (count)**<br> &nbsp;&nbsp;• 适用于俯卧撑、深蹲等计数类运动<br> &nbsp;&nbsp;• 默认单位：次/组 |
| 4 | 输入运动数值 | 填写运动数据 | • 时长类型：输入运动分钟数<br>• 次数类型：输入运动次数/组数 |
| | | | |
| **阶段二: 提交处理** | | | |
| 5 | 表单验证 | 确保数据合法性 | 通过canSubmit计算属性验证：<br>• 运动名称不能为空<br>• 时长类型：duration > 0<br>• 次数类型：count > 0 |
| 6 | 生成唯一标识 | 为记录分配ID | 调用generateId()算法：<br>• Date.now().toString(36) 时间戳<br>• + Math.random().toString(36).substr(2) 随机后缀 |
| 7 | 构建记录对象 | 组装标准数据结构 | 构建ExerciseRecord对象：<br>• id, name, type, date, createdAt<br>• 根据类型赋值 duration 或 count<br>• 设置对应的 unit |
| 8 | 更新内存数据 | 添加到响应式数组 | • records.value.unshift(record)<br>• 新记录添加到数组头部，保证最新在前 |
| 9 | 重置表单 | 准备下一次输入 | 清空所有表单输入项，恢复初始状态 |
| 10 | 持久化存储 | 数据写入本地 | 调用saveToStorage()写入localStorage |

**关键函数**: `submitRecord()` - App.vue:296-318

---

#### 2.1.2 子流程P1-2: 编辑运动记录流程

**流程作用**: 修改已存在的运动记录数据

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| **阶段一: 打开编辑** | | | |
| 1 | 触发编辑操作 | 用户发起编辑请求 | • 在今日/历史/日历视图中<br>• 点击对应记录的"编辑"按钮 |
| 2 | 数据回填 | 将原数据填入表单 | • 判断是否为预设运动，设置下拉选项<br>• 自定义运动则回填名称输入框<br>• 回填记录类型 (duration/count)<br>• 回填时长/数量数值<br>• 回填自定义单位 |
| 3 | 显示编辑弹窗 | 进入编辑模式 | • 设置showEditModal = true<br>• 弹出模态框展示编辑表单 |
| | | | |
| **阶段二: 保存编辑** | | | |
| 4 | 用户修改数据 | 更新表单内容 | 同添加记录流程，支持修改：<br>• 运动项目/名称<br>• 记录类型<br>• 运动数值<br>• 计量单位 |
| 5 | 编辑表单验证 | 数据合法性检查 | 通过canEditSubmit验证：<br>• 运动名称不能为空<br>• 对应类型数值必须 > 0 |
| 6 | 查找记录位置 | 定位待更新记录 | • 根据editingRecord.id查找<br>• records.value.findIndex()定位数组索引 |
| 7 | 更新数组数据 | 内存数据更新 | • 保留id/date/createdAt不变<br>• 更新name/type/duration/count/unit |
| 8 | 持久化存储 | 同步到本地存储 | 调用saveToStorage()写入localStorage |
| 9 | 关闭弹窗清理 | 退出编辑模式 | • 关闭模态框<br>• 清空所有编辑表单临时变量 |

**关键函数**:
- `openEditModal()` - App.vue:334-354
- `saveEdit()` - App.vue:367-384
- `closeEditModal()` - App.vue:356-365

---

#### 2.1.3 子流程P1-3: 删除运动记录流程

**流程作用**: 移除不需要的运动记录

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| 1 | 触发删除操作 | 用户发起删除请求 | • 点击对应记录的"删除"按钮<br>• 支持在所有视图中执行 |
| 2 | 过滤内存数组 | 移除指定记录 | • records.value.filter(r => r.id !== id)<br>• 通过ID匹配过滤排除目标记录<br>• 直接重新赋值给响应式数组 |
| 3 | 持久化存储 | 同步变更 | • 调用saveToStorage()<br>• 将过滤后的数组写入localStorage |

**关键函数**: `deleteRecord()` - App.vue:329-332

---

### 2.2 流程P2: 数据持久化流程

#### 2.2.1 子流程P2-1: 应用启动加载流程

**流程作用**: 应用初始化时从本地读取历史数据

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| 1 | 组件挂载完成 | Vue生命周期钩子 | • onMounted生命周期触发<br>• 确保DOM已完成渲染 |
| 2 | 调用加载函数 | 开始数据读取 | 执行loadFromStorage()函数 |
| 3 | 读取本地存储 | 获取持久化数据 | • localStorage.getItem(STORAGE_KEY)<br>• STORAGE_KEY = 'exercise-records' |
| 4 | 数据解析处理 | JSON转对象 | • 检查数据是否存在<br>• JSON.parse() 解析字符串<br>• try-catch捕获解析异常<br>• 解析失败时初始化为空数组 |
| 5 | 初始化响应式数据 | 赋值给状态 | • records.value = 解析后的数据<br>• 所有视图自动更新 |

**关键函数**: `loadFromStorage()` - App.vue:397-406

---

#### 2.2.2 子流程P2-2: 数据变更保存流程

**流程作用**: 数据变更后同步到本地存储（自动触发）

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| 0 | 触发时机 | 保存动作自动触发点 | • 添加记录成功后<br>• 编辑记录保存后<br>• 删除记录确认后 |
| 1 | 数据序列化 | 对象转字符串 | • JSON.stringify(records.value)<br>• 将响应式数组转为JSON字符串 |
| 2 | 写入本地存储 | 持久化操作 | • localStorage.setItem()<br>• KEY: 'exercise-records'<br>• 覆盖原有数据 |

**关键函数**: `saveToStorage()` - App.vue:393-395

---

### 2.3 流程P3: 视图展示切换流程

**流程作用**: 在四大视图间切换，展示不同维度的数据

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| 1 | 用户点击Tab | 切换视图的触发 | • 点击顶部四个Tab按钮之一<br>• 今日打卡 / 历史记录 / 日历视图 / 统计 |
| 2 | 修改视图状态 | 设置当前视图标记 | • currentView.value = 'today' / 'history' / 'calendar' / 'stats'<br>• 响应式变量变更触发重新渲染 |
| 3 | 计算属性自动更新 | 数据预计算 | **根据视图自动触发对应computed：**<br><br>• today视图 → todayRecords + todayStats<br>&nbsp;&nbsp;过滤今日记录 + 今日数据汇总<br><br>• history视图 → 全量records数组<br>&nbsp;&nbsp;按时间倒序展示所有记录<br><br>• calendar视图 → calendarDays + selectedDateRecords<br>&nbsp;&nbsp;生成日历网格 + 选中日期记录<br><br>• stats视图 → weekStats + monthStats<br>&nbsp;&nbsp;本周数据 + 本月数据统计 |
| 4 | 模板条件渲染 | 渲染对应视图组件 | • v-if="currentView === 'xxx'"<br>• 只渲染当前激活的视图模板 |

---

### 2.4 流程P4: 数据统计聚合流程

#### 2.4.1 子流程P4-1: 今日实时统计

**计算属性**: `todayStats` - App.vue:117-140

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| 1 | 数据筛选 | 限定今日范围 | • getToday()获取当日日期<br>• 过滤records数组只保留当日数据 |
| 2 | 维度聚合 | 多维度数据累加 | **并行统计：**<br>• 总时长累加 (只统计duration类型)<br>• 总次数累加 (只统计count类型)<br>• 运动类型去重计数 (Set集合)<br>• 记录总数统计 |
| 3 | 返回统计结果 | 输出统计对象 | 返回对象包含：<br>• totalDuration: 总运动分钟<br>• totalCount: 总运动次数<br>• typeCount: 运动类型数<br>• recordCount: 打卡次数 |

---

#### 2.4.2 子流程P4-2: 本周数据统计

**计算属性**: `weekStats` - App.vue:148-176

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| 1 | 日期范围计算 | 确定本周起止 | • 计算本周一00:00:00 作为起始<br>• 计算本周日23:59:59 作为结束<br>• 注意周日处理：getDay()=0时偏移-6天 |
| 2 | 数据筛选 | 过滤本周数据 | • 每条记录日期转Date对象<br>• 比较是否在周一至周日区间内 |
| 3 | 数据聚合 | 统计汇总 | • 统计本周内记录总数<br>• 累加所有时长类型运动的总时长 |

---

#### 2.4.3 子流程P4-3: 本月数据统计

**计算属性**: `monthStats` - App.vue:178-199

| 大步骤 | 步骤名称 | 步骤作用 | 具体执行细节 |
|-------|---------|---------|------------|
| 1 | 日期范围计算 | 确定当月范围 | • 当月第一天 new Date(year, month, 1)<br>• 当月最后一天 new Date(year, month+1, 0) |
| 2 | 数据筛选 | 过滤本月数据 | 记录日期在当月第一天至最后一天之间 |
| 3 | 数据聚合 | 统计汇总 | • 统计本月内记录总数<br>• 累加所有时长类型运动的总时长 |

---

## 三、核心数据结构与接口说明

### 3.1 类型定义 (types/index.ts)

#### 3.1.1 RecordType 记录类型

```typescript
type RecordType = 'duration' | 'count'
```

| 值 | 说明 |
|----|------|
| duration | 按时长记录 |
| count | 按次数/组数记录 |

---

#### 3.1.2 ExerciseRecord 运动记录接口

```typescript
interface ExerciseRecord {
  id: string           // 唯一标识
  name: string         // 运动名称
  type: RecordType     // 记录类型
  duration?: number   // 时长 (type=duration时有值)
  count?: number      // 数量 (type=count时有值)
  unit?: string       // 单位
  date: string       // 日期 YYYY-MM-DD
  createdAt: number  // 创建时间戳
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| id | string | 是 | 生成算法: Date.now().toString(36) + 随机字符串 |
| name | string | 是 | 运动项目名称 |
| type | RecordType | 是 | duration / count |
| duration | number | 否 | 运动时长分钟 |
| count | number | 否 | 运动次数/组数 |
| unit | string | 否 | 计量单位 |
| date | string | 是 | 记录日期 |
| createdAt | number | 是 | 记录创建时间戳 |

---

#### 3.1.3 ExerciseOption 预设运动选项

```typescript
interface ExerciseOption {
  name: string      // 运动名称
  type: RecordType   // 默认记录类型
  unit: string      // 默认单位
}
```

**预设运动列表 (PRESET_EXERCISES):

| 运动名称 | 记录类型 | 默认单位 |
|---------|---------|---------|
| 跑步 | duration | 分钟 |
| 瑜伽 | duration | 分钟 |
| 游泳 | duration | 分钟 |
| 骑行 | duration | 分钟 |
| 健走 | duration | 分钟 |
| 深蹲 | count | 组 |
| 俯卧撑 | count | 次 |
| 跳绳 | count | 次 |
| 仰卧起坐 | count | 次 |
| 引体向上 | count | 次 |
| 平板支撑 | duration | 秒 |
| 哑铃训练 | count | 组 |

---

## 四、核心函数入参出参详解

### 4.1 记录操作函数

#### 4.1.1 submitRecord() - 提交新记录

```typescript
function submitRecord(): void
```

| 项 | 说明 |
|----|------|
| 入参 | 无 (使用响应式表单变量) |
| 出参 | void |
| 副作用 | records数组新增记录，localStorage更新，表单重置 |
| 前置条件 | canSubmit.value === true |

**使用的响应式变量**:
- selectedExercise / customExerciseName
- recordType
- duration / count
- customUnit

---

#### 4.1.2 deleteRecord() - 删除记录

```typescript
function deleteRecord(id: string): void
```

| 项 | 说明 |
|----|------|
| 入参名 | 类型 | 说明 |
| id | string | 要删除的记录ID |
| 出参 | void |
| 副作用 | records数组过滤，localStorage更新 |

---

#### 4.1.3 openEditModal() - 打开编辑弹窗

```typescript
function openEditModal(record: ExerciseRecord): void
```

| 项 | 说明 |
|----|------|
| 入参名 | 类型 | 说明 |
| record | ExerciseRecord | 要编辑的记录对象 |
| 出参 | void |
| 副作用 | 设置editingRecord赋值，编辑表单变量回填，showEditModal = true |

---

#### 4.1.4 saveEdit() - 保存编辑

```typescript
function saveEdit(): void
```

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 出参 | void |
| 副作用 | records数组对应索引更新，localStorage更新，模态框关闭 |
| 前置条件 | editingRecord.value !== null && canEditSubmit.value === true |

---

### 4.2 存储操作函数

#### 4.2.1 saveToStorage() - 保存到本地存储

```typescript
function saveToStorage(): void
```

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 出参 | void |
| 存储KEY | 'exercise-records' |
| 存储内容 | JSON.stringify(records.value) |

---

#### 4.2.2 loadFromStorage() - 从本地存储加载

```typescript
function loadFromStorage(): void
```

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 出参 | void |
| 异常处理 | JSON解析失败时置为空数组 |

---

### 4.3 工具函数

#### 4.3.1 generateId() - 生成唯一ID

```typescript
function generateId(): string
```

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 返回值 | string |
| 算法 | Date.now().toString(36) + Math.random().toString(36).substr(2) |

---

#### 4.3.2 getToday() - 获取今日日期

```typescript
function getToday(): string
```

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 返回值 | string - 格式: YYYY-MM-DD |

---

#### 4.3.3 formatDate() - 格式化日期

```typescript
function formatDate(dateStr: string): string
```

| 项 | 说明 |
|----|------|
| 入参名 | 类型 | 说明 |
| dateStr | string | ISO日期字符串 |
| 返回值 | string - 格式: YYYY-MM-DD |

---

#### 4.3.4 formatDateTime() - 格式化时间

```typescript
function formatDateTime(timestamp: number): string
```

| 项 | 说明 |
|----|------|
| 入参名 | 类型 | 说明 |
| timestamp | number | 时间戳 |
| 返回值 | string - 格式: HH:MM |

---

#### 4.3.5 getRecordDetail() - 获取记录详情文本

```typescript
function getRecordDetail(record: ExerciseRecord): string
```

| 项 | 说明 |
|----|------|
| 入参名 | 类型 | 说明 |
| record | ExerciseRecord | 运动记录 |
| 返回值 | string - "时长: X 分钟" 或 "数量: X 次" |

---

### 4.4 日历操作函数

#### 4.4.1 prevMonth() / nextMonth() - 月份切换

```typescript
function prevMonth(): void
function nextMonth(): void
```

| 项 | 说明 |
|----|------|
| 入参 | 无 |
| 副作用 | calendarYear / calendarMonth 值变化 |

---

#### 4.4.2 selectCalendarDate() - 选择日历日期

```typescript
function selectCalendarDate(date: string): void
```

| 项 | 说明 |
|----|------|
| 入参名 | 类型 | 说明 |
| date | string | 选中的日期 |
| 副作用 | selectedCalendarDate.value = date |

---

#### 4.4.3 hasRecordOnDate() - 判断某天是否有记录

```typescript
function hasRecordOnDate(date: string): boolean
```

| 项 | 说明 |
|----|------|
| 入参名 | 类型 | 说明 |
| date | string | 日期 |
| 返回值 | boolean - 该日期是否存在记录 |

---

## 五、项目架构总结

### 5.1 数据流

```
用户交互
    ↓
响应式状态变更 (ref/computed)
    ↓
业务逻辑处理 (functions)
    ↓
localStorage 持久化
    ↓
视图自动更新
```

### 5.2 技术特点

1. **纯前端应用**: 无后端API，所有数据存储在localStorage
2. **单文件组件**: App.vue包含所有业务逻辑
3. **Composition API**: Vue 3 setup语法糖
4. **TypeScript**: 完整类型定义
5. **响应式设计**: computed属性驱动视图
