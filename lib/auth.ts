import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { config } from './config'

export interface AuthUser {
  id: string
  email: string
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthUser
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed)
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  return verifyToken(token)
}
