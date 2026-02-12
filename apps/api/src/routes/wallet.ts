import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const walletRouter = Router();

walletRouter.use(authMiddleware);

// Get balance
walletRouter.get('/balance', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { balance: true },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: { balance: user.balance } });
  } catch (err) {
    next(err);
  }
});

// Top up balance
walletRouter.post('/topup', async (req: AuthRequest, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid amount' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { balance: { increment: amount } },
      select: { balance: true },
    });

    res.json({ success: true, data: { balance: user.balance } });
  } catch (err) {
    next(err);
  }
});
