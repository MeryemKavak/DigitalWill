import { Request, Response } from 'express';
import { createWill, getWill, executeWill } from '../services/soroban';
import type { Will } from '../models/will';

// ✅ Vasiyet oluşturma
export async function create(req: Request, res: Response) {
  try {
    const { owner, contentHash, beneficiaries } = req.body as Will;

    if (!owner || !contentHash || !Array.isArray(beneficiaries)) {
      return res.status(400).json({ error: 'owner, contentHash, beneficiaries required' });
    }

    const txId = await createWill(owner, contentHash, beneficiaries);
    return res.status(201).json({ ok: true, txId });
  } catch (err: any) {
    console.error('Create error:', err);
    return res.status(500).json({ error: err?.message ?? 'create failed' });
  }
}

// ✅ Vasiyet görüntüleme
export async function get(req: Request, res: Response) {
  try {
    const owner = req.params.owner;
    if (!owner) {
      return res.status(400).json({ error: 'owner param required' });
    }

    const will = await getWill(owner);
    return res.json(will);
  } catch (err: any) {
    console.error('Get error:', err);
    return res.status(500).json({ error: err?.message ?? 'get failed' });
  }
}

// ✅ Vasiyet yürütme
export async function execute(req: Request, res: Response) {
  try {
    const owner = req.params.owner;
    if (!owner) {
      return res.status(400).json({ error: 'owner param required' });
    }

    const txId = await executeWill(owner);
    return res.json({ ok: true, txId });
  } catch (err: any) {
    console.error('Execute error:', err);
    return res.status(500).json({ error: err?.message ?? 'execute failed' });
  }
}