import React, { useState, useEffect } from "react";
import { 
  Database, Download, CheckCircle, XCircle, AlertTriangle, 
  Server, RefreshCw, Play, ArrowRight, ExternalLink, HelpCircle 
} from "lucide-react";

interface DBStatus {
  success: boolean;
  usingMySQL: boolean;
  connected: boolean;
  errorMessage: string | null;
  config: {
    host: string;
    databaseName: string;
    user: string;
  };
  stats: {
    candidatesCount: number;
    deadlinesCount: number;
    reportsCount: number;
  };
}

export default function DatabaseSync() {
  const [status, setStatus] = useState<DBStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  // Form states for manual sync
  const [host, setHost] = useState("candidatos.mastervisionmarketing.com");
  const [port, setPort] = useState("3306");
  const [database, setDatabase] = useState("u844537895_candidatos");
  const [user, setUser] = useState("u844537895_candidatos");
  const [password, setPassword] = useState("");
  
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/database/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch database status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/database/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port,
          database,
          user,
          password
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSyncResult({ success: true, message: data.message });
        fetchStatus();
      } else {
        setSyncResult({ 
          success: false, 
          message: data.error || "Ocorreu um erro desconhecido ao tentar sincronizar." 
        });
      }
    } catch (err: any) {
      setSyncResult({ 
        success: false, 
        message: err.message || "Erro de rede ao conectar com o servidor." 
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadSQL = () => {
    // Direct link to the export route which handles setting headers and returning file
    window.open("/api/database/export-sql", "_blank");
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER */}
      <div className="bg-white border-2 border-[#1A1A1B] p-6 shadow-[4px_4px_0px_0px_rgba(26,26,27,1)]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#004488] text-white border-2 border-[#1A1A1B]">
            <Database size={28} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-gray-900">
              Integração e Sincronização de Banco de Dados
            </h2>
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wide">
              Mapeamento de Produção &bull; candidatos.mastervisionmarketing.com
            </p>
            <p className="text-xs text-gray-600 mt-2 max-w-3xl leading-relaxed">
              Esta ferramenta integra a base de dados de mapeamento eleitoral deste ambiente com o ambiente 
              de produção da <strong>Hostinger (MySQL)</strong>. Você pode realizar a sincronização direta via rede 
              ou baixar o script de despejo SQL atualizado contendo todas as correções (inclusive a validação da região de Chapecó e fichas de candidatos).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STATUS & QUICK STATS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* DATABASE STATUS CARD */}
          <div className="bg-white border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(26,26,27,1)] overflow-hidden">
            <div className="bg-[#1A1A1B] text-white px-4 py-3 border-b border-[#1A1A1B] flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider">Status do Servidor Local</span>
              <button 
                onClick={fetchStatus} 
                className="text-[#FFD700] hover:text-white transition"
                title="Atualizar status"
              >
                <RefreshCw size={14} className={loadingStatus ? "animate-spin" : ""} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold uppercase">Motor de Dados Ativo:</span>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-[#1A1A1B] ${
                  status?.usingMySQL ? "bg-[#FFD700] text-gray-900" : "bg-blue-100 text-[#004488]"
                }`}>
                  {status?.usingMySQL ? "MySQL Local" : "Firestore Nuvem"}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-500 font-bold uppercase">Sincronia Hostinger:</span>
                <div className="flex items-center gap-1.5">
                  {status?.usingMySQL && status?.connected ? (
                    <>
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-xs font-black text-green-700 uppercase">Conectado</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-xs font-black text-amber-600 uppercase">Aguardando Carga</span>
                    </>
                  )}
                </div>
              </div>

              {/* Data Statistics */}
              <div className="border-t-2 border-dashed border-gray-200 pt-3 mt-2">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Registros de Mapeamento</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 border border-gray-200 p-2 text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Candidatos</span>
                    <span className="text-base font-black text-gray-800 font-mono">
                      {loadingStatus ? "..." : status?.stats.candidatesCount || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-gray-200 p-2 text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Prazos</span>
                    <span className="text-base font-black text-gray-800 font-mono">
                      {loadingStatus ? "..." : status?.stats.deadlinesCount || 0}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-gray-200 p-2 text-center">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Relatórios</span>
                    <span className="text-base font-black text-gray-800 font-mono">
                      {loadingStatus ? "..." : status?.stats.reportsCount || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connection Specs */}
              {status?.usingMySQL && (
                <div className="bg-slate-50 border border-gray-200 p-3 rounded-none text-[10px] font-mono text-gray-600 space-y-1">
                  <p className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-1">ESPECIFICAÇÕES DE CONEXÃO:</p>
                  <p><strong>HOST:</strong> {status.config.host}</p>
                  <p><strong>BANCO:</strong> {status.config.databaseName}</p>
                  <p><strong>USUÁRIO:</strong> {status.config.user}</p>
                </div>
              )}
            </div>
          </div>

          {/* SECURITY & HOSTINGER ADVICE */}
          <div className="bg-amber-50 border-2 border-[#1A1A1B] p-5 shadow-[4px_4px_0px_0px_rgba(26,26,27,1)] space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-wider">
              <AlertTriangle size={16} />
              Aviso sobre Hostinger
            </div>
            <p className="text-xs text-amber-950 leading-relaxed">
              O provedor <strong>Hostinger</strong> bloqueia conexões diretas ao banco de dados MySQL de servidores externos por padrão (política de segurança de portas). 
            </p>
            <p className="text-xs text-amber-950 leading-relaxed">
              Para usar a <strong>Sincronização Direta</strong>, certifique-se de liberar o IP deste applet na aba <strong>"MySQL Remoto"</strong> do painel da Hostinger. Caso contrário, use a <strong>Importação Offline</strong> com o arquivo SQL, que é 100% segura e livre de bloqueios.
            </p>
          </div>

        </div>

        {/* MIDDLE & RIGHT COLUMNS: THE INTEGRATION MODES */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MODE 1: OFFLINE IMPORT (THE MOST RELIABLE) */}
          <div className="bg-white border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(26,26,27,1)]">
            <div className="bg-[#004488] text-white px-5 py-4 border-b-2 border-[#1A1A1B] flex items-center gap-3">
              <div className="bg-white/10 p-1.5 border border-white/20">
                <Download size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider leading-none">Método A: Exportação e Importação Offline</h3>
                <span className="text-[9px] text-blue-100 font-bold mt-1 block uppercase">100% GARANTIDO &bull; INDEPENDENTE DE FIREWALL</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-700 leading-relaxed">
                Este método gera um arquivo SQL contendo a estrutura exata das tabelas 
                (<code>candidates</code>, <code>deadlines</code> e <code>reports</code>) e todos os dados salvos 
                no momento (incluindo as correções de Chapecó do candidato Marcos Vieira). É a forma mais robusta e recomendada para a Hostinger.
              </p>

              <div className="bg-slate-50 border border-gray-200 p-4 space-y-3">
                <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-[#004488]" />
                  Passo a Passo para Integração na Hostinger:
                </h4>
                
                <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4 leading-relaxed">
                  <li>
                    Clique no botão amarelo abaixo para baixar o arquivo <strong><code>database.sql</code></strong> atualizado.
                  </li>
                  <li>
                    Acesse o painel administrativo da <strong>Hostinger</strong> e abra o gerenciador de bancos de dados <strong>phpMyAdmin</strong>.
                  </li>
                  <li>
                    Selecione o banco de dados oficial: <code>u844537895_candidatos</code>.
                  </li>
                  <li>
                    Clique na aba superior <strong>"Importar"</strong> (ou <strong>"Import"</strong>).
                  </li>
                  <li>
                    Escolha o arquivo <code>database.sql</code> que você acabou de baixar e clique em <strong>"Executar"</strong> (ou <strong>"Go/Import"</strong>).
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadSQL}
                  className="px-5 py-3 bg-[#FFD700] hover:bg-amber-400 text-gray-900 border-2 border-[#1A1A1B] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(26,26,27,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(26,26,27,1)]"
                >
                  <Download size={15} />
                  Baixar Arquivo SQL Atualizado (database.sql)
                </button>
              </div>
            </div>
          </div>

          {/* MODE 2: DIRECT SYNC VIA NETWORK */}
          <div className="bg-white border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(26,26,27,1)]">
            <div className="bg-gray-800 text-white px-5 py-4 border-b-2 border-[#1A1A1B] flex items-center gap-3">
              <div className="bg-white/10 p-1.5 border border-white/20">
                <Server size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider leading-none">Método B: Sincronização Direta Online</h3>
                <span className="text-[9px] text-gray-300 font-bold mt-1 block uppercase">CONEXÃO DIRETA COM O MYSQL DA HOSTINGER</span>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSync} className="space-y-4">
                <p className="text-xs text-gray-700 leading-relaxed">
                  Insira as credenciais do seu banco de dados MySQL hospedado na Hostinger. O applet fará a conexão remota de servidor para servidor e atualizará todas as tabelas instantaneamente.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-500 block mb-1 uppercase tracking-wider">Endereço do Host MySQL:</label>
                    <input 
                      type="text" 
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      required
                      placeholder="Ex: candidatos.mastervisionmarketing.com ou IP"
                      className="w-full bg-slate-50 border border-gray-300 px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#004488]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-500 block mb-1 uppercase tracking-wider">Porta:</label>
                    <input 
                      type="text" 
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-gray-300 px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#004488]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-500 block mb-1 uppercase tracking-wider">Nome do Banco de Dados:</label>
                    <input 
                      type="text" 
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-gray-300 px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#004488]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-500 block mb-1 uppercase tracking-wider">Usuário do Banco:</label>
                    <input 
                      type="text" 
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-gray-300 px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#004488]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black text-gray-500 block mb-1 uppercase tracking-wider">Senha do Banco de Dados:</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Digite a senha configurada no painel Hostinger"
                      className="w-full bg-slate-50 border border-gray-300 px-3 py-2 text-xs font-mono rounded-none focus:outline-none focus:border-[#004488]"
                    />
                  </div>
                </div>

                {/* Live Feedback / Result */}
                {syncResult && (
                  <div className={`p-4 border border-2 text-xs font-black flex items-start gap-2.5 ${
                    syncResult.success 
                      ? "bg-green-50 border-green-300 text-green-800" 
                      : "bg-red-50 border-red-300 text-red-800"
                  }`}>
                    {syncResult.success ? (
                      <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle size={18} className="text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[10px]">
                        {syncResult.success ? "Sincronização Bem Sucedida!" : "Erro na Sincronização"}
                      </p>
                      <p className="mt-1 font-mono font-medium leading-relaxed">{syncResult.message}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={syncing}
                    className={`px-5 py-3 bg-[#004488] hover:bg-blue-800 text-white border-2 border-[#1A1A1B] text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(26,26,27,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(26,26,27,1)] ${
                      syncing ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {syncing ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Conectando & Sincronizando...
                      </>
                    ) : (
                      <>
                        <Play size={14} className="fill-current" />
                        Iniciar Sincronização Direta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
