import { requisicao } from './api.js'

/**
 * Busca o status de acompanhamento de um dia (registrado | nao_acompanhado).
 */
export async function buscarStatusDia(data) {
  const { status } = await requisicao(`/acompanhamento?data=${data}`)
  return status === 'registrado' ? 'registrado' : 'nao_acompanhado'
}

/**
 * Atualiza o status de acompanhamento de um dia.
 * @param {string} data - YYYY-MM-DD
 * @param {'registrado' | 'nao_acompanhado'} status
 */
export async function atualizarStatusDia(data, status) {
  return requisicao('/acompanhamento', {
    method: 'PATCH',
    body: JSON.stringify({ data, status }),
  })
}
