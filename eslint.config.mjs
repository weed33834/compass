// Next.js 16 / ESLint 9 flat config（替代已废弃的 .eslintrc.json + `next lint`）
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next 16 自带 eslint-plugin-react-hooks v7，引入了更严格的新规则：
//   - react-hooks/refs：禁止 render 阶段读写 ref.current
//   - react-hooks/set-state-in-effect：禁止 effect 内同步 setState
// 这两条规则会大面积命中仓库内既有的 ref 镜像（稳定 useCallback 依赖）与
// effect 同步 state（SSR mount 检测 / prop→state 同步）模式，属于既有可运行代码，
// 不在本次 Next.js 16 升级范围内重构，故降级为 warn 保留可见性，后续单独治理。
const config = [
  ...nextCoreWebVitals,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
