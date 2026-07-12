<?php
/**
 * API Backend PHP para o Gerenciador Eleitoral
 * Substitui o servidor Express (Node.js) em ambientes de hospedagem compartilhada como Hostinger.
 */

// Habilitar CORS para permitir o desenvolvimento híbrido e acesso remoto seguro
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

header("Content-Type: application/json; charset=UTF-8");

// Definir fuso horário padrão
date_default_timezone_get();

// Função para ler o arquivo .env
function loadEnv($path) {
    if (!file_exists($path)) {
        return [];
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $name = trim($parts[0]);
            $value = trim($parts[1]);
            // Remover aspas em volta do valor se houver
            if (preg_match('/^"(.*)"$/', $value, $matches)) {
                $value = $matches[1];
            } elseif (preg_match("/^'(.*)'$/", $value, $matches)) {
                $value = $matches[1];
            }
            $env[$name] = $value;
        }
    }
    return $env;
}

$env = loadEnv(__DIR__ . '/.env');

// Configuração do Banco de Dados obtida do .env ou do ambiente
$db_host = $env['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
$db_user = $env['DB_USER'] ?? getenv('DB_USER') ?: 'u844537895_candidatos';
$db_pass = $env['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: 'Shift2026';
$db_name = $env['DB_NAME'] ?? getenv('DB_NAME') ?: 'u844537895_candidatos';

// Tentar conectar via PDO
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => "Falha de conexão com o MySQL na Hostinger: " . $e->getMessage(),
        "config" => [
            "host" => $db_host,
            "database" => $db_name,
            "user" => $db_user
        ]
    ]);
    exit;
}

// Obter a rota atual (mapeada pelo .htaccess)
$route = $_GET['route'] ?? '';
$route = rtrim($route, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Função para recalcular prazos eleitorais (equivalente à do Node.js)
function updateDaysRemaining($deadlines) {
    // Data de referência fixada idêntica à do Express
    $currentDate = new DateTime("2026-07-08T11:16:28-07:00");
    $updated = [];
    foreach ($deadlines as $dl) {
        $targetDate = new DateTime($dl['date'] . "T23:59:59-07:00");
        $diff = $currentDate->diff($targetDate);
        
        // Obter número de dias com sinal
        $diffDays = (int)$diff->format("%r%a");
        $daysRemaining = $diffDays < 0 ? 0 : $diffDays;
        
        $updatedStatus = $dl['status'];
        if ($daysRemaining === 0) {
            $updatedStatus = "Concluído";
        } elseif ($daysRemaining <= 15) {
            $updatedStatus = "Crítico";
        } elseif ($daysRemaining <= 30) {
            $updatedStatus = "Crítico";
        } else {
            $updatedStatus = "Pendente";
        }
        
        $dl['daysRemaining'] = $daysRemaining;
        $dl['status'] = $dl['status'] === "Concluído" ? "Concluído" : $updatedStatus;
        $updated[] = $dl;
    }
    return $updated;
}

// -----------------------------------------------------------------
// 1. GET ALL DATA (dashboard)
// -----------------------------------------------------------------
if ($route === 'dashboard' && $method === 'GET') {
    try {
        // Buscar candidatos
        $stmt = $pdo->query("SELECT * FROM candidates ORDER BY id ASC");
        $candidates = $stmt->fetchAll();
        foreach ($candidates as &$cand) {
            $cand['keyContacts'] = json_decode($cand['keyContacts'] ?: '[]', true) ?: [];
            $cand['publications'] = json_decode($cand['publications'] ?: '[]', true) ?: [];
            $cand['mappings'] = json_decode($cand['mappings'] ?: '[]', true) ?: [];
        }
        
        // Buscar prazos
        $stmt = $pdo->query("SELECT * FROM deadlines");
        $rawDeadlines = $stmt->fetchAll();
        $deadlines = updateDaysRemaining($rawDeadlines);
        
        // Buscar relatórios
        $stmt = $pdo->query("SELECT * FROM reports ORDER BY createdAt DESC");
        $reports = $stmt->fetchAll();
        
        echo json_encode([
            "candidates" => $candidates,
            "deadlines" => $deadlines,
            "reports" => $reports
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao obter dados do painel: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 2. GET CANDIDATES
// -----------------------------------------------------------------
if ($route === 'candidates' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM candidates ORDER BY id ASC");
        $candidates = $stmt->fetchAll();
        foreach ($candidates as &$cand) {
            $cand['keyContacts'] = json_decode($cand['keyContacts'] ?: '[]', true) ?: [];
            $cand['publications'] = json_decode($cand['publications'] ?: '[]', true) ?: [];
            $cand['mappings'] = json_decode($cand['mappings'] ?: '[]', true) ?: [];
        }
        echo json_encode($candidates);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao obter candidatos: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 3. POST CANDIDATES (Salvar / Criar)
// -----------------------------------------------------------------
if ($route === 'candidates' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Corpo da requisição inválido"]);
            exit;
        }
        
        $id = $input['id'] ?? '';
        if (empty($id)) {
            $id = "cand-" . round(microtime(true) * 1000);
        }
        
        $name = $input['name'] ?? '';
        $number = $input['number'] ?? '';
        $urnName = $input['urnName'] ?? '';
        $whatsapp = $input['whatsapp'] ?? '';
        $instagram = $input['instagram'] ?? '';
        $facebook = $input['facebook'] ?? '';
        $email = $input['email'] ?? '';
        $party = $input['party'] ?? '';
        $status = $input['status'] ?? '';
        $photoUrl = $input['photoUrl'] ?? '';
        $mediaCoordinatorName = $input['mediaCoordinatorName'] ?? '';
        $mediaCoordinatorWhatsApp = $input['mediaCoordinatorWhatsApp'] ?? '';
        $professionalBackground = $input['professionalBackground'] ?? '';
        $areasOfInterest = $input['areasOfInterest'] ?? '';
        $teams = $input['teams'] ?? '';
        $family = $input['family'] ?? '';
        $groups = $input['groups'] ?? '';
        $trajectory = $input['trajectory'] ?? '';
        $politicalFlags = $input['politicalFlags'] ?? '';
        
        $keyContacts = isset($input['keyContacts']) ? json_encode($input['keyContacts'], JSON_UNESCAPED_UNICODE) : '[]';
        $publications = isset($input['publications']) ? json_encode($input['publications'], JSON_UNESCAPED_UNICODE) : '[]';
        $mappings = isset($input['mappings']) ? json_encode($input['mappings'], JSON_UNESCAPED_UNICODE) : '[]';
        $lastSaved = date('Y-m-d\TH:i:s.v\Z');
        
        // Verificar existência
        $stmt = $pdo->prepare("SELECT id FROM candidates WHERE id = ?");
        $stmt->execute([$id]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $sql = "UPDATE candidates SET 
                name = ?, number = ?, urnName = ?, whatsapp = ?, instagram = ?, facebook = ?, email = ?,
                party = ?, status = ?, photoUrl = ?, mediaCoordinatorName = ?, mediaCoordinatorWhatsApp = ?,
                professionalBackground = ?, areasOfInterest = ?, teams = ?, family = ?, groups = ?,
                trajectory = ?, politicalFlags = ?, keyContacts = ?, publications = ?, mappings = ?, lastSaved = ?
                WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $name, $number, $urnName, $whatsapp, $instagram, $facebook, $email,
                $party, $status, $photoUrl, $mediaCoordinatorName, $mediaCoordinatorWhatsApp,
                $professionalBackground, $areasOfInterest, $teams, $family, $groups,
                $trajectory, $politicalFlags, $keyContacts, $publications, $mappings, $lastSaved, $id
            ]);
        } else {
            $sql = "INSERT INTO candidates (
                id, name, number, urnName, whatsapp, instagram, facebook, email, party, status, photoUrl,
                mediaCoordinatorName, mediaCoordinatorWhatsApp, professionalBackground, areasOfInterest,
                teams, family, groups, trajectory, politicalFlags, keyContacts, publications, mappings, lastSaved
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $id, $name, $number, $urnName, $whatsapp, $instagram, $facebook, $email,
                $party, $status, $photoUrl, $mediaCoordinatorName, $mediaCoordinatorWhatsApp,
                $professionalBackground, $areasOfInterest, $teams, $family, $groups,
                $trajectory, $politicalFlags, $keyContacts, $publications, $mappings, $lastSaved
            ]);
        }
        
        // Retornar o candidato recém-salvo devidamente formatado
        $stmt = $pdo->prepare("SELECT * FROM candidates WHERE id = ?");
        $stmt->execute([$id]);
        $cand = $stmt->fetch();
        $cand['keyContacts'] = json_decode($cand['keyContacts'] ?: '[]', true) ?: [];
        $cand['publications'] = json_decode($cand['publications'] ?: '[]', true) ?: [];
        $cand['mappings'] = json_decode($cand['mappings'] ?: '[]', true) ?: [];
        
        echo json_encode(["success" => true, "candidate" => $cand]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erro ao salvar candidato: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 4. DELETE CANDIDATES (Deletar)
// -----------------------------------------------------------------
if (preg_match('/^candidates\/([^\/]+)$/', $route, $matches) && $method === 'DELETE') {
    try {
        $id = $matches[1];
        $stmt = $pdo->prepare("DELETE FROM candidates WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erro ao deletar candidato: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 5. POST DEADLINES
// -----------------------------------------------------------------
if ($route === 'deadlines' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Corpo da requisição inválido"]);
            exit;
        }
        
        $id = $input['id'] ?? '';
        if (empty($id)) {
            $id = "dl-" . round(microtime(true) * 1000);
        }
        
        $title = $input['title'] ?? '';
        $date = $input['date'] ?? '';
        $description = $input['description'] ?? '';
        $daysRemaining = intval($input['daysRemaining'] ?? 0);
        $status = $input['status'] ?? 'Pendente';
        $category = $input['category'] ?? 'Outro';
        
        $stmt = $pdo->prepare("SELECT id FROM deadlines WHERE id = ?");
        $stmt->execute([$id]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $sql = "UPDATE deadlines SET title = ?, date = ?, description = ?, daysRemaining = ?, status = ?, category = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$title, $date, $description, $daysRemaining, $status, $category, $id]);
        } else {
            $sql = "INSERT INTO deadlines (id, title, date, description, daysRemaining, status, category) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id, $title, $date, $description, $daysRemaining, $status, $category]);
        }
        
        $stmt = $pdo->prepare("SELECT * FROM deadlines WHERE id = ?");
        $stmt->execute([$id]);
        $dl = $stmt->fetch();
        
        echo json_encode(["success" => true, "deadline" => $dl]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erro ao salvar prazo: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 6. POST CANDIDATES UPLOAD
// -----------------------------------------------------------------
if (preg_match('/^candidates\/([^\/]+)\/upload$/', $route, $matches) && $method === 'POST') {
    try {
        $id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Corpo de upload inválido"]);
            exit;
        }
        
        $docId = $input['docId'] ?? null;
        $pubId = $input['pubId'] ?? null;
        $fileName = $input['fileName'] ?? '';
        $fileSize = $input['fileSize'] ?? '';
        $base64 = $input['base64'] ?? '';
        $targetId = $pubId ?: $docId;
        
        $stmt = $pdo->prepare("SELECT * FROM candidates WHERE id = ?");
        $stmt->execute([$id]);
        $cand = $stmt->fetch();
        if (!$cand) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Candidato não encontrado"]);
            exit;
        }
        
        $photoUrl = $cand['photoUrl'];
        $publications = json_decode($cand['publications'] ?: '[]', true) ?: [];
        
        $uploadsDir = __DIR__ . '/uploads';
        if (!file_exists($uploadsDir)) {
            @mkdir($uploadsDir, 0755, true);
        }
        
        if ($targetId === "photo") {
            if ($base64) {
                $photoUrl = $base64; // Salvar a string base64 diretamente para persistência resiliente
                try {
                    $parts = explode(',', $base64);
                    if (count($parts) > 1) {
                        $fileData = base64_decode($parts[1]);
                        $safeName = "cand_" . $id . "_profile_" . basename($fileName);
                        @file_put_contents($uploadsDir . '/' . $safeName, $fileData);
                    }
                } catch (Exception $e) {
                    // Ignorar falhas de arquivo físico se houver problemas de permissão
                }
            } else {
                $photoUrl = "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";
            }
        } else {
            foreach ($publications as &$p) {
                if ($p['id'] === $targetId) {
                    if ($base64) {
                        try {
                            $parts = explode(',', $base64);
                            if (count($parts) > 1) {
                                $fileData = base64_decode($parts[1]);
                                $safeName = "cand_" . $id . "_pub_" . $targetId . "_" . basename($fileName);
                                @file_put_contents($uploadsDir . '/' . $safeName, $fileData);
                            }
                        } catch (Exception $e) {
                            // Ignorar falhas de escrita física
                        }
                    }
                    $p['status'] = 'Enviado';
                    $p['fileName'] = $fileName;
                    $p['fileSize'] = $fileSize ?: 'Incalculável';
                    $p['lastUpdated'] = date('Y-m-d\TH:i:s.v\Z');
                }
            }
        }
        
        $lastSaved = date('Y-m-d\TH:i:s.v\Z');
        $publicationsJson = json_encode($publications, JSON_UNESCAPED_UNICODE);
        
        $stmt = $pdo->prepare("UPDATE candidates SET photoUrl = ?, publications = ?, lastSaved = ? WHERE id = ?");
        $stmt->execute([$photoUrl, $publicationsJson, $lastSaved, $id]);
        
        $stmt = $pdo->prepare("SELECT * FROM candidates WHERE id = ?");
        $stmt->execute([$id]);
        $cand = $stmt->fetch();
        $cand['keyContacts'] = json_decode($cand['keyContacts'] ?: '[]', true) ?: [];
        $cand['publications'] = json_decode($cand['publications'] ?: '[]', true) ?: [];
        $cand['mappings'] = json_decode($cand['mappings'] ?: '[]', true) ?: [];
        
        echo json_encode(["success" => true, "candidate" => $cand]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erro ao processar arquivo: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 7. POST PUBLICATION STATUS / DOCUMENT STATUS
// -----------------------------------------------------------------
if (preg_match('/^candidates\/([^\/]+)\/(publication-status|document-status)$/', $route, $matches) && $method === 'POST') {
    try {
        $id = $matches[1];
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Corpo inválido"]);
            exit;
        }
        
        $pubId = $input['pubId'] ?? null;
        $docId = $input['docId'] ?? null;
        $status = $input['status'] ?? '';
        $rejectReason = $input['rejectReason'] ?? null;
        $postUrl = $input['postUrl'] ?? null;
        $targetId = $pubId ?: $docId;
        
        $stmt = $pdo->prepare("SELECT * FROM candidates WHERE id = ?");
        $stmt->execute([$id]);
        $cand = $stmt->fetch();
        if (!$cand) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Candidato não encontrado"]);
            exit;
        }
        
        $publications = json_decode($cand['publications'] ?: '[]', true) ?: [];
        foreach ($publications as &$p) {
            if ($p['id'] === $targetId) {
                $p['status'] = $status;
                if ($status === 'Rejeitado') {
                    $p['rejectReason'] = $rejectReason;
                } else {
                    unset($p['rejectReason']);
                }
                if ($status === 'Postado') {
                    $p['postUrl'] = $postUrl ?: ($p['postUrl'] ?? '');
                }
                $p['lastUpdated'] = date('Y-m-d\TH:i:s.v\Z');
            }
        }
        
        $lastSaved = date('Y-m-d\TH:i:s.v\Z');
        $publicationsJson = json_encode($publications, JSON_UNESCAPED_UNICODE);
        
        $stmt = $pdo->prepare("UPDATE candidates SET publications = ?, lastSaved = ? WHERE id = ?");
        $stmt->execute([$publicationsJson, $lastSaved, $id]);
        
        $stmt = $pdo->prepare("SELECT * FROM candidates WHERE id = ?");
        $stmt->execute([$id]);
        $cand = $stmt->fetch();
        $cand['keyContacts'] = json_decode($cand['keyContacts'] ?: '[]', true) ?: [];
        $cand['publications'] = json_decode($cand['publications'] ?: '[]', true) ?: [];
        $cand['mappings'] = json_decode($cand['mappings'] ?: '[]', true) ?: [];
        
        echo json_encode(["success" => true, "candidate" => $cand]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erro ao alterar status: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 8. POST REPORTS GENERATE (Suporte Inteligência Gemini + Fallback)
// -----------------------------------------------------------------
if ($route === 'reports/generate' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Corpo inválido"]);
            exit;
        }
        
        $candidateId = $input['candidateId'] ?? '';
        $type = $input['type'] ?? 'Geral';
        
        $stmt = $pdo->prepare("SELECT * FROM candidates WHERE id = ?");
        $stmt->execute([$candidateId]);
        $candidate = $stmt->fetch();
        if (!$candidate) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Candidato não encontrado"]);
            exit;
        }
        
        $publications = json_decode($candidate['publications'] ?: '[]', true) ?: [];
        $mappings = json_decode($candidate['mappings'] ?: '[]', true) ?: [];
        
        $approvedPubs = 0;
        foreach ($publications as $p) {
            if (($p['status'] ?? '') === 'Aprovado' || ($p['status'] ?? '') === 'Postado') {
                $approvedPubs++;
            }
        }
        $totalPubs = count($publications);
        $pubPercentage = $totalPubs > 0 ? round(($approvedPubs / $totalPubs) * 100) : 0;
        
        $filledMappings = [];
        $totalTargetVotes = 0;
        $totalHistoricVotes = 0;
        foreach ($mappings as $m) {
            if (!empty($m['lideranca']) || !empty($m['meta2026']) || !empty($m['situacao'])) {
                $filledMappings[] = $m;
            }
            $totalTargetVotes += intval($m['meta2026'] ?? 0);
            $totalHistoricVotes += intval($m['historicoVotos'] ?? 0);
        }
        
        $pendingList = [];
        foreach ($publications as $p) {
            if (in_array($p['status'] ?? '', ['Rascunho', 'Em Produção', 'Rejeitado'])) {
                $pendingList[] = $p['title'] ?? '';
            }
        }
        $pendingStr = count($pendingList) > 0 ? implode(', ', $pendingList) : 'Nenhum';
        
        $prompt = "Aja como um analista político estrategista sênior da Federação PSDB-Cidadania em Santa Catarina.\n";
        $prompt .= "Gere um relatório estruturado focado no tipo: \"{$type}\" para o candidato(a) abaixo:\n\n";
        $prompt .= "- Nome de Urna: {$candidate['urnName']} ({$candidate['party']})\n";
        $prompt .= "- Número de Campanha: {$candidate['number']}\n";
        $prompt .= "- Histórico de Atuação: {$candidate['professionalBackground']}\n";
        $prompt .= "- Áreas de Interesse: {$candidate['areasOfInterest']}\n";
        $prompt .= "- Bandeiras Políticas: {$candidate['politicalFlags']}\n";
        $prompt .= "- Breve Trajetória: {$candidate['trajectory']}\n\n";
        $prompt .= "--- Planejamento de Mídias e Agenda de Publicações ---\n";
        $prompt .= "- Status Geral da Campanha: {$candidate['status']}\n";
        $prompt .= "- Publicações Aprovadas/Postadas: {$approvedPubs} de {$totalPubs} ({$pubPercentage}% concluídos)\n";
        $prompt .= "- Conteúdos Pendentes de Produção/Envio: {$pendingStr}\n\n";
        $prompt .= "--- Planejamento Geográfico (Mapeamento de Cidades) ---\n";
        $prompt .= "- Cidades Mapeadas Ativas: " . count($filledMappings) . " cidades.\n";
        $prompt .= "- Histórico de Votação Anterior Somado nestas Cidades: {$totalHistoricVotes} votos.\n";
        $prompt .= "- Meta de Votação Geral Pactuada para 2026: {$totalTargetVotes} votos.\n";
        $prompt .= "- Detalhamento de Cidades Principais:\n";
        foreach ($filledMappings as $m) {
            $prompt .= "  * Município: {$m['cityName']} | Liderança Local: " . ($m['lideranca'] ?: 'Não informada') . " | Histórico: " . ($m['historicoVotos'] ?: '0') . " | Meta 2026: " . ($m['meta2026'] ?: '0') . " | Situação Crucial: " . ($m['situacao'] ?: 'Nenhuma registrada') . "\n";
        }
        $prompt .= "\nPor favor, escreva um relatório de 3 a 4 parágrafos bem densos, com tom formal, profissional, pragmático e estratégico.\n";
        $prompt .= "Divida em seções com títulos curtos (ex: DIAGNÓSTICO DE MÍDIAS, ALINHAMENTO GEOGRÁFICO, DIRETRIZES DE COMUNICAÇÃO).\n\n";
        $prompt .= "Foque em como otimizar o cronograma de publicações para engajar as bases eleitorais nos municípios-chave, alinhar as bandeiras políticas com a linha editorial de comunicação, e onde a coordenação da Federação deve intervir ou apoiar o candidato para impulsionar sua imagem digital.";
        
        $reportText = "";
        $geminiKey = $env['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: null;
        
        // Se houver chave API Gemini do usuário no Hostinger, tentar usar
        if ($geminiKey && $geminiKey !== 'MY_GEMINI_API_KEY' && !empty($geminiKey)) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $geminiKey;
            $payload = [
                "contents" => [
                    ["parts" => [["text" => $prompt]]]
                ],
                "systemInstruction" => [
                    "parts" => [["text" => "Você é o Coordenador Geral de Comunicação e Análise Estratégica da Federação PSDB-Cidadania. Escreva em português elegante do Brasil, voltado para decisões de imagem e comunicação partidária."]]
                ]
            ];
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            $response = curl_exec($ch);
            $err = curl_error($ch);
            curl_close($ch);
            
            if (!$err) {
                $resData = json_decode($response, true);
                if (isset($resData['candidates'][0]['content']['parts'][0]['text'])) {
                    $reportText = $resData['candidates'][0]['content']['parts'][0]['text'];
                }
            }
        }
        
        // Se não houver chave ou falhar, usar o incrível gerador heurístico estratégico
        if (empty($reportText)) {
            $reportText = "### PLANEJAMENTO ESTRATÉGICO DE MÍDIAS (" . strtoupper($type) . ")\n\n";
            $reportText .= "**Candidato(a):** {$candidate['urnName']} | **Partido:** **{$candidate['party']}** | **Número:** {$candidate['number']}\n\n";
            $reportText .= "#### 1. Diagnóstico do Cronograma de Comunicação Digital\n";
            $reportText .= "O candidato apresenta um índice de **{$pubPercentage}%** de conformidade e engajamento em sua Agenda de Publicações, contando com {$approvedPubs} postagens validadas e postadas de um total de {$totalPubs} pautas programadas. ";
            $reportText .= "Há necessidade de acelerar a produção de conteúdos voltados às propostas de " . ($candidate['areasOfInterest'] ?: 'desenvolvimento estadual') . " para suprir os eixos ainda classificados como pendentes ou em produção.\n\n";
            $reportText .= "#### 2. Articulação Geográfica e Campanha Multi-Plataforma\n";
            $reportText .= "Com base ativa em " . count($filledMappings) . " municípios mapeados de Santa Catarina e meta global pactuada de **{$totalTargetVotes} votos**, a presença digital do candidato precisa ser calibrada de acordo com as especificidades regionais. Municípios do Oeste e Sul demandam postagens específicas valorizando parcerias locais e as bandeiras de atuação prática do candidato (" . ($candidate['politicalFlags'] ?: 'atuação legislativa e social') . ").\n\n";
            $reportText .= "#### 3. Diretrizes de Comunicação e Suporte Partidário\n";
            $reportText .= "A coordenação estadual de mídias, sob liderança de " . ($candidate['mediaCoordinatorName'] ?: 'equipe local de mídias') . ", deve prover suporte para as campanhas de impulsionamento georreferenciado e assegurar que as postagens agendadas reflitam as diretrizes de mobilização da Federação. Sugere-se intensificar a produção de formatos interativos (Reels/Vídeos de rua) para humanizar a candidatura perante os eleitores catarinenses.";
        }
        
        $newReport = [
            "id" => "rep-" . round(microtime(true) * 1000),
            "title" => "Relatório {$type} - {$candidate['urnName']}",
            "createdAt" => date('Y-m-d\TH:i:s.v\Z'),
            "content" => $reportText,
            "author" => "Analista Inteligência Federação",
            "candidateId" => $candidateId,
            "candidateName" => $candidate['urnName'],
            "type" => $type
        ];
        
        $stmt = $pdo->prepare("INSERT INTO reports (id, title, createdAt, content, author, candidateId, candidateName, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $newReport['id'], $newReport['title'], $newReport['createdAt'], $newReport['content'],
            $newReport['author'], $newReport['candidateId'], $newReport['candidateName'], $newReport['type']
        ]);
        
        echo json_encode(["success" => true, "report" => $newReport]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Erro ao gerar relatório: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 9. GET DATABASE STATUS
// -----------------------------------------------------------------
if ($route === 'database/status' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) FROM candidates");
        $candCount = (int)$stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM deadlines");
        $deadlinesCount = (int)$stmt->fetchColumn();
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM reports");
        $reportsCount = (int)$stmt->fetchColumn();
        
        echo json_encode([
            "success" => true,
            "usingMySQL" => true,
            "connected" => true,
            "errorMessage" => null,
            "config" => [
                "host" => $db_host,
                "databaseName" => $db_name,
                "user" => $db_user
            ],
            "stats" => [
                "candidatesCount" => $candCount,
                "deadlinesCount" => $deadlinesCount,
                "reportsCount" => $reportsCount
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao ler status: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 10. GET DATABASE EXPORT-SQL
// -----------------------------------------------------------------
if ($route === 'database/export-sql' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM candidates ORDER BY id ASC");
        $candidates = $stmt->fetchAll();
        
        $stmt = $pdo->query("SELECT * FROM deadlines");
        $deadlines = $stmt->fetchAll();
        
        $stmt = $pdo->query("SELECT * FROM reports ORDER BY createdAt DESC");
        $reports = $stmt->fetchAll();
        
        $sql = "-- =======================================================\n";
        $sql .= "-- BANCO DE DADOS ATUALIZADO (HOSTINGER EXPORT)\n";
        $sql .= "-- Exportado em: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- =======================================================\n\n";
        
        $sql .= "CREATE DATABASE IF NOT EXISTS `$db_name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n";
        $sql .= "USE `$db_name`;\n\n";
        
        $sql .= "CREATE TABLE IF NOT EXISTS `candidates` (\n";
        $sql .= "  `id` VARCHAR(50) NOT NULL PRIMARY KEY,\n";
        $sql .= "  `name` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `number` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `urnName` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `whatsapp` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `instagram` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `facebook` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `email` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `party` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `status` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `photoUrl` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `mediaCoordinatorName` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `mediaCoordinatorWhatsApp` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `professionalBackground` TEXT DEFAULT NULL,\n";
        $sql .= "  `areasOfInterest` TEXT DEFAULT NULL,\n";
        $sql .= "  `teams` TEXT DEFAULT NULL,\n";
        $sql .= "  `family` TEXT DEFAULT NULL,\n";
        $sql .= "  `groups` TEXT DEFAULT NULL,\n";
        $sql .= "  `trajectory` TEXT DEFAULT NULL,\n";
        $sql .= "  `politicalFlags` TEXT DEFAULT NULL,\n";
        $sql .= "  `keyContacts` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `publications` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `mappings` LONGTEXT DEFAULT NULL,\n";
        $sql .= "  `lastSaved` VARCHAR(100) DEFAULT NULL\n";
        $sql .= ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";
        
        $escape = function($val) use ($pdo) {
            if ($val === null) return 'NULL';
            return $pdo->quote($val);
        };
        
        foreach ($candidates as $cand) {
            $sql .= "INSERT INTO `candidates` (\n";
            $sql .= "  `id`, `name`, `number`, `urnName`, `whatsapp`, `instagram`, `facebook`, `email`, `party`, `status`, `photoUrl`,\n";
            $sql .= "  `mediaCoordinatorName`, `mediaCoordinatorWhatsApp`, `professionalBackground`, `areasOfInterest`,\n";
            $sql .= "  `teams`, `family`, `groups`, `trajectory`, `politicalFlags`, `keyContacts`, `publications`, `mappings`, `lastSaved`\n";
            $sql .= ") VALUES (\n";
            $sql .= "  " . $escape($cand['id']) . ", " . $escape($cand['name']) . ", " . $escape($cand['number']) . ", " . $escape($cand['urnName']) . ", " . $escape($cand['whatsapp']) . ", " . $escape($cand['instagram']) . ", " . $escape($cand['facebook']) . ", " . $escape($cand['email']) . ", " . $escape($cand['party']) . ", " . $escape($cand['status']) . ", " . $escape($cand['photoUrl']) . ",\n";
            $sql .= "  " . $escape($cand['mediaCoordinatorName']) . ", " . $escape($cand['mediaCoordinatorWhatsApp']) . ", " . $escape($cand['professionalBackground']) . ", " . $escape($cand['areasOfInterest']) . ",\n";
            $sql .= "  " . $escape($cand['teams']) . ", " . $escape($cand['family']) . ", " . $escape($cand['groups']) . ", " . $escape($cand['trajectory']) . ", " . $escape($cand['politicalFlags']) . ", " . $escape($cand['keyContacts']) . ", " . $escape($cand['publications']) . ", " . $escape($cand['mappings']) . ", " . $escape($cand['lastSaved']) . "\n";
            $sql .= ") ON DUPLICATE KEY UPDATE\n";
            $sql .= "  `name` = VALUES(`name`), `number` = VALUES(`number`), `urnName` = VALUES(`urnName`), `whatsapp` = VALUES(`whatsapp`), `instagram` = VALUES(`instagram`), `facebook` = VALUES(`facebook`), `email` = VALUES(`email`), `party` = VALUES(`party`), `status` = VALUES(`status`), `photoUrl` = VALUES(`photoUrl`), `mediaCoordinatorName` = VALUES(`mediaCoordinatorName`), `mediaCoordinatorWhatsApp` = VALUES(`mediaCoordinatorWhatsApp`), `professionalBackground` = VALUES(`professionalBackground`), `areasOfInterest` = VALUES(`areasOfInterest`), `teams` = VALUES(`teams`), `family` = VALUES(`family`), `groups` = VALUES(`groups`), `trajectory` = VALUES(`trajectory`), `politicalFlags` = VALUES(`politicalFlags`), `keyContacts` = VALUES(`keyContacts`), `publications` = VALUES(`publications`), `mappings` = VALUES(`mappings`), `lastSaved` = VALUES(`lastSaved`);\n\n";
        }
        
        $sql .= "CREATE TABLE IF NOT EXISTS `deadlines` (\n";
        $sql .= "  `id` VARCHAR(50) NOT NULL PRIMARY KEY,\n";
        $sql .= "  `title` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `date` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `description` TEXT DEFAULT NULL,\n";
        $sql .= "  `daysRemaining` INT DEFAULT NULL,\n";
        $sql .= "  `status` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `category` VARCHAR(50) DEFAULT NULL\n";
        $sql .= ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";
        
        foreach ($deadlines as $dl) {
            $sql .= "INSERT INTO `deadlines` (`id`, `title`, `date`, `description`, `daysRemaining`, `status`, `category`)\n";
            $sql .= "VALUES (" . $escape($dl['id']) . ", " . $escape($dl['title']) . ", " . $escape($dl['date']) . ", " . $escape($dl['description']) . ", " . intval($dl['daysRemaining']) . ", " . $escape($dl['status']) . ", " . $escape($dl['category']) . ")\n";
            $sql .= "ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `date` = VALUES(`date`), `description` = VALUES(`description`), `daysRemaining` = VALUES(`daysRemaining`), `status` = VALUES(`status`), `category` = VALUES(`category`);\n\n";
        }
        
        $sql .= "CREATE TABLE IF NOT EXISTS `reports` (\n";
        $sql .= "  `id` VARCHAR(50) NOT NULL PRIMARY KEY,\n";
        $sql .= "  `title` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `createdAt` VARCHAR(100) DEFAULT NULL,\n";
        $sql .= "  `content` TEXT DEFAULT NULL,\n";
        $sql .= "  `author` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `candidateId` VARCHAR(50) DEFAULT NULL,\n";
        $sql .= "  `candidateName` VARCHAR(255) DEFAULT NULL,\n";
        $sql .= "  `type` VARCHAR(50) DEFAULT NULL\n";
        $sql .= ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n";
        
        foreach ($reports as $rep) {
            $sql .= "INSERT INTO `reports` (`id`, `title`, `createdAt`, `content`, `author`, `candidateId`, `candidateName`, `type`)\n";
            $sql .= "VALUES (" . $escape($rep['id']) . ", " . $escape($rep['title']) . ", " . $escape($rep['createdAt']) . ", " . $escape($rep['content']) . ", " . $escape($rep['author']) . ", " . $escape($rep['candidateId']) . ", " . $escape($rep['candidateName']) . ", " . $escape($rep['type']) . ")\n";
            $sql .= "ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `createdAt` = VALUES(`createdAt`), `content` = VALUES(`content`), `author` = VALUES(`author`), `candidateId` = VALUES(`candidateId`), `candidateName` = VALUES(`candidateName`), `type` = VALUES(`type`);\n\n";
        }
        
        // Atualizar o database.sql local
        @file_put_contents(__DIR__ . '/database.sql', $sql);
        
        header("Content-Disposition: attachment; filename=database.sql");
        header("Content-Type: application/sql");
        echo $sql;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao exportar SQL: " . $e->getMessage()]);
    }
    exit;
}

// -----------------------------------------------------------------
// 11. POST DATABASE SYNC
// -----------------------------------------------------------------
if ($route === 'database/sync' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $host = $input['host'] ?? null;
        $user = $input['user'] ?? null;
        $password = $input['password'] ?? null;
        $database = $input['database'] ?? null;
        $port = $input['port'] ?? '3306';
        
        $targetPdo = null;
        $isCustom = false;
        
        if ($host && $user && $password && $database) {
            $isCustom = true;
            $targetPdo = new PDO("mysql:host=$host;dbname=$database;port=$port;charset=utf8mb4", $user, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } else {
            $targetPdo = $pdo;
        }
        
        // Garantir tabelas no banco de dados de destino
        $targetPdo->exec("
            CREATE TABLE IF NOT EXISTS candidates (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255),
                number VARCHAR(50),
                urnName VARCHAR(255),
                whatsapp VARCHAR(50),
                instagram VARCHAR(255),
                facebook VARCHAR(255),
                email VARCHAR(255),
                party VARCHAR(50),
                status VARCHAR(50),
                photoUrl LONGTEXT,
                mediaCoordinatorName VARCHAR(255),
                mediaCoordinatorWhatsApp VARCHAR(50),
                professionalBackground TEXT,
                areasOfInterest TEXT,
                teams TEXT,
                family TEXT,
                groups TEXT,
                trajectory TEXT,
                politicalFlags TEXT,
                keyContacts LONGTEXT,
                publications LONGTEXT,
                mappings LONGTEXT,
                lastSaved VARCHAR(100)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        
        $targetPdo->exec("
            CREATE TABLE IF NOT EXISTS deadlines (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255),
                date VARCHAR(50),
                description TEXT,
                daysRemaining INT,
                status VARCHAR(50),
                category VARCHAR(50)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        
        $targetPdo->exec("
            CREATE TABLE IF NOT EXISTS reports (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255),
                createdAt VARCHAR(100),
                content TEXT,
                author VARCHAR(255),
                candidateId VARCHAR(50),
                candidateName VARCHAR(255),
                type VARCHAR(50)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
        
        // Buscar dados de origem do banco ativo ($pdo)
        $stmt = $pdo->query("SELECT * FROM candidates");
        $candidates = $stmt->fetchAll();
        
        $stmt = $pdo->query("SELECT * FROM deadlines");
        $deadlines = $stmt->fetchAll();
        
        $stmt = $pdo->query("SELECT * FROM reports");
        $reports = $stmt->fetchAll();
        
        // Sincronizar Candidatos
        $stmtSync = $targetPdo->prepare("
            INSERT INTO candidates (
                id, name, number, urnName, whatsapp, instagram, facebook, email, party, status, photoUrl,
                mediaCoordinatorName, mediaCoordinatorWhatsApp, professionalBackground, areasOfInterest,
                teams, family, groups, trajectory, politicalFlags, keyContacts, publications, mappings, lastSaved
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name), number = VALUES(number), urnName = VALUES(urnName), whatsapp = VALUES(whatsapp),
                instagram = VALUES(instagram), facebook = VALUES(facebook), email = VALUES(email), party = VALUES(party),
                status = VALUES(status), photoUrl = VALUES(photoUrl), mediaCoordinatorName = VALUES(mediaCoordinatorName),
                mediaCoordinatorWhatsApp = VALUES(mediaCoordinatorWhatsApp), professionalBackground = VALUES(professionalBackground),
                areasOfInterest = VALUES(areasOfInterest), teams = VALUES(teams), family = VALUES(family), groups = VALUES(groups),
                trajectory = VALUES(trajectory), politicalFlags = VALUES(politicalFlags), keyContacts = VALUES(keyContacts),
                publications = VALUES(publications), mappings = VALUES(mappings), lastSaved = VALUES(lastSaved)
        ");
        foreach ($candidates as $cand) {
            $stmtSync->execute([
                $cand['id'], $cand['name'] ?: '', $cand['number'] ?: '', $cand['urnName'] ?: '', $cand['whatsapp'] ?: '',
                $cand['instagram'] ?: '', $cand['facebook'] ?: '', $cand['email'] ?: '', $cand['party'] ?: '', $cand['status'] ?: '',
                $cand['photoUrl'] ?: '', $cand['mediaCoordinatorName'] ?: '', $cand['mediaCoordinatorWhatsApp'] ?: '',
                $cand['professionalBackground'] ?: '', $cand['areasOfInterest'] ?: '', $cand['teams'] ?: '', $cand['family'] ?: '',
                $cand['groups'] ?: '', $cand['trajectory'] ?: '', $cand['politicalFlags'] ?: '',
                $cand['keyContacts'] ?: '[]', $cand['publications'] ?: '[]', $cand['mappings'] ?: '[]',
                $cand['lastSaved'] ?: date('Y-m-d\TH:i:s.v\Z')
            ]);
        }
        
        // Sincronizar Prazos
        $stmtSyncDl = $targetPdo->prepare("
            INSERT INTO deadlines (id, title, date, description, daysRemaining, status, category)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                title = VALUES(title), date = VALUES(date), description = VALUES(description),
                daysRemaining = VALUES(daysRemaining), status = VALUES(status), category = VALUES(category)
        ");
        foreach ($deadlines as $dl) {
            $stmtSyncDl->execute([
                $dl['id'], $dl['title'], $dl['date'], $dl['description'], intval($dl['daysRemaining']), $dl['status'], $dl['category']
            ]);
        }
        
        // Sincronizar Relatórios
        $stmtSyncRep = $targetPdo->prepare("
            INSERT INTO reports (id, title, createdAt, content, author, candidateId, candidateName, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                title = VALUES(title), createdAt = VALUES(createdAt), content = VALUES(content),
                author = VALUES(author), candidateId = VALUES(candidateId), candidateName = VALUES(candidateName),
                type = VALUES(type)
        ");
        foreach ($reports as $rep) {
            $stmtSyncRep->execute([
                $rep['id'], $rep['title'], $rep['createdAt'], $rep['content'], $rep['author'], $rep['candidateId'], $rep['candidateName'], $rep['type']
            ]);
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Sincronização concluída com sucesso! Sincronizados: " . count($candidates) . " candidatos, " . count($deadlines) . " prazos e " . count($reports) . " relatórios."
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Falha na sincronização direta do PHP: " . $e->getMessage()
        ]);
    }
    exit;
}

// Helper function to split SQL statements while ignoring semicolons inside strings and comments
function splitSqlStatements($sqlText) {
    $statements = [];
    $currentStatement = "";
    $inString = false;
    $stringChar = "";
    $inComment = false;
    $inLineComment = false;
    $len = strlen($sqlText);

    for ($i = 0; $i < $len; $i++) {
        $char = $sqlText[$i];
        $nextChar = ($i + 1 < $len) ? $sqlText[$i + 1] : "";

        if (!$inString && !$inComment && (($char === '-' && $nextChar === '-') || $char === '#')) {
            $inLineComment = true;
            if ($char === '-') $i++;
            continue;
        }
        if ($inLineComment && ($char === "\n" || $char === "\r")) {
            $inLineComment = false;
            continue;
        }
        if ($inLineComment) {
            continue;
        }

        if (!$inString && !$inComment && $char === '/' && $nextChar === '*') {
            $inComment = true;
            $i++;
            continue;
        }
        if ($inComment && $char === '*' && $nextChar === '/') {
            $inComment = false;
            $i++;
            continue;
        }
        if ($inComment) {
            continue;
        }

        if (($char === "'" || $char === '"' || $char === '`') && ($i === 0 || $sqlText[$i - 1] !== '\\')) {
            if (!$inString) {
                $inString = true;
                $stringChar = $char;
            } elseif ($stringChar === $char) {
                $inString = false;
            }
        }

        $currentStatement .= $char;

        if ($char === ';' && !$inString) {
            $trimmed = trim($currentStatement);
            if (!empty($trimmed)) {
                $statements[] = $trimmed;
            }
            $currentStatement = "";
        }
    }

    $trimmed = trim($currentStatement);
    if (!empty($trimmed)) {
        $statements[] = $trimmed;
    }

    return $statements;
}

// -----------------------------------------------------------------
// 12. POST DATABASE IMPORT-SQL
// -----------------------------------------------------------------
if ($route === 'database/import-sql' && $method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $sql = $input['sql'] ?? '';
        $host = $input['host'] ?? 'localhost';
        $port = $input['port'] ?? '3306';
        $database = $input['database'] ?? 'u844537895_candidatos';
        $user = $input['user'] ?? 'u844537895_candidatos';
        $password = $input['password'] ?? 'Shift2026';

        if (empty($sql)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Nenhum comando SQL fornecido."]);
            exit;
        }

        // Tentar conectar com as credenciais especificadas para importação
        $importPdo = new PDO("mysql:host=$host;dbname=$database;port=$port;charset=utf8mb4", $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        // Função robusta de separação de instruções SQL
        $statements = splitSqlStatements($sql);
        $executed = 0;
        $failed = 0;
        $errors = [];

        // Habilitar desativação temporária de chaves estrangeiras para evitar conflitos de ordem na importação
        $importPdo->exec("SET FOREIGN_KEY_CHECKS=0");

        foreach ($statements as $stmtText) {
            $stmtText = trim($stmtText);
            if (empty($stmtText)) {
                continue;
            }
            try {
                $importPdo->exec($stmtText);
                $executed++;
            } catch (Exception $e) {
                $failed++;
                $errors[] = "Erro no comando [" . substr($stmtText, 0, 80) . "...]: " . $e->getMessage();
            }
        }

        $importPdo->exec("SET FOREIGN_KEY_CHECKS=1");

        if ($failed === 0) {
            echo json_encode([
                "success" => true,
                "message" => "Importação do SQL concluída com absoluto sucesso! Foram executadas $executed instruções com êxito e 0 falhas no banco de dados u844537895_candidatos."
            ]);
        } else {
            echo json_encode([
                "success" => true, // Ainda considerado sucesso por ter rodado os demais, mas com avisos
                "message" => "Importação concluída parcialmente. Executados com sucesso: $executed. Falhas no banco de dados: $failed.",
                "warnings" => array_slice($errors, 0, 5) // Retornar primeiros 5 erros
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Falha catastrófica ao tentar importar SQL: " . $e->getMessage()
        ]);
    }
    exit;
}

// Se nenhuma rota bater, retornar 404
http_response_code(404);
echo json_encode([
    "success" => false,
    "error" => "Rota do PHP não encontrada: $method $route"
]);
