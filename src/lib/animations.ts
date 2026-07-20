/**
 * Compass 主题动画库
 *
 * 替代旧的 framer-motion 模板动画（easeInOut / spring / staggerChildren / rotate+scale+opacity）
 * 每个模块动画呼应其理论主题：八卦旋转、罗盘定位、五行连动、潮汐起伏、时辰轮转、月相盈亏
 */

import type { Variants, Transition } from "framer-motion";

/* ================================================================
 * 全局主题过渡
 * ================================================================ */

/** 罗盘指针划过效果 — 路由切换 */
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    rotate: -3,
    scale: 0.97,
    filter: "blur(2px)",
  },
  enter: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.22, 0.61, 0.36, 1], // 自定义 ease：快速的开始，平滑的结束
    },
  },
  exit: {
    opacity: 0,
    rotate: 3,
    scale: 0.97,
    filter: "blur(2px)",
    transition: {
      duration: 0.3,
      ease: [0.55, 0, 1, 0.45],
    },
  },
};

/** 航海图卷轴展开/收起 */
export const scrollTransition: Variants = {
  initial: {
    opacity: 0,
    scaleY: 0.8,
    originY: 0,
  },
  enter: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.8,
    originY: 0.5,
    transition: {
      duration: 0.3,
      ease: [0.55, 0, 1, 0.45],
    },
  },
};

/* ================================================================
 * 仪表盘 — 八卦旋转入场 + 阴阳渐变过渡
 * ================================================================ */

/** 八卦旋转入场 */
export const baguaEnter: Variants = {
  initial: {
    opacity: 0,
    rotate: 45,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1.2,
    },
  },
};

/** 阴阳渐变过渡（用于卡片间切换） */
export const yinYangFade: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const yinYangTransition: Transition = {
  duration: 0.3,
  ease: "easeInOut",
};

/** StatsCard 卦象指示器 */
export const trigramPulse: Variants = {
  idle: { scale: 1, opacity: 0.7 },
  active: {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "easeInOut",
    },
  },
};

/* ================================================================
 * 目标罗盘 — 罗盘指针旋转 + 象限涟漪扩散
 * ================================================================ */

/** 罗盘容器慢速旋转（无干扰的装饰动画） */
export const compassRotate: Variants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 120,
      ease: "linear",
    },
  },
};

/** 罗盘指针定位动画 */
export const compassNeedle: Variants = {
  initial: { rotate: -30, opacity: 0 },
  animate: {
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
    },
  },
};

/** 象限涟漪扩散 */
export const quadrantRipple: Variants = {
  initial: {
    scale: 0.8,
    opacity: 0,
    boxShadow: "0 0 0 0 rgba(200, 155, 60, 0.4)", // brass color glow
  },
  animate: {
    scale: 1,
    opacity: 1,
    boxShadow: [
      "0 0 0 0 rgba(200, 155, 60, 0.4)",
      "0 0 0 8px rgba(200, 155, 60, 0)",
    ],
    transition: {
      duration: 0.6,
      ease: "easeOut",
      boxShadow: {
        duration: 1.2,
        repeat: Infinity,
      },
    },
  },
};

/** 目标卡片交错出现 */
export const goalStagger: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.35,
      ease: [0.22, 0.61, 0.36, 1],
    },
  }),
};

/* ================================================================
 * 数据分析 — 五行相生相克连动 + 数据流如经络
 * ================================================================ */

/** 五行相生连接动画（连线绘制） */
export const wuxingSheng: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 0.8,
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

/** 数据流如经络 — 列表项渐入 */
export const meridianStream: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

/** 数据卡片呼吸感 */
export const dataCardBreath: Variants = {
  idle: { opacity: 0.85 },
  hover: {
    opacity: 1,
    scale: 1.01,
    transition: { duration: 0.2 },
  },
};

/* ================================================================
 * 航海日志 — 波浪起伏 + 潮汐涨落
 * ================================================================ */

/** 波浪起伏动画 */
export const waveMotion: Variants = {
  animate: {
    y: [0, -6, 0],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "easeInOut",
    },
  },
};

/** 潮汐涨落（用于日志条目渐入） */
export const tidalFade: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: Math.sin(i * 0.3) * 0.2 + 0.1, // 波浪式延迟
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/* ================================================================
 * 执行工坊 — 子午流注时辰轮转 + 水滴计时
 * ================================================================ */

/** 时辰轮转 */
export const hourWheel: Variants = {
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 60,
      ease: "linear",
    },
  },
};

/** 水滴计时下降 */
export const waterDrop: Variants = {
  initial: { y: -20, opacity: 0, scale: 0.5 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 12,
    },
  },
  exit: {
    y: 20,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

/** 专注舱卡片入场 */
export const focusCabinEnter: Variants = {
  initial: { opacity: 0, rotateY: 10, scale: 0.92 },
  animate: {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 0.61, 0.36, 1],
    },
  },
};

/* ================================================================
 * 日历 — 月相盈亏渐变
 * ================================================================ */

/** 月相盈亏动画 */
export const moonPhase: Variants = {
  newMoon: {
    clipPath: "circle(20% at 50% 50%)",
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  fullMoon: {
    clipPath: "circle(50% at 50% 50%)",
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

/** 日历格子浮现 */
export const calendarCellEnter: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

/** 节气标记闪烁 */
export const termGlow: Variants = {
  idle: { opacity: 0.6, scale: 1 },
  active: {
    opacity: [0.6, 1, 0.6],
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut",
    },
  },
};

/* ================================================================
 * 通用微交互
 * ================================================================ */

/** 抬手悬停 */
export const subtleHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 },
};

/** 列表项渐入（通用） */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

/* ================================================================
 * Phase 1 补全 — 漂流瓶、日历拖拽、潮汐任务动画
 * ================================================================ */

/** 漂流瓶从上方透明度 0 滑入 */
export const driftBottleEnter: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 22,
    },
  },
};

/** 漂流瓶 y 轴 3px 正弦浮动 */
export const bottleFloat: Variants = {
  animate: {
    y: [0, -3, 0],
    transition: {
      repeat: Infinity,
      duration: 4,
      ease: "easeInOut",
    },
  },
};

/** 日历拖拽落入格子：从中心放大 + 透明度变化的水波纹 */
export const calendarDropRipple: Variants = {
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: [0.5, 1.05, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.6, 1],
      ease: "easeOut",
    },
  },
};

/** 任务卡片吸附到日期格子的弹性动画 */
export const taskSnapToCell: Variants = {
  initial: { scale: 1.1, opacity: 0.6 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 18,
    },
  },
};
