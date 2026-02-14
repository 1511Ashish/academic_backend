import { Router } from 'express';

const router = Router();

router.all('*', (_req, res) => {
  res.status(410).json({ success: false, message: 'Fees module removed in v2' });
});

export default router;
