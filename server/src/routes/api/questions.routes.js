import { Router } from 'express';
import { validate } from '../../core/validate.js';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import * as questionService from '../../services/question.service.js';
import { updateQuestionsSchema } from '../../schemas/question.schema.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(async (req, res) => {
  const questions = await questionService.listQuestions(req.user.user_id, req.params.id);
  sendResponse(res, { questions });
}));

router.patch('/', validate(updateQuestionsSchema), asyncHandler(async (req, res) => {
  const questions = await questionService.updateQuestions(req.user.user_id, req.params.id, req.body.questions);
  sendResponse(res, { questions });
}));

export default router;
