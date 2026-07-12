# Guia de Implantação e Autoinstalação na Hostinger 🚀

Este projeto está totalmente configurado para compilar e rodar em produção no ambiente da **Hostinger** para o domínio `https://candidatos.mastervisionmarketing.com/`.

Para facilitar ao máximo o seu trabalho de sincronização do GitHub com a Hostinger, criamos um **Console de Autoinstalação e Compilação Automatizada** (escrito em PHP para compatibilidade nativa com o painel da Hostinger).

---

## 🛠️ Como Funciona o Fluxo de Deploy

1. **Atualizações via Git**: Quando você faz modificações no código, a integração GIT da Hostinger baixa automaticamente as últimas mudanças do seu repositório no GitHub para o diretório `public_html`.
2. **Autoinstalação e Compilação**: Como o servidor da Hostinger não roda o `npm run build` sozinho a cada pull, você acessa o painel de deploy seguro pelo navegador para compilar o app em segundos.
3. **Reinicialização Automática**: O script notifica o servidor Node.js (via Passenger) para atualizar a aplicação sem que você precise reiniciar nada manualmente.

---

## 🚀 Passo a Passo para Deploy e Instalação

### Passo 1: Acessar o Console de Deploy
Acesse o seguinte link em seu navegador:
👉 [https://candidatos.mastervisionmarketing.com/deploy.php?token=mastervision](https://candidatos.mastervisionmarketing.com/deploy.php?token=mastervision)

*(Caso queira alterar a senha de segurança de deploy, basta abrir o arquivo `deploy.php` e alterar a constante `SECURITY_TOKEN` na linha 14).*

---

### Passo 2: Executar a Instalação e Compilação
No painel visual que se abrirá no seu navegador, clique no botão amarelo:
👉 **"🚀 Iniciar Instalação e Compilação"**

O terminal em tempo real executará de forma sequencial e totalmente automatizada:
1. `npm install` — Instalação limpa e segura de todas as dependências do projeto.
2. `npm run build` — Compilação do frontend React (Vite) na pasta `dist/` e do backend Express em um único arquivo de produção autocontido em `dist/server.cjs`.
3. `touch tmp/restart.txt` — Sinaliza para o servidor Node.js da Hostinger reiniciar instantaneamente com a nova versão atualizada.

---

## 🔑 Variáveis de Ambiente (.env) na Hostinger

Para garantir o funcionamento correto de toda a sincronização e do banco de dados MySQL de produção da Hostinger (`u844537895_candidatos`), configure o arquivo `.env` no painel da Hostinger ou crie-o via SSH com as seguintes chaves:

```env
# Conexão com o Banco de Dados MySQL da Hostinger
DB_HOST=localhost
DB_USER=u844537895_candidatos
DB_PASSWORD=SUA_SENHA_AQUI
DB_NAME=u844537895_candidatos
DB_PORT=3306

# Chave da API Gemini para os Relatórios de Inteligência Artificial
GEMINI_API_KEY=SUA_CHAVE_GEMINI_AQUI
```

---

## 📦 Como Importar os Dados Iniciais no phpMyAdmin

Se preferir realizar a sincronização offline, você pode baixar o arquivo SQL completo e atualizado diretamente na aba **"Integração DB"** do aplicativo ou através do próprio console `deploy.php`.

1. Acesse o **phpMyAdmin** na Hostinger.
2. Selecione o banco de dados `u844537895_candidatos`.
3. Vá em **Importar**, envie o arquivo `database.sql` gerado pelo sistema e clique em **Executar**.

Tudo pronto! Seus candidatos, relatórios, prazos e as atualizações da região de Chapecó estarão sincronizados e disponíveis imediatamente.
