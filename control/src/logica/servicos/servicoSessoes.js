import { requisicao } from './api.js'

/**
 * Busca todas as sessões (sem filtro de data).
 */
export async function buscarTodasSessoes() {
  const lista = await requisicao('/sessoes')
  return Array.isArray(lista) ? lista : []
}

/**
 * Busca todas as sessões de um dia (json-server: ?data=YYYY-MM-DD).
 */
export async function buscarSessoesPorDia(data) {
  const lista = await requisicao(`/sessoes?data=${data}`)
  return Array.isArray(lista) ? lista : []
}

/**
 * Registra uma nova sessão no servidor.
 * @param {{ data: string, horaInicio: string, duracaoSegundos: number, tipo?: 'normal' | 'np013' }} sessao
 */
export async function registrarSessao(sessao) {
  return requisicao('/sessoes', {
    method: 'POST',
    body: JSON.stringify({ ...sessao, tipo: sessao.tipo ?? 'normal' }),
  })
}
