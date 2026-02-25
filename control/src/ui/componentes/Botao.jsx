export function Botao({ tipo = 'button', children: filhos, aoClicar, desabilitado, variante = 'primario' }) {
  return (
    <button
      type={tipo}
      onClick={aoClicar}
      disabled={desabilitado}
      className={`botao botao--${variante}`}
    >
      {filhos}
    </button>
  )
}
