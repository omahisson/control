import { useState, useEffect, useCallback } from 'react'

/**
 * Retorna data atual no fuso local em YYYY-MM-DD.
 */
export function obterDataHoje() {
  const hoje = new Date()
  return hoje.toISOString().slice(0, 10)
}

/**
 * Formata um Date para HH:mm:ss.
 */
export function formatarHora(date) {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * Formata segundos em HH:MM:SS para exibição.
 */
export function formatarDuracao(segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return [h, m, s].map((n) => n.toString().padStart(2, '0')).join(':')
}

/**
 * Hook do cronômetro: inicia, para e retorna segundos decorridos.
 */
export function useCronometro() {
  const [inicio, setInicio] = useState(null)
  const [segundosDecorridos, setSegundosDecorridos] = useState(0)

  const ativo = inicio !== null

  useEffect(() => {
    if (!inicio) return
    const intervalo = setInterval(() => {
      setSegundosDecorridos(Math.floor((Date.now() - inicio) / 1000))
    }, 1000)
    return () => clearInterval(intervalo)
  }, [inicio])

  const iniciar = useCallback(() => {
    setInicio(Date.now())
    setSegundosDecorridos(0)
  }, [])

  const parar = useCallback(() => {
    const fim = Date.now()
    const duracao = inicio ? Math.floor((fim - inicio) / 1000) : 0
    setInicio(null)
    setSegundosDecorridos(0)
    return { dataInicio: new Date(inicio), duracaoSegundos: duracao }
  }, [inicio])

  return {
    ativo,
    segundosDecorridos,
    horaInicio: inicio != null ? new Date(inicio).getHours() : null,
    iniciar,
    parar,
  }
}
