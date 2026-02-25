import { useNavigate } from 'react-router-dom'
import { useFormularioLogin } from '../../logica/hooks/useFormularioLogin.js'
import { LayoutLogin } from '../../ui/layout/LayoutLogin.jsx'

export function PaginaLogin() {
  const navegar = useNavigate()
  const {
    email,
    senha,
    carregando,
    erro,
    atualizarCampo,
    submeter,
  } = useFormularioLogin()

  function aoSucessoLogin() {
    navegar('/inicio')
  }

  function aoEsqueciSenha() {
    // Wireframe: apenas placeholder para fluxo "esqueci minha senha"
    alert('Fluxo "Esqueci minha senha" será implementado aqui.')
  }

  return (
    <LayoutLogin
      email={email}
      senha={senha}
      aoMudarEmail={(v) => atualizarCampo('email', v)}
      aoMudarSenha={(v) => atualizarCampo('senha', v)}
      aoSubmeter={() => submeter(aoSucessoLogin)}
      aoEsqueciSenha={aoEsqueciSenha}
      carregando={carregando}
      erro={erro}
    />
  )
}
