/**
 * Agrega sessões por hora para o gráfico (normal + NP013).
 * @param {Array<{ horaInicio: string, duracaoSegundos: number, tipo?: string }>} sessoes
 * @returns {Array<{ hora: string, segundos: number, segundosNp013: number }>}
 */
export function agregarSessoesPorHora(sessoes) {
  const porHora = Array.from({ length: 24 }, (_, i) => ({
    hora: `${i}h`,
    segundos: 0,
    segundosNp013: 0,
  }))

  for (const sessao of sessoes) {
    const parteHora = sessao.horaInicio?.split(':')[0]
    const indice = parseInt(parteHora, 10)
    if (Number.isNaN(indice) || indice < 0 || indice >= 24) continue
    const dur = sessao.duracaoSegundos ?? 0
    if (sessao.tipo === 'np013') {
      porHora[indice].segundosNp013 += dur
    } else {
      porHora[indice].segundos += dur
    }
  }

  return porHora
}
