import { useState, useEffect, useCallback, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { buscarSessoesPorDia, buscarTodasSessoes, registrarSessao } from '../../logica/servicos/servicoSessoes.js'
import { buscarStatusDia, atualizarStatusDia } from '../../logica/servicos/servicoAcompanhamento.js'
import { agregarSessoesPorHora } from '../../logica/hooks/useDadosGraficoSessoes.js'
import {
  useCronometro,
  obterDataHoje,
  formatarHora,
  formatarDuracao,
} from '../../logica/hooks/useCronometro.js'
import { Botao } from '../../ui/componentes/Botao.jsx'

const GAP_EIXO_Y_PX = 80
const META_HORAS_NP013 = 4380

function obterTimestampFimSessao(sessao) {
  if (!sessao?.data || !sessao?.horaInicio) return null
  const [ano, mes, dia] = String(sessao.data).split('-').map(Number)
  const [hora, minuto, segundo] = String(sessao.horaInicio).split(':').map(Number)
  if ([ano, mes, dia, hora, minuto, segundo].some((n) => Number.isNaN(n))) return null
  const inicio = new Date(ano, mes - 1, dia, hora, minuto, segundo)
  return inicio.getTime() + (Number(sessao.duracaoSegundos ?? 0) * 1000)
}

export function PaginaInicio() {
  const dataHoje = obterDataHoje()
  const [diaSelecionado, setDiaSelecionado] = useState(dataHoje)
  const [dataMinima, setDataMinima] = useState(null)
  const [statusAcompanhamento, setStatusAcompanhamento] = useState('nao_acompanhado')
  const [sessoesDoDia, setSessoesDoDia] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [quantidadeTicksEixoY, setQuantidadeTicksEixoY] = useState(5)
  const [np013Oculto, setNp013Oculto] = useState(false)
  const [ultimoRegistroNp013Ms, setUltimoRegistroNp013Ms] = useState(null)
  const [agoraMs, setAgoraMs] = useState(() => Date.now())
  const refContainerGrafico = useRef(null)
  const refCliquesSetaProximoDesabilitada = useRef(0)
  const { ativo, segundosDecorridos, horaInicio, iniciar, parar } = useCronometro()
  const {
    ativo: ativoNp013,
    segundosDecorridos: segundosNp013,
    horaInicio: horaInicioNp013,
    iniciar: iniciarNp013,
    parar: pararNp013,
  } = useCronometro()

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

  useEffect(() => {
    const timer = window.setInterval(() => setAgoraMs(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  const dadosDoGrafico = agregarSessoesPorHora(sessoesDoDia)

  const dadosDoGraficoComCronometro = (() => {
    const mesmoDia = diaSelecionado === dataHoje
    return dadosDoGrafico.map((d, i) => {
      let seg = d.segundos ?? 0
      let np = d.segundosNp013 ?? 0
      if (mesmoDia) {
        if (ativo && horaInicio != null && i === horaInicio) seg += segundosDecorridos
        if (ativoNp013 && horaInicioNp013 != null && i === horaInicioNp013) np += segundosNp013
      }
      return { ...d, segundos: seg, segundosNp013: np }
    })
  })()

  const dadosComZoomEixoX = (() => {
    const comDados = dadosDoGraficoComCronometro
      .map((d, i) => ((d.segundos > 0 || (d.segundosNp013 ?? 0) > 0) ? i : -1))
      .filter((i) => i >= 0)
    if (comDados.length === 0) {
      const horaRef = ativo && horaInicio != null
        ? horaInicio
        : ativoNp013 && horaInicioNp013 != null
          ? horaInicioNp013
          : new Date().getHours()
      const inicio = Math.max(0, horaRef - 2)
      const fim = Math.min(23, horaRef + 2)
      return dadosDoGraficoComCronometro.slice(inicio, fim + 1)
    }
    let primeiraHora = Math.max(0, comDados[0] - 1)
    let ultimaHora = Math.min(23, comDados[comDados.length - 1] + 1)
    if (diaSelecionado === dataHoje) {
      if (ativo && horaInicio != null) {
        primeiraHora = Math.min(primeiraHora, Math.max(0, horaInicio - 1))
        ultimaHora = Math.max(ultimaHora, Math.min(23, horaInicio + 1))
      }
      if (ativoNp013 && horaInicioNp013 != null) {
        primeiraHora = Math.min(primeiraHora, Math.max(0, horaInicioNp013 - 1))
        ultimaHora = Math.max(ultimaHora, Math.min(23, horaInicioNp013 + 1))
      }
    }
    return dadosDoGraficoComCronometro.slice(primeiraHora, ultimaHora + 1)
  })()

  const maxSegundosNormalNoDia = dadosComZoomEixoX.length
    ? Math.max(0, ...dadosComZoomEixoX.map((d) => d.segundos))
    : 0

  const maxDadosSegundos =
    maxSegundosNormalNoDia > 0
      ? maxSegundosNormalNoDia
      : Math.max(
          ...dadosComZoomEixoX.flatMap((d) => [d.segundos, d.segundosNp013 ?? 0]),
          1
        )

  const maxSegundosEixoY = Math.ceil(maxDadosSegundos / 15) * 15

  const ticksEixoY = (() => {
    const ticks = []
    for (let s = 0; s <= maxSegundosEixoY; s += 15) ticks.push(s)
    return ticks
  })()

  /** Para cada coluna: gradiente vertical com até 3 faixas (0–30s verde, 31–60s vermelho, >60s preto). */
  function offsetsGradienteColuna(segundos) {
    if (segundos <= 0) return { fimVerde: 1, fimVermelho: 1 }
    const fimVerde = segundos >= 30 ? 30 / segundos : 1
    const fimVermelho = segundos >= 60 ? 60 / segundos : 1
    return { fimVerde, fimVermelho }
  }

  /** Dados do gráfico com o maior valor realmente exibido em cada hora. */
  const dadosGraficoBarras = dadosComZoomEixoX.map((d) => ({
    ...d,
    segundosNp013Exibicao:
      maxSegundosNormalNoDia > 0
        ? Math.min(d.segundosNp013 ?? 0, maxSegundosNormalNoDia)
        : (d.segundosNp013 ?? 0),
  })).map((d) => ({
    ...d,
    segundosMax: Math.max(d.segundos, d.segundosNp013Exibicao ?? 0),
  }))

  /** Shape customizado: uma ou duas colunas por hora (100% largura se só um tipo, 50% cada se ambos). */
  function renderBarraDupla(props) {
    const { x, y, width, height, payload } = props
    const segundos = payload.segundos ?? 0
    const segundosNp013 = payload.segundosNp013 ?? 0
    const segundosNp013Exibicao = payload.segundosNp013Exibicao ?? 0
    const segundosMax = payload.segundosMax ?? 0
    if (segundosMax <= 0 || height <= 0) return null
    const cap = segundosMax
    const hNormal = (segundos / cap) * height
    const hNp013 = (segundosNp013Exibicao / cap) * height
    const temNormal = segundos > 0
    const temNp013 = segundosNp013 > 0
    const ambos = temNormal && temNp013
    const w1 = temNormal ? (ambos ? width / 2 : width) : 0
    const w2 = temNp013 ? (ambos ? width / 2 : width) : 0
    const idGradiente = `gradiente-coluna-${payload.hora.replace('h', '')}`
    const baseY = y + height
    return (
      <g>
        {temNormal && (
          <>
            <rect
              x={x}
              y={baseY - hNormal}
              width={w1}
              height={hNormal}
              fill={`url(#${idGradiente})`}
              rx={4}
              ry={4}
            />
            {segundos > 0 && (
              <text
                x={x + w1 / 2}
                y={baseY - hNormal + 20}
                textAnchor="middle"
                fill="#fff"
                fontSize={12}
                fontWeight={500}
              >
                {`${Math.round(segundos)}s`}
              </text>
            )}
          </>
        )}
        {temNp013 && (
          <>
            <rect
              x={x + w1}
              y={baseY - hNp013}
              width={w2}
              height={hNp013}
              fill="#7c3aed"
              rx={4}
              ry={4}
            />
            {segundosNp013 > 0 && (
              <text
                x={x + w1 + w2 / 2}
                y={baseY - hNp013 + 20}
                textAnchor="middle"
                fill="#fff"
                fontSize={12}
                fontWeight={500}
              >
                {`${Math.round(segundosNp013 / 60)}min`}
              </text>
            )}
          </>
        )}
      </g>
    )
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

  const resumoTempoNp013 = (() => {
    if (ultimoRegistroNp013Ms == null) return null
    const horasDesdeUltimoRegistro = Math.max(0, (agoraMs - ultimoRegistroNp013Ms) / 3600000)
    const percentualMeta = (horasDesdeUltimoRegistro / META_HORAS_NP013) * 100
    return `${Math.floor(horasDesdeUltimoRegistro)}h ${percentualMeta.toFixed(2)}%`
  })()

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

  const carregarDataMinima = useCallback(async () => {
    try {
      const todas = await buscarTodasSessoes()
      const datas = todas.map((s) => s.data).filter(Boolean)
      const ultimaSessaoNp013 = todas
        .filter((s) => s.tipo === 'np013')
        .map((s) => obterTimestampFimSessao(s))
        .filter((ts) => typeof ts === 'number')
        .reduce((maior, atual) => (atual > maior ? atual : maior), 0)
      if (datas.length === 0) {
        setDataMinima(dataHoje)
      } else {
        setDataMinima(datas.reduce((a, b) => (a < b ? a : b)))
      }
      setUltimoRegistroNp013Ms(ultimaSessaoNp013 || null)
    } catch {
      setDataMinima(dataHoje)
      setUltimoRegistroNp013Ms(null)
    }
  }, [dataHoje])

  useEffect(() => {
    carregarDataMinima()
  }, [carregarDataMinima])

  const ehHoje = diaSelecionado === dataHoje

  useEffect(() => {
    if (!ehHoje) {
      buscarStatusDia(diaSelecionado).then(setStatusAcompanhamento).catch(() => setStatusAcompanhamento('nao_acompanhado'))
    }
  }, [diaSelecionado, ehHoje])

  async function aoAlternarAcompanhamento() {
    if (ehHoje) return
    const proximo = statusAcompanhamento === 'registrado' ? 'nao_acompanhado' : 'registrado'
    try {
      await atualizarStatusDia(diaSelecionado, proximo)
      setStatusAcompanhamento(proximo)
    } catch (e) {
      console.error('Erro ao atualizar acompanhamento:', e)
    }
  }

  function obterDataMinima() {
    return dataMinima ?? dataHoje
  }

  function obterDataMaxima() {
    return dataHoje
  }

  function alterarDia(direcao) {
    const data = new Date(diaSelecionado + 'T12:00:00')
    data.setDate(data.getDate() + direcao)
    const novaData = data.toISOString().slice(0, 10)
    const min = obterDataMinima()
    const max = obterDataMaxima()
    if (direcao < 0 && novaData >= min) setDiaSelecionado(novaData)
    if (direcao > 0 && novaData <= max) setDiaSelecionado(novaData)
  }

  const podeAvancarDia = diaSelecionado < dataHoje
  const podeRetrocederDia = diaSelecionado > obterDataMinima()

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
        tipo: 'normal',
      })
      if (diaSelecionado === dataStr) {
        await recarregarSessoes()
      }
      await carregarDataMinima()
    } catch (e) {
      console.error('Erro ao registrar sessão:', e)
    }
  }

  async function aoPararCronometroNp013() {
    const resultado = pararNp013()
    if (!resultado || resultado.duracaoSegundos <= 0) return
    const dataInicio = resultado.dataInicio
    const dataStr = dataInicio.toISOString().slice(0, 10)
    const horaInicioStr = formatarHora(dataInicio)
    try {
      await registrarSessao({
        data: dataStr,
        horaInicio: horaInicioStr,
        duracaoSegundos: resultado.duracaoSegundos,
        tipo: 'np013',
      })
      setUltimoRegistroNp013Ms(dataInicio.getTime() + (resultado.duracaoSegundos * 1000))
      if (diaSelecionado === dataStr) {
        await recarregarSessoes()
      }
      await carregarDataMinima()
    } catch (e) {
      console.error('Erro ao registrar sessão NP013:', e)
    }
  }

  return (
    <div
      className="pagina-painel"
      style={corFundoCronometro ? { backgroundColor: corFundoCronometro } : undefined}
    >
      <header className="pagina-painel__cabecalho">
      </header>

      <section className="pagina-painel__grafico">
        <div className="pagina-painel__linha-dia">
          <button
            type="button"
            className="pagina-painel__seta-dia"
            onClick={() => alterarDia(-1)}
            disabled={!podeRetrocederDia}
            aria-label="Dia anterior"
          >
            ‹
          </button>
          <input
            id="select-dia"
            type="date"
            className="pagina-painel__select-dia"
            value={diaSelecionado}
            min={obterDataMinima()}
            max={obterDataMaxima()}
            onChange={(e) => setDiaSelecionado(e.target.value)}
          />
          {podeAvancarDia ? (
            <button
              type="button"
              className="pagina-painel__seta-dia"
              onClick={() => alterarDia(1)}
              aria-label="Próximo dia"
            >
              ›
            </button>
          ) : (
            <span
              role="button"
              tabIndex={0}
              className="pagina-painel__seta-dia pagina-painel__seta-dia--desabilitada"
              aria-label="Próximo dia"
              onClick={() => {
                if (ehHoje) {
                  refCliquesSetaProximoDesabilitada.current += 1
                  if (refCliquesSetaProximoDesabilitada.current >= 3) {
                    setNp013Oculto((v) => !v)
                    refCliquesSetaProximoDesabilitada.current = 0
                  }
                }
              }}
              onKeyDown={(e) => {
                if (ehHoje && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  refCliquesSetaProximoDesabilitada.current += 1
                  if (refCliquesSetaProximoDesabilitada.current >= 3) {
                    setNp013Oculto((v) => !v)
                    refCliquesSetaProximoDesabilitada.current = 0
                  }
                }
              }}
            >
              ›
            </span>
          )}
        </div>
        <div className="pagina-painel__grafico-container">
          {carregando ? (
            <p className="pagina-painel__carregando">Carregando...</p>
          ) : (
            <div ref={refContainerGrafico} className="pagina-painel__grafico-inner">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosGraficoBarras}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <defs>
                  {dadosGraficoBarras.map((entry) => {
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
                  ticks={ticksEixoY}
                  tick={{ fontSize: 11 }}
                  stroke="#666"
                  tickFormatter={formatarValorEixoY}
                  width={48}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload
                    const partes = []
                    if ((p.segundos ?? 0) > 0) partes.push(`Normal: ${formatarTooltipValor(p.segundos)}`)
                    if ((p.segundosNp013 ?? 0) > 0) partes.push(`NP013: ${Math.round(p.segundosNp013 / 60)} min`)
                    if (partes.length === 0) return null
                    return (
                      <div className="pagina-painel__tooltip">
                        <div>{p.hora}</div>
                        {partes.map((s) => (
                          <div key={s}>{s}</div>
                        ))}
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="segundosMax"
                  shape={renderBarraDupla}
                  isAnimationActive={false}
                />
              </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="pagina-painel__cronometro">
        {ehHoje ? (
          <div className="pagina-painel__cronometro-duplo">
            <div className="pagina-painel__cronometro-bloco">
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
                <Botao tipo="button" variante="primario" aoClicar={iniciar}>
                  Início
                </Botao>
              )}
            </div>
            <div
              className={`pagina-painel__cronometro-bloco${
                np013Oculto && !ativoNp013 ? ' pagina-painel__cronometro-bloco--somente-label' : ''
              }`}
            >
              {resumoTempoNp013 && (
                <span className="pagina-painel__tempo-meta-np013">{resumoTempoNp013}</span>
              )}
              {ativoNp013 ? (
                <div className="pagina-painel__cronometro-ativo">
                  <span className="pagina-painel__tempo" aria-live="polite">
                    {formatarDuracao(segundosNp013)}
                  </span>
                  <Botao tipo="button" variante="primario" aoClicar={aoPararCronometroNp013}>
                    Parar
                  </Botao>
                </div>
              ) : !np013Oculto ? (
                <Botao tipo="button" variante="np013" aoClicar={iniciarNp013}>
                  NP013
                </Botao>
              ) : null}
            </div>
          </div>
        ) : (
          <Botao
            tipo="button"
            variante={statusAcompanhamento === 'registrado' ? 'registrado' : 'nao-acompanhado'}
            aoClicar={aoAlternarAcompanhamento}
          >
            {statusAcompanhamento === 'registrado' ? 'Registrado' : 'Não acompanhado'}
          </Botao>
        )}
      </section>
    </div>
  )
}
