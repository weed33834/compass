import type { Locale } from "./index";

// 字典结构：namespace.key -> { locale -> text }
// 仅翻译核心 client 页面 + AppShell；server 页面（dashboard/compass/voyage/logbook）
// 暂保留中文，未来逐步翻译时直接补 key 即可
export const dictionaries = {
  common: {
    appName: { "zh-CN": "Compass", en: "Compass" },
    tagline: {
      "zh-CN": "锚定目标，规划航程，校准方向",
      en: "Anchor goals, plan voyages, calibrate direction",
    },
    loading: { "zh-CN": "加载中…", en: "Loading..." },
    save: { "zh-CN": "保存", en: "Save" },
    cancel: { "zh-CN": "取消", en: "Cancel" },
    confirm: { "zh-CN": "确认", en: "Confirm" },
    delete: { "zh-CN": "删除", en: "Delete" },
    edit: { "zh-CN": "编辑", en: "Edit" },
    back: { "zh-CN": "返回", en: "Back" },
  },
  nav: {
    compass: { "zh-CN": "罗盘", en: "Compass" },
    study: { "zh-CN": "答题舱", en: "Study" },
    workshop: { "zh-CN": "造船工坊", en: "Workshop" },
    wrongbook: { "zh-CN": "错题漂流瓶", en: "Wrongbook" },
    logbook: { "zh-CN": "航海日志", en: "Logbook" },
    analytics: { "zh-CN": "航迹分析", en: "Analytics" },
    account: { "zh-CN": "个人中心", en: "Account" },
    signOut: { "zh-CN": "退出登录", en: "Sign out" },
  },
  auth: {
    loginTitle: { "zh-CN": "欢迎回来", en: "Welcome back" },
    loginSubtitle: { "zh-CN": "继续你的航程", en: "Continue your voyage" },
    email: { "zh-CN": "邮箱", en: "Email" },
    password: { "zh-CN": "密码", en: "Password" },
    signIn: { "zh-CN": "登录", en: "Sign in" },
    signingIn: { "zh-CN": "登录中…", en: "Signing in..." },
    registerTitle: { "zh-CN": "开始你的航程", en: "Start your voyage" },
    registerSubtitle: {
      "zh-CN": "建立账户，锚定你的真北",
      en: "Create an account, anchor your true north",
    },
    name: { "zh-CN": "姓名", en: "Name" },
    signUp: { "zh-CN": "注册", en: "Sign up" },
    signingUp: { "zh-CN": "注册中…", en: "Signing up..." },
    forgotPassword: { "zh-CN": "忘记密码？", en: "Forgot password?" },
    noAccount: { "zh-CN": "还没有账户？", en: "Don't have an account?" },
    haveAccount: { "zh-CN": "已有账户？", en: "Already have an account?" },
    oauthDivider: {
      "zh-CN": "或使用第三方账号",
      en: "or use a third-party account",
    },
    github: { "zh-CN": "使用 GitHub 登录", en: "Continue with GitHub" },
    google: { "zh-CN": "使用 Google 登录", en: "Continue with Google" },
    githubRegister: {
      "zh-CN": "使用 GitHub 注册",
      en: "Sign up with GitHub",
    },
    googleRegister: {
      "zh-CN": "使用 Google 注册",
      en: "Sign up with Google",
    },
    invalidCredentials: {
      "zh-CN": "邮箱或密码错误，请重试",
      en: "Invalid email or password",
    },
    loginFailed: {
      "zh-CN": "登录失败，请稍后重试",
      en: "Login failed, please try again later",
    },
    registerFailed: {
      "zh-CN": "注册失败，请重试",
      en: "Registration failed, please try again",
    },
    networkError: { "zh-CN": "网络异常，请重试", en: "Network error, please retry" },
    // 忘记密码页文案（此前硬编码中文，现补齐 i18n）
    resetTitle: { "zh-CN": "重置密码", en: "Reset password" },
    resetSubtitle: {
      "zh-CN": "输入注册邮箱，我们将发送重置链接",
      en: "Enter your registered email and we'll send a reset link",
    },
    sendResetEmail: { "zh-CN": "发送重置邮件", en: "Send reset email" },
    sending: { "zh-CN": "发送中…", en: "Sending..." },
    resetSentTitle: { "zh-CN": "重置邮件已发送", en: "Reset email sent" },
    resetSentBody: {
      "zh-CN": "如果该邮箱已注册，你将收到重置邮件。",
      en: "If that email is registered, you'll receive a reset email.",
    },
    backToLogin: { "zh-CN": "返回登录", en: "Back to login" },
    remembered: { "zh-CN": "想起来了？", en: "Remembered?" },
    requestFailed: { "zh-CN": "请求失败，请重试", en: "Request failed, please retry" },
  },
  landing: {
    heroTitle: {
      "zh-CN": "在知识的海洋里，罗盘为你导航每一题",
      en: "In the sea of knowledge, Compass navigates every question",
    },
    heroTagline: {
      "zh-CN": "导入题库 · 间隔重复 · 错题漂流",
      en: "Import banks · Spaced repetition · Wrong-answer drift",
    },
    heroCta: { "zh-CN": "开始刷题", en: "Start studying" },
    heroLogin: { "zh-CN": "登录", en: "Sign in" },
    featuresTitle: {
      "zh-CN": "刷题的三件仪器",
      en: "Three instruments for mastery",
    },
    featuresSubtitle: {
      "zh-CN": "从导入到掌握，一路相伴",
      en: "From import to mastery, always with you",
    },
    featureAnchorTitle: { "zh-CN": "导入", en: "Import" },
    featureAnchorDesc: {
      "zh-CN": "Word / Excel / Markdown 一键导入，自动解析为题目",
      en: "Import Word / Excel / Markdown, auto-parsed into questions",
    },
    featurePlanTitle: { "zh-CN": "刷题", en: "Study" },
    featurePlanDesc: {
      "zh-CN": "FSRS-6 间隔重复算法，科学安排复习节奏",
      en: "FSRS-6 spaced repetition algorithm, scientific review scheduling",
    },
    featureCalibrateTitle: { "zh-CN": "校准", en: "Calibrate" },
    featureCalibrateDesc: {
      "zh-CN": "错题漂流瓶 + 航迹分析，持续校准薄弱点",
      en: "Wrong-book drift + trajectory analytics, calibrate weak points",
    },
    ctaTitle: { "zh-CN": "启航，从今天", en: "Set sail, starting today" },
    ctaDesc: {
      "zh-CN": "导入你的第一份题库，找到属于你的知识真北。",
      en: "Import your first question bank, find your true north of knowledge.",
    },
    copyright: { "zh-CN": "© 2026 Compass", en: "© 2026 Compass" },
  },
  dashboard: {
    title: { "zh-CN": "仪表盘", en: "Dashboard" },
    subtitle: {
      "zh-CN": "一屏掌握你的航行全局",
      en: "A snapshot of your voyage at a glance",
    },
    todayFocus: { "zh-CN": "今日聚焦", en: "Today's focus" },
    progressOverview: { "zh-CN": "进度总览", en: "Progress overview" },
    recentLogs: { "zh-CN": "最近日志", en: "Recent logs" },
    noGoals: {
      "zh-CN": "还没有目标，从罗盘开始锚定",
      en: "No goals yet, start anchoring from the compass",
    },
  },
  profile: {
    title: { "zh-CN": "个人中心", en: "Profile" },
    subtitle: {
      "zh-CN": "管理账户、安全与偏好",
      en: "Manage account, security and preferences",
    },
    account: { "zh-CN": "账户", en: "Account" },
    security: { "zh-CN": "安全", en: "Security" },
    preferences: { "zh-CN": "偏好", en: "Preferences" },
    theme: { "zh-CN": "主题", en: "Theme" },
    language: { "zh-CN": "语言", en: "Language" },
    notifications: { "zh-CN": "通知", en: "Notifications" },
    dataExport: { "zh-CN": "数据导出", en: "Data export" },
    dataImport: { "zh-CN": "数据导入", en: "Data import" },
  },
  // Phase 11：灯塔信号（通知中心）
  notifications: {
    title: { "zh-CN": "灯塔信号", en: "Lighthouse" },
    empty: { "zh-CN": "海域平静，暂无信号", en: "Calm waters, no signals" },
    markAllRead: { "zh-CN": "全部标记已读", en: "Mark all read" },
    unread: { "zh-CN": "未读", en: "Unread" },
    typeDeadline: { "zh-CN": "航期提醒", en: "Deadline" },
    typeAchievement: { "zh-CN": "航程达成", en: "Achievement" },
    typeSystem: { "zh-CN": "系统", en: "System" },
  },
  // Phase 11：舵手指令台（命令面板）
  commandPalette: {
    title: { "zh-CN": "舵手指令台", en: "Helm Command" },
    placeholder: { "zh-CN": "输入指令或搜索…", en: "Type a command or search..." },
    groupNavigate: { "zh-CN": "导航", en: "Navigate" },
    groupActions: { "zh-CN": "操作", en: "Actions" },
    groupSearch: { "zh-CN": "搜索结果", en: "Search results" },
    noResults: { "zh-CN": "未找到匹配", en: "No matches found" },
    hintClose: { "zh-CN": "Esc 关闭", en: "Esc to close" },
  },
  // Phase 11：舵轮快捷键
  shortcuts: {
    title: { "zh-CN": "舵轮快捷键", en: "Helm Shortcuts" },
    openCommand: { "zh-CN": "打开指令台", en: "Open command" },
    openNotifications: { "zh-CN": "查看灯塔信号", en: "Open notifications" },
    openSearch: { "zh-CN": "望远镜搜索", en: "Search" },
    openReview: { "zh-CN": "本周复盘", en: "Weekly review" },
    goDashboard: { "zh-CN": "前往仪表盘", en: "Go to dashboard" },
    goGoals: { "zh-CN": "前往罗盘", en: "Go to goals" },
    goLogbook: { "zh-CN": "前往日志", en: "Go to logbook" },
    showShortcuts: { "zh-CN": "显示快捷键", en: "Show shortcuts" },
  },
  // Phase 11：七日航程复盘
  review: {
    title: { "zh-CN": "七日航程复盘", en: "Weekly Review" },
    subtitle: {
      "zh-CN": "回望本周航迹，校准下周方向",
      en: "Reflect on this week's wake, calibrate next week's heading",
    },
    highlights: { "zh-CN": "本周高光", en: "Highlights" },
    reflections: { "zh-CN": "航海反思", en: "Reflections" },
    reflectionsPlaceholder: {
      "zh-CN": "本周哪些航向稳定，哪些偏航了？",
      en: "What held course this week? What drifted?",
    },
    nextWeekPlan: { "zh-CN": "下周航向", en: "Next week's heading" },
    nextWeekPlanPlaceholder: {
      "zh-CN": "下周要校准哪些方向？",
      en: "What to calibrate next week?",
    },
    summary: { "zh-CN": "航行概要", en: "Voyage summary" },
    goalsCompleted: { "zh-CN": "抵达终点", en: "Reached destination" },
    goalsCreated: { "zh-CN": "新启航程", en: "New voyages" },
    tasksCompleted: { "zh-CN": "完成任务", en: "Tasks done" },
    logsCount: { "zh-CN": "航海日志", en: "Log entries" },
    avgMood: { "zh-CN": "平均心情", en: "Avg mood" },
    avgEnergy: { "zh-CN": "平均能量", en: "Avg energy" },
    history: { "zh-CN": "历史复盘", en: "History" },
    saved: { "zh-CN": "已保存", en: "Saved" },
    saveFailed: { "zh-CN": "保存失败", en: "Save failed" },
    currentWeek: { "zh-CN": "本周", en: "This week" },
    monthlyOverview: { "zh-CN": "本月概览", en: "Monthly overview" },
    monthlyOverviewSubtitle: {
      "zh-CN": "更长周期的航迹回望",
      en: "A wider-angle view of the wake",
    },
    prevMonth: { "zh-CN": "上一月", en: "Previous month" },
    nextMonth: { "zh-CN": "下一月", en: "Next month" },
    currentMonth: { "zh-CN": "本月", en: "This month" },
    focusSessions: { "zh-CN": "专注会话", en: "Focus sessions" },
    focusMinutes: { "zh-CN": "专注分钟", en: "Focus minutes" },
    habitCheckDays: { "zh-CN": "打卡天数", en: "Check-in days" },
    topTags: { "zh-CN": "高频标签", en: "Top tags" },
    noTags: { "zh-CN": "本月日志暂无标签", en: "No tags in logs this month" },
  },
  // Phase 11：望远镜搜索
  search: {
    title: { "zh-CN": "望远镜", en: "Spyglass" },
    placeholder: { "zh-CN": "搜索目标、任务、日志…", en: "Search goals, tasks, logs..." },
    kindGoal: { "zh-CN": "目标", en: "Goal" },
    kindTask: { "zh-CN": "任务", en: "Task" },
    kindLog: { "zh-CN": "日志", en: "Log" },
    noResults: { "zh-CN": "海域空旷，未找到匹配", en: "Empty waters, no matches" },
    resultsCount: { "zh-CN": "条结果", en: "results" },
  },
  // Phase 12：舵手专注舱
  focus: {
    title: { "zh-CN": "舵手专注舱", en: "Focus Cabin" },
    subtitle: { "zh-CN": "启航专注，记录每段航行", en: "Set sail and log every voyage" },
    startFocus: { "zh-CN": "启航专注", en: "Start focus" },
    shortBreak: { "zh-CN": "抛锚小憩", en: "Short break" },
    longBreak: { "zh-CN": "深海休整", en: "Long break" },
    custom: { "zh-CN": "自定义", en: "Custom" },
    endEarly: { "zh-CN": "提前靠岸", en: "End early" },
    abandon: { "zh-CN": "放弃航行", en: "Abandon" },
    todaySessions: { "zh-CN": "今日航程", en: "Today's sessions" },
    noSessions: { "zh-CN": "今日尚未启航", en: "No sessions today" },
    statsToday: { "zh-CN": "今日专注", en: "Today" },
    statsWeek: { "zh-CN": "本周专注", en: "This week" },
    statsTotal: { "zh-CN": "累计专注", en: "Total" },
    statsCount: { "zh-CN": "完成会话", en: "Sessions" },
    minutes: { "zh-CN": "分钟", en: "min" },
    completed: { "zh-CN": "已完成", en: "Completed" },
    abandoned: { "zh-CN": "已中断", en: "Abandoned" },
    inProgress: { "zh-CN": "进行中", en: "In progress" },
    autoCompleted: { "zh-CN": "专注时长已到，自动靠岸", en: "Focus complete, auto-docked" },
    startedFailed: { "zh-CN": "启航失败", en: "Failed to start" },
    endedFailed: { "zh-CN": "结束失败", en: "Failed to end" },
  },
  // Phase 12：每日锚点
  anchors: {
    title: { "zh-CN": "每日锚点", en: "Daily Anchors" },
    subtitle: { "zh-CN": "抛下锚点，固定每日航向", en: "Drop anchors, fix your daily heading" },
    createNew: { "zh-CN": "抛下新锚", en: "Drop new anchor" },
    empty: { "zh-CN": "尚未抛下锚点", en: "No anchors yet" },
    anchorMorning: { "zh-CN": "晨锚", en: "Morning" },
    anchorAfternoon: { "zh-CN": "午锚", en: "Afternoon" },
    anchorEvening: { "zh-CN": "暮锚", en: "Evening" },
    anchorAnytime: { "zh-CN": "随时", en: "Anytime" },
    cadenceDaily: { "zh-CN": "每日", en: "Daily" },
    cadenceWeekly: { "zh-CN": "每周", en: "Weekly" },
    check: { "zh-CN": "锚定", en: "Anchor" },
    checked: { "zh-CN": "已锚定", en: "Anchored" },
    uncheck: { "zh-CN": "取消", en: "Unanchor" },
    streak: { "zh-CN": "连续", en: "Streak" },
    days: { "zh-CN": "天", en: "days" },
    weeks: { "zh-CN": "周", en: "weeks" },
    statsActive: { "zh-CN": "活跃锚点", en: "Active anchors" },
    statsToday: { "zh-CN": "今日已锚", en: "Anchored today" },
    statsTotal: { "zh-CN": "累计锚定", en: "Total anchors" },
    statsLongest: { "zh-CN": "最长连续", en: "Longest streak" },
    statsWeek: { "zh-CN": "本周锚定", en: "This week" },
    titleField: { "zh-CN": "锚点名称", en: "Anchor name" },
    descriptionField: { "zh-CN": "锚点描述", en: "Description" },
    cadenceField: { "zh-CN": "频率", en: "Cadence" },
    anchorTimeField: { "zh-CN": "时段", en: "Time slot" },
    colorField: { "zh-CN": "颜色", en: "Color" },
    createFailed: { "zh-CN": "抛锚失败", en: "Failed to create" },
    updateFailed: { "zh-CN": "更新失败", en: "Failed to update" },
    deleteFailed: { "zh-CN": "删除失败", en: "Failed to delete" },
    checkFailed: { "zh-CN": "锚定失败", en: "Failed to anchor" },
    alreadyChecked: { "zh-CN": "今日已锚定", en: "Already anchored today" },
    chart365: { "zh-CN": "365 天热力图", en: "365-day chart" },
    chartChecked: { "zh-CN": "已锚定", en: "checked" },
    chartNoCheckin: { "zh-CN": "未锚定", en: "no check-in" },
    chartDaysChecked: { "zh-CN": "天已锚定", en: "days checked" },
  },
  // 日历视图：月份导航 + 事件类型 + 图例
  calendar: {
    today: { "zh-CN": "今日", en: "Today" },
    prevMonth: { "zh-CN": "上一月", en: "Previous month" },
    nextMonth: { "zh-CN": "下一月", en: "Next month" },
    deadline: { "zh-CN": "截止", en: "Deadline" },
    milestone: { "zh-CN": "里程碑", en: "Milestone" },
    task: { "zh-CN": "任务", en: "Task" },
    log: { "zh-CN": "日志", en: "Log" },
    logActivity: { "zh-CN": "日志活动", en: "Log activity" },
    eventsCount: { "zh-CN": "条事件", en: "events" },
    monthJan: { "zh-CN": "一月", en: "January" },
    monthFeb: { "zh-CN": "二月", en: "February" },
    monthMar: { "zh-CN": "三月", en: "March" },
    monthApr: { "zh-CN": "四月", en: "April" },
    monthMay: { "zh-CN": "五月", en: "May" },
    monthJun: { "zh-CN": "六月", en: "June" },
    monthJul: { "zh-CN": "七月", en: "July" },
    monthAug: { "zh-CN": "八月", en: "August" },
    monthSep: { "zh-CN": "九月", en: "September" },
    monthOct: { "zh-CN": "十月", en: "October" },
    monthNov: { "zh-CN": "十一月", en: "November" },
    monthDec: { "zh-CN": "十二月", en: "December" },
    weekdayMon: { "zh-CN": "一", en: "Mon" },
    weekdayTue: { "zh-CN": "二", en: "Tue" },
    weekdayWed: { "zh-CN": "三", en: "Wed" },
    weekdayThu: { "zh-CN": "四", en: "Thu" },
    weekdayFri: { "zh-CN": "五", en: "Fri" },
    weekdaySat: { "zh-CN": "六", en: "Sat" },
    weekdaySun: { "zh-CN": "日", en: "Sun" },
  },
} as const;

export type DictionaryKey = keyof typeof dictionaries;

// 服务端纯函数翻译：server component 不能用 useTranslation hook，
// 可直接调用此函数（需自行从 user.locale / cookie 读取 locale）
// 找不到 namespace/key 时回退到 zh-CN，再回退到 key 本身
export function translate(
  locale: Locale,
  namespace: string,
  key: string
): string {
  const ns = (dictionaries as Record<string, Record<string, Record<Locale, string>>>)[
    namespace
  ];
  if (!ns) return key;
  const entry = ns[key];
  if (!entry) return key;
  return entry[locale] ?? entry["zh-CN"] ?? key;
}
