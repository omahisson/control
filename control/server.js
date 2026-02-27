import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ARQUIVO_DB = path.join(__dirname, 'db.json')
const PORT = process.env.PORT || 3032

const app = express()
app.use(express.json())

// 👇 SERVIR O BUILD DO REACT
app.use(express.static(path.join(__dirname, 'dist')))

// 👇 ROTAS DA API
function lerDb() {
  const raw = fs.readFileSync(ARQUIVO_DB, 'utf-8')
  return JSON.parse(raw)
}

function escreverDb(dados) {
  fs.writeFileSync(ARQUIVO_DB, JSON.stringify(dados, null, 2), 'utf-8')
}

app.get('/usuarios', (req, res) => {
  const db = lerDb()
  res.json(db.usuarios ?? [])
})

app.get('/sessoes', (req, res) => {
  const db = lerDb()
  let sessoes = db.sessoes ?? []
  const data = req.query.data
  if (data) {
    sessoes = sessoes.filter((s) => s.data === data)
  }
  res.json(sessoes)
})

app.post('/sessoes', (req, res) => {
  const db = lerDb()
  if (!Array.isArray(db.sessoes)) db.sessoes = []
  const proximoId = Math.max(0, ...db.sessoes.map((s) => s.id || 0)) + 1
  const sessao = { id: proximoId, ...req.body }
  db.sessoes.push(sessao)
  escreverDb(db)
  res.status(201).json(sessao)
})

// 👇 fallback para React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})