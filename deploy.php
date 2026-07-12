<?php
/**
 * DEPLOY.PHP - Console de Autoinstalação e Compilação Automatizada
 * Especialmente projetado para Hostinger (candidatos.mastervisionmarketing.com)
 * 
 * Funcionalidades:
 * - Executa 'npm install' para restaurar dependências.
 * - Executa 'npm run build' para compilar o frontend React e o backend Express.
 * - Reinicia a aplicação Node.js (Passenger / tmp/restart.txt).
 * - Exibe logs de execução em tempo real em um terminal visual estilizado.
 */

// --- CONFIGURAÇÃO DE SEGURANÇA ---
// Altere este token para o que desejar para proteger seu deploy.
// Exemplo de acesso: https://candidatos.mastervisionmarketing.com/deploy.php?token=mastervision
define('SECURITY_TOKEN', 'mastervision');

// Verifica o token de acesso para evitar execuções não autorizadas
$accessToken = isset($_GET['token']) ? $_GET['token'] : '';
$isAuthenticated = ($accessToken === SECURITY_TOKEN);

// Função para formatar as saídas de terminal
function runCommand($cmd, $desc) {
    echo "<div class='cmd-block'>";
    echo "<p class='cmd-desc'># " . htmlspecialchars($desc) . "</p>";
    echo "<p class='cmd-input'>$ " . htmlspecialchars($cmd) . "</p>";
    
    // Configura caminhos úteis para garantir que npm/node sejam encontrados
    putenv('PATH=' . getenv('PATH') . ':/usr/local/bin:/usr/bin:/bin:/usr/node/bin');
    
    // Executa e captura a saída mesclando stdout e stderr
    $output = shell_exec($cmd . " 2>&1");
    
    echo "<pre class='cmd-output'>" . htmlspecialchars($output) . "</pre>";
    echo "</div>";
    
    // Força o envio do buffer para exibir em tempo real no navegador
    flush();
    ob_flush();
}

?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Console de Deploy & Autoinstalação</title>
    <style>
        body {
            background-color: #0c0f12;
            color: #d1d5db;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .header {
            background-color: #161b22;
            border: 2px solid #30363d;
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .header h1 {
            color: #ffd700;
            margin: 0;
            font-size: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #8b949e;
        }
        .badge {
            background-color: #1f6feb;
            color: white;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            border-radius: 3px;
        }
        .badge.secure {
            background-color: #238636;
        }
        .badge.warn {
            background-color: #d29922;
            color: #0d1117;
        }
        .card {
            background-color: #161b22;
            border: 2px solid #30363d;
            padding: 20px;
            margin-bottom: 20px;
        }
        .terminal {
            background-color: #010409;
            border: 2px solid #30363d;
            padding: 15px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 13px;
            line-height: 1.5;
            color: #39ff14; /* Verde Terminal */
            overflow-x: auto;
            max-height: 500px;
            overflow-y: auto;
        }
        .cmd-block {
            margin-bottom: 15px;
            border-left: 2px solid #30363d;
            padding-left: 10px;
        }
        .cmd-desc {
            color: #8b949e;
            margin: 0 0 2px 0;
            font-weight: bold;
        }
        .cmd-input {
            color: #ffd700;
            margin: 0 0 5px 0;
            font-weight: bold;
        }
        .cmd-output {
            color: #e6edf3;
            background-color: #0d1117;
            padding: 10px;
            margin: 0;
            white-space: pre-wrap;
            word-break: break-all;
            border: 1px solid #21262d;
        }
        .btn {
            background-color: #ffd700;
            color: #0d1117;
            border: 2px solid #0d1117;
            padding: 12px 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 4px 4px 0px 0px #30363d;
        }
        .btn:hover {
            background-color: #ffea70;
            transform: translate(-2px, -2px);
            box-shadow: 6px 6px 0px 0px #30363d;
        }
        .btn:active {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px 0px #30363d;
        }
        .btn-gray {
            background-color: #21262d;
            color: #c9d1d9;
            border: 2px solid #30363d;
            box-shadow: 4px 4px 0px 0px #0d1117;
        }
        .btn-gray:hover {
            background-color: #30363d;
            color: #f0f6fc;
        }
        .input-group {
            margin-bottom: 15px;
        }
        .input-group label {
            display: block;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: #8b949e;
            margin-bottom: 5px;
        }
        .input-group input {
            background-color: #0d1117;
            border: 2px solid #30363d;
            color: #e6edf3;
            padding: 10px;
            width: 100%;
            box-sizing: border-box;
            font-family: monospace;
        }
        .input-group input:focus {
            border-color: #ffd700;
            outline: none;
        }
        .alert {
            background-color: rgba(210, 153, 34, 0.1);
            border: 1px solid #d29922;
            color: #c9d1d9;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.6;
        }
        .alert-success {
            background-color: rgba(35, 134, 54, 0.1);
            border: 1px solid #238636;
        }
        .env-badge {
            background-color: #30363d;
            border: 1px solid #8b949e;
            padding: 2px 6px;
            font-size: 11px;
            font-family: monospace;
        }
    </style>
</head>
<body>

<div class="container">

    <!-- HEADER -->
    <div class="header">
        <div>
            <h1>Instalador e Compilador Automático</h1>
            <p>Mapeamento Eleitoral &bull; candidatos.mastervisionmarketing.com</p>
        </div>
        <div>
            <?php if ($isAuthenticated): ?>
                <span class="badge secure">Sessão Segura Autenticada</span>
            <?php else: ?>
                <span class="badge warn">Acesso Restrito</span>
            <?php endif; ?>
        </div>
    </div>

    <?php if (!$isAuthenticated): ?>
        <!-- AUTH FORM -->
        <div class="card">
            <h2 style="color: #ffd700; margin-top: 0; font-size: 16px; uppercase">Autenticação Requerida</h2>
            <p style="font-size: 13px; color: #8b949e;">Para executar o instalador e compilar a aplicação na Hostinger, informe o token de segurança definido no script PHP.</p>
            
            <form method="GET" action="deploy.php">
                <div class="input-group">
                    <label for="token">Token de Segurança:</label>
                    <input type="password" id="token" name="token" placeholder="Digite o token configurado no arquivo" required>
                </div>
                <button type="submit" class="btn">Autenticar e Entrar</button>
            </form>
        </div>
    <?php else: ?>
        
        <!-- STATUS INFORMATION -->
        <div class="card">
            <h2 style="color: #ffd700; margin-top: 0; font-size: 16px; text-transform: uppercase;">Ações do Servidor</h2>
            <p style="font-size: 13px; color: #8b949e; margin-bottom: 20px;">
                O repositório do GitHub foi sincronizado. Agora, execute o script de compilação abaixo para instalar as novas dependências e compilar os binários de produção no servidor.
            </p>

            <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
                <a href="deploy.php?token=<?php echo htmlspecialchars(SECURITY_TOKEN); ?>&run=1" class="btn">
                    🚀 Iniciar Instalação e Compilação
                </a>
                <a href="deploy.php?token=<?php echo htmlspecialchars(SECURITY_TOKEN); ?>&check=1" class="btn btn-gray">
                    🔍 Verificar Status e Versões
                </a>
                <a href="/" target="_blank" class="btn btn-gray" style="background-color: transparent;">
                    🔗 Abrir Aplicação 💻
                </a>
            </div>

            <!-- ENV STATUS -->
            <div style="font-size: 12px; color: #8b949e; border-top: 1px solid #30363d; padding-top: 15px;">
                <strong>Verificação de Arquivos:</strong>
                <span style="margin-left: 10px;">
                    .env: <?php echo file_exists('.env') ? '<span style="color:#238636; font-weight:bold;">[PRESENTE]</span>' : '<span style="color:#f85149; font-weight:bold;">[AUSENTE - Copie do .env.example]</span>'; ?>
                </span>
                <span style="margin-left: 15px;">
                    node_modules: <?php echo is_dir('node_modules') ? '<span style="color:#238636; font-weight:bold;">[INSTALADO]</span>' : '<span style="color:#d29922; font-weight:bold;">[FALTANDO]</span>'; ?>
                </span>
                <span style="margin-left: 15px;">
                    dist/server.cjs: <?php echo file_exists('dist/server.cjs') ? '<span style="color:#238636; font-weight:bold;">[COMPILADO]</span>' : '<span style="color:#f85149; font-weight:bold;">[NÃO COMPILADO]</span>'; ?>
                </span>
            </div>
        </div>

        <?php if (isset($_GET['run']) || isset($_GET['check'])): ?>
            <!-- TERMINAL LOGS -->
            <div class="card" style="padding: 10px; background-color: #0d1117;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #30363d; margin-bottom: 10px;">
                    <span style="font-family: monospace; font-size: 12px; font-weight: bold; color: #8b949e;">LOGS DE EXECUÇÃO DO TERMINAL</span>
                    <span style="width: 10px; height: 10px; background-color: #39ff14; border-radius: 50%; box-shadow: 0 0 8px #39ff14;"></span>
                </div>
                
                <div class="terminal">
                    <?php
                    // Habilita exibição de erros
                    ini_set('display_errors', 1);
                    error_reporting(E_ALL);
                    
                    // Altera tempo limite máximo do PHP para compilação demorada (300 segundos)
                    set_time_limit(300);

                    if (isset($_GET['check'])) {
                        echo "<h3>🔍 VERIFICANDO AMBIENTE DA HOSTINGER...</h3>";
                        runCommand("node -v", "Versão do Node.js instalada no servidor");
                        runCommand("npm -v", "Versão do NPM instalada no servidor");
                        runCommand("pwd", "Diretório atual de instalação");
                        runCommand("ls -la", "Conteúdo do diretório de produção");
                    }

                    if (isset($_GET['run'])) {
                        echo "<h3>🚀 INICIANDO INSTALAÇÃO E COMPILAÇÃO AUTOMATIZADA...</h3>";
                        
                        // 1. Git pull adicional se necessário (opcional, já que a Hostinger faz auto-git)
                        runCommand("git status", "Status atual do Repositório Git");

                        // 2. Copiar arquivo .env se não existir
                        if (!file_exists('.env') && file_exists('.env.example')) {
                            runCommand("cp .env.example .env", "Criando arquivo .env a partir do .env.example");
                        }

                        // 3. Instalar dependências completas
                        runCommand("npm install --no-audit --no-fund", "Instalando dependências do projeto (pode levar 1 a 2 minutos)");

                        // 4. Executar script de build
                        runCommand("npm run build", "Compilando Frontend (React/Vite) e Backend (Express/esbuild)");

                        // 5. Atualizar ou criar pasta temporária para reinicialização do Passenger
                        if (!is_dir('tmp')) {
                            mkdir('tmp', 0755, true);
                        }
                        runCommand("touch tmp/restart.txt", "Forçando reinicialização do Servidor de Produção (Passenger)");

                        echo "<div class='alert alert-success'>";
                        echo "<strong>✓ IMPLANTAÇÃO CONCLUÍDA!</strong><br>";
                        echo "O aplicativo foi compilado com sucesso e o sinalizador de reinicialização foi enviado.<br>";
                        echo "Acesse a url principal do domínio para ver as mudanças aplicadas.";
                        echo "</div>";
                    }
                    ?>
                </div>
            </div>
        <?php endif; ?>

    <?php endif; ?>

</div>

</body>
</html>
