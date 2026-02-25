import { useState, useCallback } from 'react'
import { verificarCredenciais } from '../servicos/servicoAutenticacao.js'

const VALORES_INICIAIS = { email: '', senha: '' }

export function useFormularioLogin() {
  const [valores, setValores] = useState(VALORES_INICIAIS)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  const atualizarCampo = useCallback((nomeCampo, valor) => {
    setValores((prev) => ({ ...prev, [nomeCampo]: valor }))
    setErro(null)
  }, [])

  const submeter = useCallback(
    async (aoSucesso) => {
      setErro(null)
      setCarregando(true)
      try {
        const usuario = await verificarCredenciais(valores.email, valores.senha)
        if (usuario) {
          aoSucesso?.(usuario)
        } else {
          setErro('E-mail ou senha incorretos.')
        }
      } catch (e) {
        setErro('Não foi possível conectar. Verifique se o servidor está rodando na porta 3032.')
      } finally {
        setCarregando(false)
      }
    },
    [valores.email, valores.senha]
  )

  const limpar = useCallback(() => {
    setValores(VALORES_INICIAIS)
    setErro(null)
  }, [])

  return {
    email: valores.email,
    senha: valores.senha,
    carregando,
    erro,
    atualizarCampo,
    submeter,
    limpar,
  }
}
