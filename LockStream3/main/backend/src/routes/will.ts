import { Router } from 'express';
import { create, get, execute } from '../controllers/will.controller.ts';  // ← Fonksiyonları tek tek import et

const router = Router();

router.post('/will', create);
router.get('/will/:owner', get);
router.post('/will/:owner/execute', execute);

export default router;