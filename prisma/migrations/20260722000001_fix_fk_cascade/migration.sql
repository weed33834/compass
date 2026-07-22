-- C-2 修复：补全外键级联删除约束
-- 原问题：删除题库时，AnswerRecord.question / AnswerRecord.bank / SessionAnswer.question / ReviewItem.bank
-- 未声明 onDelete，默认为 Restrict，导致有答题记录的题库无法删除（500 错误）
--
-- 策略：
--   AnswerRecord.question → Cascade（题删则记录删，避免脏数据）
--   AnswerRecord.bank     → Cascade（题库删则记录删）
--   SessionAnswer.question → Cascade
--   ReviewItem.bank       → Cascade
-- 注意：ReviewItem.question 已是 Cascade（原 schema 已正确）

-- 1. AnswerRecord → Question (原 Restrict → Cascade)
ALTER TABLE "AnswerRecord" DROP CONSTRAINT "AnswerRecord_questionId_fkey";
ALTER TABLE "AnswerRecord"
  ADD CONSTRAINT "AnswerRecord_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id")
  ON DELETE CASCADE;

-- 2. AnswerRecord → QuestionBank (原 Restrict → Cascade)
ALTER TABLE "AnswerRecord" DROP CONSTRAINT "AnswerRecord_bankId_fkey";
ALTER TABLE "AnswerRecord"
  ADD CONSTRAINT "AnswerRecord_bankId_fkey"
  FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id")
  ON DELETE CASCADE;

-- 3. SessionAnswer → Question (原 Restrict → Cascade)
ALTER TABLE "SessionAnswer" DROP CONSTRAINT "SessionAnswer_questionId_fkey";
ALTER TABLE "SessionAnswer"
  ADD CONSTRAINT "SessionAnswer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id")
  ON DELETE CASCADE;

-- 4. ReviewItem → QuestionBank (原 Restrict → Cascade)
ALTER TABLE "ReviewItem" DROP CONSTRAINT "ReviewItem_bankId_fkey";
ALTER TABLE "ReviewItem"
  ADD CONSTRAINT "ReviewItem_bankId_fkey"
  FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id")
  ON DELETE CASCADE;
