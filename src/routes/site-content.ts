import fs from 'fs';
import path from 'path';
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();

const DATA_FILE = path.join(__dirname, '../data/site-content.json');

function readContent(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeContent(data: Record<string, unknown>): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    if (
      sv !== null &&
      typeof sv === 'object' &&
      !Array.isArray(sv) &&
      tv !== null &&
      typeof tv === 'object' &&
      !Array.isArray(tv)
    ) {
      result[key] = deepMerge(
        tv as Record<string, unknown>,
        sv as Record<string, unknown>
      );
    } else {
      result[key] = sv;
    }
  }
  return result;
}

// GET /api/site-content — público
router.get('/', (_req: Request, res: Response) => {
  res.json(readContent());
});

// PUT /api/site-content — admin only, atualiza campos parcialmente
router.put('/', authMiddleware, adminMiddleware, (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ error: 'Body deve ser um objeto JSON' });
    return;
  }

  const current = readContent();
  const updated = deepMerge(current, body);
  writeContent(updated);

  console.log('[SiteContent] Conteúdo atualizado pelo admin');
  res.json(updated);
});

export default router;
