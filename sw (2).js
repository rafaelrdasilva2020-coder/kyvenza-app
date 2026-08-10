// =========================================================
// KYVENZA — Service Worker
// IMPORTANTE: sempre que publicar uma atualização visual/funcional,
// mude o número da versão abaixo (CACHE_VERSION). Isso força os
// aparelhos dos alunos a buscarem os arquivos novos em vez de
// continuarem servindo a versão antiga do cache.
// =========================================================
const CACHE_VERSION = "kyvenza-v15";

const ARQUIVOS_ESTATICOS = [
  "index.html",
  "entrar.html",
  "baixar-app.html",
  "home.html",
  "questionario.html",
  "treino.html",
  "evolucao.html",
  "bloqueado.html",
  "obrigado.html",
  "css/kyvenza.css",
  "js/supabase-client.js",
  "manifest.json",
  "assets/logo.png",
  "assets/icons/favicon.ico",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-180.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ARQUIVOS_ESTATICOS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_VERSION)
          .map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

// Network-first para dados (Supabase), cache-first só para os arquivos estáticos do app
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cacheia chamadas à API do Supabase (sempre precisa de dado fresco)
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      return respostaCache || fetch(event.request);
    })
  );
});
