#!/bin/bash

# CORES PARA SAÍDA DO TERMINAL
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # Sem Cor

echo -e "${CYAN}================================================================${NC}"
echo -e "${YELLOW}        INSTALADOR E COMPILADOR AUTOMATIZADO - HOSTINGER        ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e ""

# AUTO-DETECÇÃO DO NODE.JS E NPM NA HOSTINGER
export PATH=$PATH:/opt/alt/alt-nodejs22/root/usr/bin:/opt/alt/alt-nodejs20/root/usr/bin:/opt/alt/alt-nodejs18/root/usr/bin:/usr/local/bin:/usr/bin

if [ -d "$HOME/nodevenv" ]; then
    NODE_PATH=$(find "$HOME/nodevenv" -name "npm" -type f 2>/dev/null | head -n 1)
    if [ -n "$NODE_PATH" ]; then
        NODE_DIR=$(dirname "$NODE_PATH")
        export PATH=$NODE_DIR:$PATH
    fi
fi

if [ -d "$HOME/.nvm" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# 1. Copiar .env.example se não existir
if [ ! -f .env ]; then
    echo -e "${YELLOW}[!] Arquivo .env não encontrado. Criando a partir de .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}[✓] Arquivo .env criado. Por favor, edite-o com suas credenciais de produção.${NC}"
else
    echo -e "${GREEN}[✓] Arquivo .env de produção detectado.${NC}"
fi

# 2. Instalar dependências completas
echo -e "\n${YELLOW}[2/4] Limpando diretórios antigos e instalando dependências completas do npm...${NC}"
rm -rf node_modules package-lock.json
npm install --no-audit --no-fund
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✓] Dependências instaladas com sucesso.${NC}"
else
    echo -e "${RED}[✗] Falha ao instalar dependências. Verifique se o Node/NPM estão instalados.${NC}"
    exit 1
fi

# 3. Compilar aplicação
echo -e "\n${YELLOW}[3/4] Compilando Frontend (Vite) e Backend (esbuild)...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✓] Compilação de produção concluída com sucesso.${NC}"
else
    echo -e "${RED}[✗] Falha na compilação do projeto.${NC}"
    exit 1
fi

# 4. Reiniciar o servidor Node.js (Passenger)
echo -e "\n${YELLOW}[4/4] Solicitando reinicialização da aplicação Node.js (Passenger)...${NC}"
mkdir -p tmp
touch tmp/restart.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}[✓] Reinicialização agendada com sucesso! (tmp/restart.txt atualizado)${NC}"
else
    echo -e "${RED}[✗] Falha ao criar arquivo de reinicialização.${NC}"
fi

echo -e ""
echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}            DEPLOY CONCLUÍDO COM SUCESSO EM PRODUÇÃO!          ${NC}"
echo -e "${CYAN}================================================================${NC}"
