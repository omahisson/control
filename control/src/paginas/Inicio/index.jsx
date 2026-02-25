import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { buscarSessoesPorDia, registrarSessao } from '../../logica/servicos/servicoSessoes.js'
import { agregarSessoesPorHora } from '../../logica/hooks/useDadosGraficoSessoes.js'
import {
  useCronometro,
  obterDataHoje,
  formatarHora,
  formatarDuracao,
} from '../../logica/hooks/useCronometro.js'
import { Botao } from '../../ui/componentes/Botao.jsx'

const GAP_EIXO_Y_PX = 80

export function PaginaInicio() {
  const dataHoje = obterDataHoje()
  const [diaSelecionado, setDiaSelecionado] = useState(dataHoje)
  const [sessoesDoDia, setSessoesDoDia] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [quantidadeTicksEixoY, setQuantidadeTicksEixoY] = useState(5)
  const refContainerGrafico = useRef(null)
  const { ativo, segundosDecorridos, horaInicio, iniciar, parar } = useCronometro()

  useEffect(() => {
    const el = refContainerGrafico.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const { height } = entries[0]?.contentRect ?? {}
      if (typeof height === 'number' && height > 0) {
        const quantidade = Math.max(2, Math.floor(height / GAP_EIXO_Y_PX) + 1)
        setQuantidadeTicksEixoY(quantidade)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const dadosDoGrafico = agregarSessoesPorHora(sessoesDoDia)

  const dadosDoGraficoComCronometro = (() => {
    const mesmoDia = diaSelecionado === dataHoje
    if (!ativo || horaInicio == null || !mesmoDia) return dadosDoGrafico
    return dadosDoGrafico.map((d, i) =>
      i === horaInicio
        ? { ...d, segundos: d.segundos + segundosDecorridos }
        : d
    )
  })()

  const dadosComZoomEixoX = (() => {
    const comDados = dadosDoGraficoComCronometro
      .map((d, i) => (d.segundos > 0 ? i : -1))
      .filter((i) => i >= 0)
    if (comDados.length === 0) {
      const horaRef = ativo && horaInicio != null ? horaInicio : new Date().getHours()
      const inicio = Math.max(0, horaRef - 2)
      const fim = Math.min(23, horaRef + 2)
      return dadosDoGraficoComCronometro.slice(inicio, fim + 1)
    }
    let primeiraHora = Math.max(0, comDados[0] - 1)
    let ultimaHora = Math.min(23, comDados[comDados.length - 1] + 1)
    if (ativo && horaInicio != null && diaSelecionado === dataHoje) {
      primeiraHora = Math.min(primeiraHora, Math.max(0, horaInicio - 1))
      ultimaHora = Math.max(ultimaHora, Math.min(23, horaInicio + 1))
    }
    return dadosDoGraficoComCronometro.slice(primeiraHora, ultimaHora + 1)
  })()

  const maxSegundosEixoY = Math.max(
    ...dadosComZoomEixoX.map((d) => d.segundos),
    1
  )

  /** Para cada coluna: gradiente vertical com até 3 faixas (0–30s verde, 31–60s vermelho, >60s preto). */
  function offsetsGradienteColuna(segundos) {
    if (segundos <= 0) return { fimVerde: 1, fimVermelho: 1 }
    const fimVerde = segundos >= 30 ? 30 / segundos : 1
    const fimVermelho = segundos >= 60 ? 60 / segundos : 1
    return { fimVerde, fimVermelho }
  }

  const corFundoCronometro =
    ativo && segundosDecorridos <= 30
      ? 'var(--fundo-pastel-verde)'
      : ativo && segundosDecorridos <= 60
        ? 'var(--fundo-pastel-vermelho)'
        : ativo
          ? 'var(--fundo-pastel-preto)'
          : undefined

  function formatarValorEixoY(segundos) {
    if (segundos <= 60) return `${segundos}s`
    return `${Math.round(segundos / 60)}min`
  }

  function formatarTooltipValor(segundos) {
    if (segundos <= 60) return `${segundos} s`
    return `${Math.round(segundos / 60)} min`
  }

  const recarregarSessoes = useCallback(async () => {
    setCarregando(true)
    try {
      const lista = await buscarSessoesPorDia(diaSelecionado)
      setSessoesDoDia(lista)
    } catch {
      setSessoesDoDia([])
    } finally {
      setCarregando(false)
    }
  }, [diaSelecionado])

  useEffect(() => {
    recarregarSessoes()
  }, [recarregarSessoes])

  function obterDataMaxima() {
    return dataHoje
  }

  function alterarDia(direcao) {
    const data = new Date(diaSelecionado + 'T12:00:00')
    data.setDate(data.getDate() + direcao)
    const novaData = data.toISOString().slice(0, 10)
    if (direcao < 0 || novaData <= dataHoje) setDiaSelecionado(novaData)
  }

  const podeAvancarDia = diaSelecionado < dataHoje

  async function aoPararCronometro() {
    const resultado = parar()
    if (!resultado || resultado.duracaoSegundos <= 0) return
    const dataInicio = resultado.dataInicio
    const dataStr = dataInicio.toISOString().slice(0, 10)
    const horaInicio = formatarHora(dataInicio)
    try {
      await registrarSessao({
        data: dataStr,
        horaInicio,
        duracaoSegundos: resultado.duracaoSegundos,
      })
      if (diaSelecionado === dataStr) {
        await recarregarSessoes()
      }
    } catch (e) {
      console.error('Erro ao registrar sessão:', e)
    }
  }

  return (
    <div
      className="pagina-painel"
      style={corFundoCronometro ? { backgroundColor: corFundoCronometro } : undefined}
    >
      <header className="pagina-painel__cabecalho">
        <h1 className="pagina-painel__titulo">Control</h1>
      </header>

      <section className="pagina-painel__grafico">
        <div className="pagina-painel__linha-dia">
          <button
            type="button"
            className="pagina-painel__seta-dia"
            onClick={() => alterarDia(-1)}
            aria-label="Dia anterior"
          >
            ‹
          </button>
          <input
            id="select-dia"
            type="date"
            className="pagina-painel__select-dia"
            value={diaSelecionado}
            max={obterDataMaxima()}
            onChange={(e) => setDiaSelecionado(e.target.value)}
          />
          <button
            type="button"
            className="pagina-painel__seta-dia"
            onClick={() => alterarDia(1)}
            disabled={!podeAvancarDia}
            aria-label="Próximo dia"
          >
            ›
          </button>
        </div>
        <div className="pagina-painel__grafico-container">
          {carregando ? (
            <p className="pagina-painel__carregando">Carregando...</p>
          ) : (
            <div ref={refContainerGrafico} className="pagina-painel__grafico-inner">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosComZoomEixoX}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <defs>
                  {dadosComZoomEixoX.map((entry) => {
                    const { fimVerde, fimVermelho } = offsetsGradienteColuna(entry.segundos)
                    const id = `gradiente-coluna-${entry.hora.replace('h', '')}`
                    return (
                      <linearGradient
                        key={id}
                        id={id}
                        x1="0"
                        y1="1"
                        x2="0"
                        y2="0"
                      >
                        <stop offset="0" stopColor="#22c55e" />
                        <stop offset={fimVerde} stopColor="#22c55e" />
                        <stop offset={fimVerde} stopColor="#ef4444" />
                        <stop offset={fimVermelho} stopColor="#ef4444" />
                        <stop offset={fimVermelho} stopColor="rgb(51, 51, 51)" />
                        <stop offset="1" stopColor="rgb(51, 51, 51)" />
                      </linearGradient>
                    )
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 11 }}
                  stroke="#666"
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, maxSegundosEixoY]}
                  tickCount={quantidadeTicksEixoY}
                  tick={{ fontSize: 11 }}
                  stroke="#666"
                  tickFormatter={formatarValorEixoY}
                  width={48}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(valor) => formatarTooltipValor(valor)}
                  labelFormatter={(hora) => hora}
                />
                <Bar
                  dataKey="segundos"
                  radius={[4, 4, 0, 0]}
                >
                  {dadosComZoomEixoX.map((entry) => (
                    <Cell
                      key={entry.hora}
                      fill={
                        entry.segundos > 0
                          ? `url(#gradiente-coluna-${entry.hora.replace('h', '')})`
                          : '#e5e7eb'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="pagina-painel__cronometro">
        {ativo ? (
          <div className="pagina-painel__cronometro-ativo">
            <span className="pagina-painel__tempo" aria-live="polite">
              {formatarDuracao(segundosDecorridos)}
            </span>
            <Botao tipo="button" variante="primario" aoClicar={aoPararCronometro}>
              Parar
            </Botao>
          </div>
        ) : (
          <Botao
            tipo="button"
            variante="primario"
            aoClicar={iniciar}
          >
            Início
          </Botao>
        )}
      </section>
    </div>
  )
}
