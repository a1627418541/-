import { Router } from 'express'
import { getAllCharacters, getCharacter } from '../services/character.js'

const router = Router()

router.get('/', (req, res) => {
  const characters = getAllCharacters().map(c => ({
    key: c.key,
    name: c.name,
    avatar: c.avatar,
    title: c.title,
    age: c.age,
    occupation: c.occupation,
    bio: c.bio,
  }))
  res.json({ success: true, data: characters })
})

router.get('/:key', (req, res) => {
  const character = getCharacter(req.params.key)
  if (!character) {
    res.status(404).json({ success: false, error: 'Character not found' })
    return
  }
  res.json({ success: true, data: character })
})

export default router
