import { requisicao } from './api.js'

/**
 * Verifica credenciais contra o recurso usuarios do json-server.
 * Em produção, isso seria um endpoint de login com token/sessão.
 */
export async function verificarCredenciais(email, senha) {
  const usuarios = await requisicao('/usuarios')
  const usuarioEncontrado = usuarios.find(
    (u) => u.email === email && u.senha === senha
  )
  return usuarioEncontrado ?? null
}
