import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '../config/index.js'
import type { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    return jwt.verify(token, config.jwtSecret) as { id: string; email: string }
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed)
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }

  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  if (!decoded) {
    res.status(401).json({ success: false, error: 'Invalid token' })
    return
  }

  req.user = decoded
  next()
}
