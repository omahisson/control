import { CampoTexto } from '../componentes/CampoTexto.jsx'
import { Botao } from '../componentes/Botao.jsx'

/**
 * Layout wireframe da tela de login.
 * Recebe valores e callbacks da página (lógica fica fora).
 */
export function LayoutLogin({
  email,
  senha,
  aoMudarEmail,
  aoMudarSenha,
  aoSubmeter,
  aoEsqueciSenha,
  carregando,
  erro,
}) {
  return (
    <div className="layout-login">
      <div className="layout-login__card">
        <h1 className="layout-login__titulo">Acesse sua conta no Control</h1>
        <p className="layout-login__subtitulo">Digite suas credenciais para continuar</p>

        <form
          className="layout-login__formulario"
          onSubmit={(e) => {
            e.preventDefault()
            aoSubmeter?.()
          }}
        >
          <CampoTexto
            rotulo="E-mail"
            tipo="email"
            valor={email}
            aoMudar={aoMudarEmail}
            id="login-email"
            desabilitado={carregando}
            placeholder="seu@email.com"
          />
          <CampoTexto
            rotulo="Senha"
            tipo="password"
            valor={senha}
            aoMudar={aoMudarSenha}
            id="login-senha"
            desabilitado={carregando}
            placeholder="Digite sua senha"
          />

          {erro && <p className="layout-login__erro" role="alert">{erro}</p>}

          <div className="layout-login__acoes">
            <Botao
              tipo="submit"
              desabilitado={carregando}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </Botao>
            <Botao
              tipo="button"
              variante="link"
              aoClicar={aoEsqueciSenha}
              desabilitado={carregando}
            >
              Esqueci minha senha
            </Botao>
          </div>
        </form>
      </div>
    </div>
  )
}
