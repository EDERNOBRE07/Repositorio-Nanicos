// server.js
// Proxy para iniciar o servidor de produção compilado em dist/server.cjs
// Compatível com ambientes CommonJS e ES Modules da Hostinger

try {
  if (typeof require !== 'undefined') {
    // Ambiente CommonJS
    require('./dist/server.cjs');
  } else {
    // Ambiente ES Modules (importação dinâmica)
    import('./dist/server.cjs').catch(err => {
      console.error("Erro no import dinâmico do servidor compilado:", err);
    });
  }
} catch (e) {
  console.error("Erro crítico ao inicializar o proxy do servidor (server.js):", e);
}
