export function CampoTexto({ rotulo, tipo = 'text', valor, aoMudar, id, desabilitado, placeholder }) {
  const idCampo = id ?? `campo-${rotulo?.toLowerCase().replace(/\s/g, '-') ?? 'texto'}`
  return (
    <div className="campo-texto">
      {rotulo && (
        <label htmlFor={idCampo} className="campo-texto__rotulo">
          {rotulo}
        </label>
      )}
      <input
        id={idCampo}
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar?.(e.target.value)}
        disabled={desabilitado}
        placeholder={placeholder}
        className="campo-texto__input"
      />
    </div>
  )
}
