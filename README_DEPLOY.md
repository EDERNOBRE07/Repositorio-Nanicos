# Guia de Implantação e Autoinstalação na Hostinger 🚀

Este projeto está totalmente configurado para compilar e rodar em produção no ambiente da **Hostinger** para o domínio `https://candidatos.mastervisionmarketing.com/`.

---

## 🛠️ Como Resolver o Erro `-bash: npm: command not found` na Hostinger

Se ao tentar executar comandos no terminal SSH da Hostinger você recebeu a mensagem:
```bash
-bash: npm: command not found
```
Isso acontece porque o Node.js e o NPM na Hostinger ficam em caminhos específicos (como `/opt/alt/alt-nodejs*/root/usr/bin` ou `~/nodevenv/`).

### Solução 1: Utilizar o Script Autoconfigurado via SSH (Recomendado)
Criamos um script que localiza e carrega o Node.js/NPM automaticamente. No terminal SSH, basta rodar:

```bash
cd domains/candidatos.mastervisionmarketing.com/public_html && bash deploy.sh
```

### Solução 2: Executar com Export do PATH no SSH
Se desejar rodar em uma única linha no SSH, inclua o `PATH` do Node da Hostinger antes do comando:

```bash
cd domains/candidatos.mastervisionmarketing.com/public_html && export PATH=$PATH:/opt/alt/alt-nodejs20/root/usr/bin:/usr/local/bin && npm run build && mkdir -p tmp && touch tmp/restart.txt
```

---

## 🚀 Método Web: Painel de Autoinstalação e Compilação Automática

Você também pode realizar todo o deploy pelo navegador sem usar terminal SSH:

### Passo 1: Acessar o Console Web
Acesse o seguinte link em seu navegador:
👉 [https://candidatos.mastervisionmarketing.com/deploy.php?token=mastervision](https://candidatos.mastervisionmarketing.com/deploy.php?token=mastervision)

*(Caso queira alterar a senha de segurança de deploy, basta abrir o arquivo `deploy.php` e alterar a constante `SECURITY_TOKEN` na linha 16).*

### Passo 2: Executar a Instalação e Compilação
No painel visual que se abrirá no seu navegador, clique no botão amarelo:
👉 **"🚀 Iniciar Instalação e Compilação"**

O terminal em tempo real executará de forma sequencial e totalmente automatizada:
1. `npm install` — Instalação limpa de todas as dependências do projeto.
2. `npm run build` — Compilação do frontend React (Vite) na pasta `dist/` e do backend Express em `dist/server.cjs`.
3. `touch tmp/restart.txt` — Sinaliza para o servidor Node.js (Passenger) reiniciar instantaneamente.

---

## 🔑 Variáveis de Ambiente (.env) na Hostinger

Configure o arquivo `.env` no painel da Hostinger ou via SSH com as seguintes chaves:

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

## 📦 Importação dos Dados Iniciais no phpMyAdmin

1. Acesse o **phpMyAdmin** na Hostinger.
2. Selecione o banco de dados `u844537895_candidatos`.
3. Vá em **Importar**, envie o arquivo `database.sql` e clique em **Executar**.

