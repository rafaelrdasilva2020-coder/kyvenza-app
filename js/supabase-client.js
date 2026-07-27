// =========================================================
// KYVENZA — Configuração compartilhada do Supabase
// =========================================================
// Preencha com os dados do SEU projeto Supabase antes de publicar.
// A "anon key" é pública por natureza (protegida pelas policies de RLS),
// então pode ficar no código do app sem problema.
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA_ANON_KEY_AQUI";

// Carregado via <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Garante que existe uma sessão ativa. Se não houver, redireciona pro login.
 * Retorna o usuário autenticado.
 */
async function exigirSessao() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session.user;
}

/**
 * Busca o registro do aluno correspondente ao usuário logado.
 */
async function buscarAluno(authUserId) {
  const { data, error } = await supabase
    .from("alunos")
    .select("id, nome, email, status, plano")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar aluno:", error);
    return null;
  }
  return data;
}

/**
 * Roteamento padrão: exige login, busca o aluno e redireciona
 * para a tela de bloqueio se a assinatura não estiver ativa.
 * Use no topo de home.html, questionario.html e treino.html.
 */
async function protegerPaginaDoAluno() {
  const user = await exigirSessao();
  if (!user) return null;

  let aluno = await buscarAluno(user.id);

  if (!aluno) {
    // Pode ser o primeiro login de um aluno cadastrado manualmente (ou via
    // webhook do Mercado Pago) que ainda não tem auth_user_id vinculado.
    // Tenta vincular pelo e-mail via Edge Function (segura, respeita RLS).
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${SUPABASE_URL}/functions/v1/vincular-aluno`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      aluno = await buscarAluno(user.id);
    } catch (err) {
      console.error("Erro ao tentar vincular aluno:", err);
    }
  }

  if (!aluno) {
    // Ainda não encontrado: realmente não é assinante (ou pagamento não processado ainda)
    window.location.href = "bloqueado.html";
    return null;
  }

  if (aluno.status !== "ativo") {
    window.location.href = "bloqueado.html";
    return null;
  }

  return aluno;
}

async function sair() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// Registra o service worker do PWA (cache dos arquivos estáticos)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.error("Erro ao registrar SW:", err));
  });
}
