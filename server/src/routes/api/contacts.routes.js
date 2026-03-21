import { Router } from 'express';
import { validate } from '../../core/validate.js';
import { asyncHandler } from '../../core/errors.js';
import { sendResponse } from '../../core/response.js';
import * as contactService from '../../services/contact.service.js';
import { addContactsSchema } from '../../schemas/contact.schema.js';

const router = Router({ mergeParams: true });

router.get('/', asyncHandler(async (req, res) => {
  const contacts = await contactService.listContacts(req.user.user_id, req.params.id);
  sendResponse(res, { contacts });
}));

router.post('/', validate(addContactsSchema), asyncHandler(async (req, res) => {
  const result = await contactService.addContacts(req.user.user_id, req.params.id, req.body.values);
  sendResponse(res, result, false, null, 201);
}));

router.delete('/:contactId', asyncHandler(async (req, res) => {
  const result = await contactService.deleteContact(req.user.user_id, req.params.id, req.params.contactId);
  sendResponse(res, result);
}));

export default router;
