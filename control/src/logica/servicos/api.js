/**
 * Configuração base para chamadas ao json-server.
 * No dev, o Vite faz proxy de /api para localhost:3032.
 */
const URL_BASE_API = import.meta.env.DEV
  ? '/api'
  : ''
  
export function obterUrlBase() {
  return URL_BASE_API
}

export async function requisicao(endereco, opcoes = {}) {
  const caminho = endereco.startsWith('/') ? endereco : `/${endereco}`
  const url = `${URL_BASE_API}${caminho}`
  const resposta = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opcoes.headers },
    ...opcoes,
  })
  if (!resposta.ok) {
    throw new Error(`Erro na requisição: ${resposta.status}`)
  }
  return resposta.json()
}
