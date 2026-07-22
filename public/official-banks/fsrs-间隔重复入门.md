# FSRS 与间隔重复入门

---

## 单选题

FSRS 算法中，"记忆稳定性"（Stability）的含义是？

A. 卡片当前的可检索性概率
B. 在不复习的情况下，记忆能保持的天数
C. 卡片的难度系数（1-10）
D. 已复习的次数

答案：B
解析：Stability 表示如果不再复习，记忆能维持的时间长度（天）。S 越大，记忆越牢固。
难度：2.5
知识点：FSRS-核心概念, Stability
来源：FSRS-6 文档

---

## 单选题

下列哪个不是 FSRS-6 的 4 个评分等级？

A. Again（重来）
B. Hard（困难）
C. Good（良好）
D. Skip（跳过）

答案：D
解析：FSRS-6 使用 Again / Hard / Good / Easy 四档（对应 Rating 1-4）。Skip 不是 FSRS 的评分等级。
难度：1.5
知识点：FSRS-评分

---

## 单选题

Compass 项目的视觉风格隐喻源自？

A. 现代极简主义
B. 深海航海仪器
C. 日式和风
D. 赛博朋克

答案：B
解析：Compass 以黄铜罗盘、漂流瓶、星图等航海仪器为美学隐喻，对应 abyss / ivory / brass / coral 色板。
难度：1
知识点：Compass-设计

---

## 单选题

FSRS 中，难度（Difficulty）D 的取值范围是？

A. 0 到 1
B. 1 到 10
C. 1 到 5
D. 0 到 100

答案：B
解析：D 取值 1-10。初始难度由首答评分决定，后续基于 Mean Reversion 公式向 5 收敛后再叠加用户评分调整。
难度：2
知识点：FSRS-DSR模型, Difficulty

---

## 单选题

FSRS 默认的目标记忆保留率（request_retention）是？

A. 0.85
B. 0.90
C. 0.95
D. 0.99

答案：B
解析：默认 0.9（90%）。该值越高，复习频率越密集；越低则间隔越长但遗忘风险更大。Anki 推荐 0.85-0.95。
难度：1.5
知识点：FSRS-参数, request_retention

---

## 单选题

下列关于 FSRS 与 SM-2 算法的对比，错误的是？

A. FSRS 基于 DSR 模型，SM-2 基于 SuperMemo 2 公式
B. FSRS 支持个性化权重优化，SM-2 参数固定
C. FSRS 的间隔预测精度显著优于 SM-2
D. SM-2 是 2024 年发布的新算法

答案：D
解析：SM-2 是 1987 年 Piotr Wozniak 设计的算法，被 Anki 沿用至今。FSRS-6 由 Jarrett Ye 在 2022-2024 年开发。
难度：2.5
知识点：FSRS-历史, SM-2

---

## 多选题

下列哪些是 Compass 支持的题库导入格式？（多选）

A. Markdown (.md)
B. Excel (.xlsx)
C. Word (.docx)
D. PDF (.pdf)

答案：ABC
解析：V1 支持 .md / .txt / .xlsx / .xls / .csv / .docx。PDF 暂不支持，可先用工具转 Markdown 再导入。
难度：1.5
知识点：Compass-导入, V1-能力

---

## 多选题

关于 FSRS 的 DSR 模型，下列哪些说法正确？（多选）

A. D 代表 Difficulty（难度）
B. S 代表 Stability（稳定性）
C. R 代表 Retrievability（可检索性）
D. R 由 S 和经过时间直接计算得出

答案：ABCD
解析：DSR 三参数模型：D 是难度（1-10），S 是稳定性（天），R 是当前记忆保留率，由 R = exp(-t/S) 类公式计算。
难度：3
知识点：FSRS-DSR模型

---

## 多选题

下列哪些属于 Compass 的核心模块？（多选）

A. 答题舱 (Study)
B. 造船工坊 (Workshop)
C. 错题漂流瓶 (Wrongbook)
D. 每日打卡 (Daily Check-in)

答案：ABC
解析：Compass V1 的 7 个核心模块：罗盘 / 答题舱 / 工坊 / 错题本 / 日志 / 分析 / 账户。打卡不在其中。
难度：2
知识点：Compass-架构

---

## 多选题

FSRS-6 默认的 learning_steps 配置包括？（多选）

A. 1 分钟
B. 10 分钟
C. 1 天
D. 4 天

答案：AB
解析：默认 learning_steps = [1m, 10m]。1 天/4 天是 Anki 的传统步骤，FSRS-6 默认更短以加快新卡毕业。
难度：2.5
知识点：FSRS-参数, learning_steps

---

## 多选题

下列哪些情况会触发 FSRS 卡片进入 RELEARNING 状态？（多选）

A. 复习时按 Again
B. 复习时按 Hard
C. 复习时按 Good 但保留率已低于 0.7
D. 卡片从未被复习过

答案：A
解析：RELEARNING 只在复习失败（Again）时触发。Hard/Good/Easy 都会推进状态。新卡属于 NEW 状态。
难度：3
知识点：FSRS-状态机, RELEARNING

---

## 判断题

FSRS-6 默认使用 21 个权重参数。

答案：正确
解析：FSRS-6 默认 21 个权重，可通过优化器在用户积累约 1000 条复习记录后重新训练个性化权重。
难度：2
知识点：FSRS-权重

---

## 判断题

Compass 的两阶段提交中，/api/study/grade 会写入 ReviewLog。

答案：错误
解析：grade 阶段只写 AnswerRecord 不动 FSRS；ReviewLog 在 apply 阶段写入。这样设计避免用户覆盖评分时重复调度 FSRS。
难度：3
知识点：Compass-API, 两阶段提交

---

## 判断题

多选题漏选时，Compass 给 0 分。

答案：错误
解析：漏选给部分分：0.5 + (已选正确数 / 应选正确数) * 0.5，上限 0.99。只有错选才给 0 分。
难度：2.5
知识点：Compass-判分, 多选题

---

## 判断题

FSRS 的 Retrievability R 是单调递减的（在两次复习之间）。

答案：正确
解析：R = exp(-t/S)，t 是自上次复习的天数，随 t 增加 R 单调递减，直到下一次复习时被重置。
难度：2.5
知识点：FSRS-R, 遗忘曲线

---

## 填空题

FSRS 中，记忆保留率 R 的计算基于 ____ 公式（指数衰减）。

答案：R=exp(-t/S)|exp(-elapsed_days/S)|forgetting curve
解析：R = exp(-t/S)，其中 t 是自上次复习以来的天数，S 是稳定性。也称为 forgetting curve（遗忘曲线）。
难度：3
知识点：FSRS-公式, R

---

## 填空题

Compass 的 4 键评分快捷键分别是 1/2/3/4，对应 ____ / 困难 / 良好 / 简单。

答案：Again|again|重来
解析：1=Again（重来）、2=Hard（困难）、3=Good（良好）、4=Easy（简单）。Space 接受默认评分。
难度：1.5
知识点：Compass-快捷键, 评分

---

## 填空题

FSRS-6 默认的 21 个权重 w 中，w[0] 用于初始化新卡的 ____（参数名英文）。

答案：Stability|stability|S|initial stability
解析：w[0] 是新卡初始稳定性（initial Stability）的初始值，约 0.212。它决定了从未复习过的卡片的起始 S 值。
难度：3.5
知识点：FSRS-权重, w[0]

---

## 填空题

Compass 默认目标记忆保留率是 ____（百分比），FSRS 默认学习步骤是从 1 分钟到 ____ 分钟。

答案：90%|90|0.9||10|十
解析：request_retention = 0.9（90%）；learning_steps = [1m, 10m]。
难度：2.5
知识点：FSRS-默认参数, Compass-配置

---

## 填空题

Compass 的两阶段提交：第一阶段 API 是 /api/study/____（动词），第二阶段是 /api/study/____（动词）。

答案：grade||apply
解析：grade 阶段判分（不动 FSRS）+ 写 AnswerRecord；apply 阶段应用 FSRS 调度 + 写 ReviewLog + 更新 ReviewItem。
难度：2
知识点：Compass-API, 两阶段提交
