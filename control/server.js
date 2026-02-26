/**
 * API simples que substitui o json-server.
 * Lê/grava db.json e expõe os mesmos endpoints para o front.
 * Roda com: node server.js ou pm2 start server.js --name control-api
 */
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARQUIVO_DB = path.join(__dirname, 'db.json')
const PORT = process.env.PORT || 3032

const app = express()
app.use(express.json())

function lerDb() {
  const raw = fs.readFileSync(ARQUIVO_DB, 'utf-8')
  return JSON.parse(raw)
}

function escreverDb(dados) {
  fs.writeFileSync(ARQUIVO_DB, JSON.stringify(dados, null, 2), 'utf-8')
}

app.get('/usuarios', (req, res) => {
  try {
    const db = lerDb()
    res.json(db.usuarios ?? [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/sessoes', (req, res) => {
  try {
    const db = lerDb()
    let sessoes = db.sessoes ?? []
    const data = req.query.data
    if (data) {
      sessoes = sessoes.filter((s) => s.data === data)
    }
    res.json(sessoes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/sessoes', (req, res) => {
  try {
    const db = lerDb()
    if (!Array.isArray(db.sessoes)) db.sessoes = []
    const proximoId = Math.max(0, ...db.sessoes.map((s) => s.id || 0)) + 1
    const sessao = { id: proximoId, ...req.body }
    db.sessoes.push(sessao)
    escreverDb(db)
    res.status(201).json(sessao)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`)
})
