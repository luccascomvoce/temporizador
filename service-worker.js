// sw.js

// Nome do cache. Incremente a versão (ex: v2, v3) sempre que fizer alterações nos arquivos cacheados
const CACHE_NAME = 'timer-pwa-cache-v1';

// Lista de URLs para pré-cachear.
// Inclua todos os arquivos essenciais para o funcionamento offline do seu app.
const urlsToCache = [
  '/', // A página raiz do seu aplicativo
  '/index.html',
  '/styles.css',
  '/scripts.js',
  '/images/favicon.svg', // Seu favicon personalizado

  // Ícones do manifesto que o PWA Builder gerou
  // Certifique-se de que esses arquivos existam na pasta 'images'
  '/images/icon-48x48.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-144x144.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',

  // Recursos externos que seu app utiliza
  // Certifique-se de que estas URLs estão corretas e acessíveis
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.11.3/font/bootstrap-icons.min.css',
  'https://www.myinstants.com/media/sounds/repo-hansman-2.mp3' // Seu som de alarme
];

// Lista de hostnames permitidos para o Service Worker interceptar
// Adicione aqui qualquer outro domínio de onde seu PWA busca recursos
const HOSTNAME_WHITELIST = [
    self.location.hostname,
    'fonts.gstatic.com', // Se usar Google Fonts (embora não esteja no seu HTML atual)
    'fonts.googleapis.com', // Se usar Google Fonts (embora não esteja no seu HTML atual)
    'cdn.jsdelivr.net', // Para o Bootstrap Icons CDN
    'www.myinstants.com' // Para o arquivo de som
];

// Função utilitária para "cache-busting" para URLs do próprio domínio
// Isso ajuda a garantir que o navegador não use versões em cache antigas durante o desenvolvimento
const getFixedUrl = (req) => {
    var now = Date.now();
    var url = new URL(req.url);

    // Garante que a URL use o mesmo protocolo (http/https) que a localização atual
    url.protocol = self.location.protocol;

    // Adiciona um parâmetro de cache-bust para URLs do próprio domínio
    if (url.hostname === self.location.hostname) {
        url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;
    }
    return url.href;
};

/**
 * @Lifecycle Install
 * Ocorre quando o Service Worker é instalado.
 * Usa waitUntil() para garantir que todos os recursos essenciais sejam pré-cacheados.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache opened during install:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Força o novo SW a se ativar imediatamente
      .catch((error) => {
        console.error('[Service Worker] Failed to cache during install:', error);
      })
  );
});

/**
 * @Lifecycle Activate
 * Ocorre quando o Service Worker é ativado.
 * Limpa caches antigos e reivindica o controle dos clientes.
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // Apenas o cache atual deve ser mantido
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Old caches cleaned. Claiming clients...');
      return self.clients.claim(); // Assume o controle dos clientes imediatamente
    }).catch((error) => {
      console.error('[Service Worker] Activation failed:', error);
    })
  );
});

/**
 * @Functional Fetch
 * Intercepta todas as requisições de rede.
 * Implementa uma estratégia "stale-while-revalidate" para recursos na whitelist.
 */
self.addEventListener('fetch', (event) => {
    // Apenas intercepta requisições para domínios na WHITELIST
    if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) > -1) {
        const cached = caches.match(event.request); // Tenta encontrar no cache
        const fixedUrl = getFixedUrl(event.request); // Obtém a URL com cache-bust
        const fetched = fetch(fixedUrl, { cache: 'no-store' }); // Tenta buscar da rede (sem cache HTTP)
        const fetchedCopy = fetched.then(resp => resp.clone()); // Cria uma cópia da resposta para cachear

        // Responde com o que vier primeiro: cache ou rede.
        // Se a busca falhar (offline), espera pelo cache.
        // Se não houver cache, espera pela busca.
        event.respondWith(
            Promise.race([fetched.catch(_ => cached), cached])
                .then(resp => resp || fetched) // Retorna a resposta, ou a da rede se o cache não tiver
                .catch(_ => { /* Ignora quaisquer erros para evitar falhas na requisição */ })
        );

        // Atualiza o cache com a versão recém-buscada da rede (apenas se a resposta for OK)
        event.waitUntil(
            Promise.all([fetchedCopy, caches.open(CACHE_NAME)])
                .then(([response, cache]) => {
                    // Verifica se a resposta é válida e armazena no cache
                    if (response.ok) {
                        return cache.put(event.request, response);
                    }
                    return Promise.resolve(); // Não armazena se a resposta não for ok
                })
                .catch((error) => {
                    console.error('[Service Worker] Failed to update cache:', error);
                })
        );
    }
});