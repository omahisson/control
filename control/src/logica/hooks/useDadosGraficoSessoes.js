/**
 * Agrega sessões por hora para o gráfico.
 * Eixo X = hora (0–23), Eixo Y = total de segundos naquela hora.
 * @param {Array<{ horaInicio: string, duracaoSegundos: number }>} sessoes
 * @returns {Array<{ hora: string, segundos: number }>}
 */
export function agregarSessoesPorHora(sessoes) {
  const porHora = Array.from({ length: 24 }, (_, i) => ({
    hora: `${i}h`,
    segundos: 0,
  }))

  for (const sessao of sessoes) {
    const parteHora = sessao.horaInicio?.split(':')[0]
    const indice = parseInt(parteHora, 10)
    if (!Number.isNaN(indice) && indice >= 0 && indice < 24) {
      porHora[indice].segundos += sessao.duracaoSegundos ?? 0
    }
  }

  return porHora
}
