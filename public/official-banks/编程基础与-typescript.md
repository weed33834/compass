# 编程基础与 TypeScript

---

## 单选题

TypeScript 中，以下哪个类型表示“永远不会有值”？

A. void
B. null
C. undefined
D. never

答案：D
解析：never 表示永远不会发生的值类型，常用于抛出异常的函数、无限循环、或穷尽检查（exhaustive check）。void 表示函数无返回值，但实际返回 undefined。
难度：2.5
知识点：TypeScript-类型系统, never

---

## 单选题

下列哪个 HTTP 状态码表示“资源已永久移动”？

A. 301
B. 302
C. 307
D. 404

答案：A
解析：301 Moved Permanently 表示永久重定向，浏览器和搜索引擎会缓存新地址。302 是临时重定向，307 保持原方法重定向，404 是资源未找到。
难度：1.5
知识点：HTTP-状态码

---

## 单选题

JavaScript 中，0.1 + 0.2 的结果是？

A. 0.3
B. 0.30000000000000004
C. 0.3000000000000001
D. 0.29999999999999999

答案：B
解析：JavaScript 使用 IEEE 754 双精度浮点数，0.1 和 0.2 都无法精确表示，相加后产生浮点误差。比较时应用 Math.abs(a - b) < Number.EPSILON。
难度：2
知识点：JavaScript-数值, IEEE 754

---

## 单选题

下列哪个不是 JavaScript 的原始类型（primitive）？

A. string
B. number
C. object
D. symbol

答案：C
解析：JavaScript 原始类型：string、number、boolean、null、undefined、symbol、bigint。object 是引用类型，不是原始类型。
难度：1.5
知识点：JavaScript-类型

---

## 单选题

时间复杂度 O(log n) 的典型算法是？

A. 冒泡排序
B. 二分查找
C. 线性查找
D. 快速排序

答案：B
解析：二分查找每次将搜索范围减半，时间复杂度 O(log n)。冒泡/线性查找是 O(n)，快速排序平均 O(n log n)。
难度：1.5
知识点：算法-复杂度

---

## 单选题

TypeScript 中，type 和 interface 的主要区别是？

A. interface 不支持联合类型，type 支持
B. type 不能被 class implements
C. interface 不能描述对象形状
D. type 不能扩展（extend）

答案：A
解析：type 可以表示联合类型、交叉类型、原始类型别名等；interface 主要描述对象形状，支持声明合并（declaration merging）。两者都可被 class implements。
难度：2.5
知识点：TypeScript-类型系统, type vs interface

---

## 多选题

下列哪些是 HTTP 请求方法？（多选）

A. GET
B. POST
C. PATCH
D. FETCH

答案：ABC
解析：HTTP 标准方法：GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS、CONNECT、TRACE。FETCH 是浏览器 API 名称，不是 HTTP 方法。
难度：1.5
知识点：HTTP-方法

---

## 多选题

下列哪些是 JavaScript 数组的不可变方法（不修改原数组）？（多选）

A. map
B. filter
C. push
D. slice

答案：ABD
解析：不可变方法：map、filter、slice、concat、reduce、find 等。可变方法：push、pop、shift、unshift、splice、sort、reverse 等。
难度：2
知识点：JavaScript-数组, 不可变性

---

## 多选题

关于 RESTful API 设计，下列哪些说法正确？（多选）

A. 用名词复数表示资源集合，如 /users
B. 用 HTTP 方法表达操作意图
C. 用状态码反映处理结果
D. URL 中应包含动词以表明动作

答案：ABC
解析：REST 风格：URL 用名词复数（/users、/users/123），动作用 HTTP 方法（GET/POST/PUT/DELETE），结果用状态码（200/201/400/404/500）。URL 中包含动词（如 /getUser）不符合 REST 规范。
难度：2
知识点：HTTP-REST, API设计

---

## 多选题

下列哪些是 React 19 的新特性？（多选）

A. Server Components 稳定
B. use() hook
C. Actions 和 useActionState
D. Hooks 完全废弃

答案：ABC
解析：React 19 稳定了 Server Components、use() hook、Actions/useActionState、ref as prop、forwardRef 渐进弃用、文档元数据原生支持等。Hooks 没有被废弃，反而得到增强。
难度：2.5
知识点：React-19, 前端框架

---

## 多选题

下列哪些数据结构是线性的？（多选）

A. 数组
B. 栈
C. 队列
D. 二叉树

答案：ABC
解析：线性结构：数组、链表、栈、队列。非线性结构：树（二叉树、B 树、堆）、图、哈希表（结构上是数组+链表/红黑树）。
难度：1.5
知识点：数据结构-分类

---

## 判断题

TypeScript 编译后会移除所有类型注解。

答案：正确
解析：TypeScript 是结构化类型系统，编译为 JavaScript 时会移除所有类型注解、接口、类型别名，运行时没有任何类型信息（除非用 class 装饰器等运行时反射机制）。
难度：1.5
知识点：TypeScript-编译

---

## 判断题

JavaScript 中，== 比较不进行类型转换，=== 比较进行类型转换。

答案：错误
解析：正好相反：==（宽松相等）会进行类型转换后比较，===（严格相等）不进行类型转换。建议始终使用 === 避免隐式转换的坑。
难度：1.5
知识点：JavaScript-相等性

---

## 判断题

HTTP 是无状态协议，每次请求相互独立。

答案：正确
解析：HTTP 是无状态协议，服务器默认不保留客户端的任何上下文。会话状态通过 Cookie、Session、JWT 等机制在应用层维护。
难度：1
知识点：HTTP-特性

---

## 判断题

Promise.all 在任一 Promise 失败时立即 reject，不会等待其他完成。

答案：正确
解析：Promise.all 是“短-circuit”：任一 reject 立即 reject 整个 Promise.all，其他 Promise 仍在执行但其结果被忽略。需要“全等”应使用 Promise.allSettled。
难度：2
知识点：JavaScript-Promise

---

## 填空题

JavaScript 中，将字符串 “123” 转为数字的常用方法是 Number()、parseInt() 或在前面加 ____（运算符）。

答案：+|一元加|unary plus
解析：+str 是一元加运算符，会触发隐式数字转换，等价于 Number(str)。如 +"123" === 123。
难度：2
知识点：JavaScript-类型转换

---

## 填空题

HTTP 状态码 200 表示 ____，404 表示 ____。

答案：OK|成功|success||Not Found|未找到|资源不存在
解析：2xx 成功类、3xx 重定向、4xx 客户端错误、5xx 服务器错误。200 OK、404 Not Found 是最常用的两个。
难度：1
知识点：HTTP-状态码

---

## 填空题

TypeScript 中，泛型的语法用 ____（符号）包裹类型参数，如 function id<T>(x: T): T。

答案：<>|尖括号|angle bracket
解析：TypeScript 泛型用 <T> 包裹类型参数。可在函数、接口、类型别名、class 上使用。如 type Box<T> = { value: T }。
难度：1.5
知识点：TypeScript-泛型

---

## 填空题

CSS 中，使元素水平居中的常用方式：父元素 display: ____ 和 justify-content: ____。

答案：flex||center
解析：display: flex + justify-content: center 实现主轴居中。如果需要垂直居中再加 align-items: center。
难度：1
知识点：CSS-布局, flexbox

---

## 填空题

Git 中，撤销已 push 的最新提交应使用 git ____ 命令（注意：force push 才能更新远端）。

答案：revert
解析：已 push 的提交应使用 git revert <commit> 创建一个反向提交来撤销，避免改写历史。reset 会改写历史，仅适用于本地未 push 的提交。
难度：2.5
知识点：Git-操作
