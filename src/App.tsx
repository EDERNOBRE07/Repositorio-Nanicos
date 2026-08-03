import React, { useState, useEffect } from "react";
import { Candidate, ElectoralDeadline, PartyReport } from "./types";
import DashboardStats from "./components/DashboardStats";
import CandidateCard from "./components/CandidateCard";
import FichaAcompanhamento from "./components/FichaAcompanhamento";
import DeadlinesTracker from "./components/DeadlinesTracker";
import ReportGenerator from "./components/ReportGenerator";
import PublicationsScheduleGlobal from "./components/PublicationsScheduleGlobal";
import RegionalVision from "./components/RegionalVision";
import UrgentDeadlinesWidget from "./components/UrgentDeadlinesWidget";
import DatabaseSync from "./components/DatabaseSync";
import { 
  Plus, Search, Filter, Shield, Calendar, FileText, Users, 
  MapPin, AlertCircle, RefreshCw, Layers, Globe, Database
} from "lucide-react";

export default function App() {
  // Global states
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [deadlines, setDeadlines] = useState<ElectoralDeadline[]>([]);
  const [reports, setReports] = useState<PartyReport[]>([]);
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [currentTab, setCurrentTab] = useState<"painel" | "calendario" | "relatorios" | "postagens" | "regional" | "database">("painel");
  const [fichaInitialTab, setFichaInitialTab] = useState<"ficha" | "agenda">("ficha");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [partyFilter, setPartyFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  // Candidate creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    number: "",
    urnName: "",
    role: "Candidato(a) a Deputado(a) Estadual",
    party: "PSDB" as "PSDB" | "Cidadania",
    status: "Pré-Campanha" as const,
    whatsapp: "",
    email: ""
  });

  // Fetch initial data from Express backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Falha ao comunicar com o servidor");
      }
      const data = await response.json();
      const sortedCandidates = (data.candidates || []).sort((a: Candidate, b: Candidate) => {
        const nameA = (a.name || a.urnName || "").trim();
        const nameB = (b.name || b.urnName || "").trim();
        return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
      });
      setCandidates(sortedCandidates);
      setDeadlines(data.deadlines || []);
      setReports(data.reports || []);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError("Erro de carregamento do banco de dados. Certifique-se de que o servidor está rodando.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync candidate selection with fresh data
  const handleSelectCandidateForFicha = (candidate: Candidate, tab: "ficha" | "agenda" = "ficha") => {
    const fresh = candidates.find(c => c.id === candidate.id) || candidate;
    setFichaInitialTab(tab);
    setSelectedCandidate(fresh);
  };

  // Auto-save candidate edits (called by FichaAcompanhamento)
  const handleSaveCandidate = async (updatedCandidate: Candidate) => {
    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedCandidate)
      });
      const data = await response.json();
      if (data.success) {
        // Update candidates array locally
        setCandidates(prev => prev.map(c => c.id === data.candidate.id ? data.candidate : c));
        // Also update selectedCandidate if it is the current candidate being edited
        setSelectedCandidate(prevSelected => {
          if (prevSelected && prevSelected.id === data.candidate.id) {
            return data.candidate;
          }
          return prevSelected;
        });
      } else {
        throw new Error(data.error || "Erro ao salvar");
      }
    } catch (e) {
      console.error("Save failed:", e);
      throw e;
    }
  };

  // Delete candidate
  const handleDeleteCandidate = async (id: string) => {
    try {
      const response = await fetch(`/api/candidates/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setCandidates(prev => prev.filter(c => c.id !== id));
        setSelectedCandidate(null);
      }
    } catch (e) {
      console.error("Delete candidate failed:", e);
    }
  };

  // Add new deadline
  const handleAddDeadline = async (deadlineData: any) => {
    try {
      const response = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deadlineData)
      });
      const data = await response.json();
      if (data.success) {
        setDeadlines(prev => [...prev, data.deadline]);
        // Refresh to recalculate countdowns
        fetchData();
      }
    } catch (e) {
      console.error("Failed to add deadline:", e);
    }
  };

  // Generate strategic report via AI (Gemini)
  const handleGenerateReport = async (candidateId: string, type: "Desempenho" | "Jurídico" | "Geral" | "Estratégico") => {
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, type })
      });
      const data = await response.json();
      if (data.success) {
        setReports(prev => [data.report, ...prev]);
        return data;
      }
    } catch (e) {
      console.error("Failed to generate report:", e);
      throw e;
    }
  };

  // Candidate creation submit handler
  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.number) return;

    // Build fresh candidate template
    const template: Candidate = {
      id: "cand-" + Date.now(),
      name: newCandidate.name,
      number: newCandidate.number,
      urnName: newCandidate.urnName || newCandidate.name.toUpperCase(),
      role: newCandidate.role || "Candidato(a) a Deputado(a) Estadual",
      whatsapp: newCandidate.whatsapp,
      instagram: "",
      facebook: "",
      email: newCandidate.email,
      party: newCandidate.party,
      status: newCandidate.status,
      mediaCoordinatorName: "",
      mediaCoordinatorWhatsApp: "",
      professionalBackground: "",
      areasOfInterest: "",
      teams: "",
      family: "",
      groups: "",
      trajectory: "",
      politicalFlags: "",
      keyContacts: Array(5).fill({ ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" }),
      publications: [
        {
          id: "pub-1",
          title: "Lançamento da Campanha Oficial",
          date: new Date().toISOString().split("T")[0],
          time: "10:00",
          platforms: ["Instagram", "Facebook"],
          format: "Card",
          caption: "Damos início a um novo momento por Santa Catarina! Vamos juntos nessa jornada de trabalho e conquistas. 🇧🇷✨",
          status: "Rascunho",
          lastUpdated: new Date().toISOString()
        },
        {
          id: "pub-2",
          title: "Apresentação do Perfil & Trajetória",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          time: "18:00",
          platforms: ["Instagram", "Facebook", "YouTube"],
          format: "Vídeo",
          caption: "Quem sou eu e por que luto por Santa Catarina? Assista ao vídeo e conheça nossa história! 🏥💼",
          status: "Rascunho",
          lastUpdated: new Date().toISOString()
        },
        {
          id: "pub-3",
          title: "Propostas Específicas para Saúde",
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          time: "14:00",
          platforms: ["Instagram", "WhatsApp"],
          format: "Carrossel",
          caption: "A saúde é prioridade! Conheça nossas propostas para melhorar os hospitais e diminuir as filas do SUS. 🏥💉",
          status: "Rascunho",
          lastUpdated: new Date().toISOString()
        }
      ],
      mappings: [] // Initialized by server with SC cities
    };

    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template)
      });
      const data = await response.json();
      if (data.success) {
        setCandidates(prev => [...prev, data.candidate]);
        setShowCreateModal(false);
        setNewCandidate({ name: "", number: "", urnName: "", role: "Candidato(a) a Deputado(a) Estadual", party: "PSDB", status: "Pré-Campanha", whatsapp: "", email: "" });
        // Go straight into strategic sheet view of new candidate
        setSelectedCandidate(data.candidate);
      }
    } catch (e) {
      console.error("Create candidate failed:", e);
    }
  };

  // Filter candidates list and sort in alphabetical order
  const filteredCandidates = candidates
    .filter(c => {
      const matchesSearch = 
        (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.number || "").includes(searchTerm) || 
        (c.urnName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.mappings || []).some(m => m.cityName.toLowerCase().includes(searchTerm.toLowerCase()) && m.lideranca);
      
      const matchesParty = partyFilter === "todos" || c.party === partyFilter;
      const matchesStatus = statusFilter === "todos" || c.status === statusFilter;

      return matchesSearch && matchesParty && matchesStatus;
    })
    .sort((a, b) => {
      const nameA = (a.name || a.urnName || "").trim();
      const nameB = (b.name || b.urnName || "").trim();
      return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
    });

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col">
      
      {/* 1. APP TOP BAR */}
      <header className="bg-gradient-to-r from-[#004488] to-[#002b55] text-white px-6 py-4 shadow-none border-b-4 border-[#FFD700] flex items-center justify-between no-print flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-none border border-white/20">
            <Shield size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black tracking-wider uppercase leading-none">
              Federação PSDB - Cidadania
            </h1>
            <p className="text-[10px] md:text-xs text-blue-100 font-bold tracking-wide mt-0.5 uppercase">
              Gerenciador Eleitoral Estratégico de Santa Catarina
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-none border border-white/15">
          <button 
            onClick={() => { setSelectedCandidate(null); setCurrentTab("painel"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-black transition cursor-pointer border ${
              currentTab === "painel" && !selectedCandidate ? "bg-[#FFD700] text-gray-900 border-[#1A1A1B]" : "text-blue-100 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <Users size={15} />
            Candidatos
          </button>
          <button 
            onClick={() => { setSelectedCandidate(null); setCurrentTab("regional"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-black transition cursor-pointer border ${
              currentTab === "regional" ? "bg-[#FFD700] text-gray-900 border-[#1A1A1B]" : "text-blue-100 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe size={15} />
            Visão Regional
          </button>
          <button 
            onClick={() => { setSelectedCandidate(null); setCurrentTab("calendario"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-black transition cursor-pointer border ${
              currentTab === "calendario" ? "bg-[#FFD700] text-gray-900 border-[#1A1A1B]" : "text-blue-100 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <Calendar size={15} />
            Prazos TSE
          </button>
          <button 
            onClick={() => { setSelectedCandidate(null); setCurrentTab("postagens"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-black transition cursor-pointer border ${
              currentTab === "postagens" ? "bg-[#FFD700] text-gray-900 border-[#1A1A1B]" : "text-blue-100 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe size={15} />
            Agenda de Mídias
          </button>
          <button 
            onClick={() => { setSelectedCandidate(null); setCurrentTab("relatorios"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-black transition cursor-pointer border ${
              currentTab === "relatorios" ? "bg-[#FFD700] text-gray-900 border-[#1A1A1B]" : "text-blue-100 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText size={15} />
            Gabinete de IA
          </button>
          <button 
            onClick={() => { setSelectedCandidate(null); setCurrentTab("database"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-none text-xs font-black transition cursor-pointer border ${
              currentTab === "database" ? "bg-[#FFD700] text-gray-900 border-[#1A1A1B]" : "text-blue-100 border-transparent hover:text-white hover:bg-white/5"
            }`}
          >
            <Database size={15} />
            Integração DB
          </button>
        </nav>

        {/* Database Sync Loader */}
        <div className="flex items-center gap-2 text-xs text-blue-100">
          {loading && <RefreshCw size={14} className="animate-spin text-amber-400" />}
          <span className="hidden sm:inline font-bold uppercase tracking-wider text-[10px]">TRE-SC Sincronizado</span>
        </div>
      </header>

      {/* MOBILE NAV (Visible on mobile only) */}
      <div className="bg-white border-b-2 border-[#1A1A1B] p-2 grid grid-cols-6 gap-0.5 md:hidden no-print">
        <button 
          onClick={() => { setSelectedCandidate(null); setCurrentTab("painel"); }}
          className={`flex flex-col items-center gap-1 py-1.5 rounded-none text-[9px] font-black uppercase transition ${
            currentTab === "painel" && !selectedCandidate ? "bg-amber-100 text-gray-900 border border-[#1A1A1B]" : "text-gray-500"
          }`}
        >
          <Users size={14} />
          Painel
        </button>
        <button 
          onClick={() => { setSelectedCandidate(null); setCurrentTab("regional"); }}
          className={`flex flex-col items-center gap-1 py-1.5 rounded-none text-[9px] font-black uppercase transition ${
            currentTab === "regional" ? "bg-amber-100 text-gray-900 border border-[#1A1A1B]" : "text-gray-500"
          }`}
        >
          <Globe size={14} />
          Regional
        </button>
        <button 
          onClick={() => { setSelectedCandidate(null); setCurrentTab("calendario"); }}
          className={`flex flex-col items-center gap-1 py-1.5 rounded-none text-[9px] font-black uppercase transition ${
            currentTab === "calendario" ? "bg-amber-100 text-gray-900 border border-[#1A1A1B]" : "text-gray-500"
          }`}
        >
          <Calendar size={14} />
          Prazos
        </button>
        <button 
          onClick={() => { setSelectedCandidate(null); setCurrentTab("postagens"); }}
          className={`flex flex-col items-center gap-1 py-1.5 rounded-none text-[9px] font-black uppercase transition ${
            currentTab === "postagens" ? "bg-amber-100 text-gray-900 border border-[#1A1A1B]" : "text-gray-500"
          }`}
        >
          <Globe size={14} />
          Mídias
        </button>
        <button 
          onClick={() => { setSelectedCandidate(null); setCurrentTab("relatorios"); }}
          className={`flex flex-col items-center gap-1 py-1.5 rounded-none text-[9px] font-black uppercase transition ${
            currentTab === "relatorios" ? "bg-amber-100 text-gray-900 border border-[#1A1A1B]" : "text-gray-500"
          }`}
        >
          <FileText size={14} />
          IA Relat.
        </button>
        <button 
          onClick={() => { setSelectedCandidate(null); setCurrentTab("database"); }}
          className={`flex flex-col items-center gap-1 py-1.5 rounded-none text-[9px] font-black uppercase transition ${
            currentTab === "database" ? "bg-amber-100 text-gray-900 border border-[#1A1A1B]" : "text-gray-500"
          }`}
        >
          <Database size={14} />
          Sincronia
        </button>
      </div>

      {/* 2. ERROR STATE / RECOVERY */}
      {error && (
        <div className="bg-red-50 border-b-2 border-red-200 text-red-800 p-4 text-sm font-bold flex items-center gap-2.5 justify-center no-print">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
          <button 
            onClick={fetchData} 
            className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-none border border-[#1A1A1B] text-xs transition cursor-pointer font-bold"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* 3. APP CONTENT STAGE */}
      <main className="flex-1 overflow-y-auto">
        {selectedCandidate ? (
          /* DETAILED SHEET VIEW */
          <FichaAcompanhamento 
            candidate={selectedCandidate}
            onBack={() => { setSelectedCandidate(null); fetchData(); }}
            onSaveCandidate={handleSaveCandidate}
            onDeleteCandidate={handleDeleteCandidate}
            initialTab={fichaInitialTab}
          />
        ) : (
          /* DASHBOARD CENTRAL PAGES */
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            
            {/* Top stats header (Active only on candidates view) */}
            {currentTab === "painel" && (
              <div className="space-y-6">
                <DashboardStats 
                  candidates={candidates} 
                  deadlines={deadlines} 
                  onSelectCandidate={handleSelectCandidateForFicha}
                />
                <UrgentDeadlinesWidget 
                  deadlines={deadlines}
                  onViewAll={() => setCurrentTab("calendario")}
                />
              </div>
            )}

            {/* PAGE TAB: CANDIDATES LISTING */}
            {currentTab === "painel" && (
              <div className="space-y-4 text-gray-900">
                
                {/* Search & Action bar */}
                <div className="bg-white p-4 rounded-none border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                  
                  {/* Search bar input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1B]" size={16} />
                    <input 
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome, número ou cidade de atuação..."
                      className="w-full pl-10 pr-4 py-2.5 border-2 border-[#1A1A1B] rounded-none text-sm bg-white focus:outline-[#004488] font-bold text-[#1A1A1B]"
                    />
                  </div>

                  {/* Filter elements row */}
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Party Filter */}
                    <div className="flex items-center gap-1.5 text-xs bg-white border-2 border-[#1A1A1B] px-2.5 py-1.5 rounded-none">
                      <Filter size={13} className="text-[#1A1A1B]" />
                      <span className="text-[#1A1A1B] font-black uppercase tracking-wider text-[10px]">Partido:</span>
                      <select 
                        value={partyFilter}
                        onChange={e => setPartyFilter(e.target.value)}
                        className="bg-transparent font-black text-[#004488] focus:outline-none cursor-pointer"
                      >
                        <option value="todos">Todos</option>
                        <option value="PSDB">PSDB</option>
                        <option value="Cidadania">Cidadania</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 text-xs bg-white border-2 border-[#1A1A1B] px-2.5 py-1.5 rounded-none">
                      <Layers size={13} className="text-[#1A1A1B]" />
                      <span className="text-[#1A1A1B] font-black uppercase tracking-wider text-[10px]">Status:</span>
                      <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-transparent font-black text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value="todos">Todos</option>
                        <option value="Pré-Campanha">Pré-Campanha</option>
                        <option value="Aprovado Convenção">Aprovado Convenção</option>
                        <option value="Registro Concluído">Registro Concluído</option>
                        <option value="Em Campanha">Em Campanha</option>
                        <option value="Suspenso">Suspenso</option>
                      </select>
                    </div>

                    {/* Register button */}
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#004488] hover:bg-[#003366] text-xs font-black text-white rounded-none border-2 border-[#1A1A1B] transition shadow-none cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider"
                    >
                      <Plus size={14} />
                      Novo Candidato
                    </button>
                  </div>
                </div>

                {/* Grid listing */}
                {filteredCandidates.length === 0 ? (
                  <div className="bg-[#FAF9F6] py-16 px-4 text-center rounded-none border-2 border-dashed border-[#1A1A1B] text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
                    <Users size={48} className="mx-auto text-gray-300 mb-3" />
                    <h4 className="text-base font-bold text-gray-800">Nenhum candidato encontrado</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Refine seus filtros de busca ou clique no botão "Novo Candidato" para registrar um novo membro da Federação.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCandidates.map((cand) => (
                      <CandidateCard 
                        key={cand.id} 
                        candidate={cand} 
                        onEdit={(c) => handleSelectCandidateForFicha(c, "ficha")}
                        onOpenAgenda={(c) => handleSelectCandidateForFicha(c, "agenda")}
                        onSelect={(c) => {
                          setSelectedCandidate(c);
                          setCurrentTab("relatorios"); // Go straight to AI workspace focused on candidate
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PAGE TAB: DEADLINES CALENDAR */}
            {currentTab === "calendario" && (
              <DeadlinesTracker 
                deadlines={deadlines}
                onAddDeadline={handleAddDeadline}
              />
            )}

            {/* PAGE TAB: AI STRATEGIC REPORTS */}
            {currentTab === "relatorios" && (
              <ReportGenerator 
                candidates={candidates}
                reports={reports}
                onGenerateReport={handleGenerateReport}
              />
            )}

            {/* PAGE TAB: GLOBAL MEDIA SCHEDULE */}
            {currentTab === "postagens" && (
              <PublicationsScheduleGlobal 
                candidates={candidates}
                onSelectCandidate={(cand) => handleSelectCandidateForFicha(cand, "agenda")}
              />
            )}

            {/* PAGE TAB: CONSOLIDATED REGIONAL VISION */}
            {currentTab === "regional" && (
              <RegionalVision candidates={candidates} />
            )}

            {/* PAGE TAB: DATABASE INTEGRATION & SYNC */}
            {currentTab === "database" && (
              <DatabaseSync />
            )}
          </div>
        )}
      </main>

      {/* 4. MODAL FOR CANDIDATE CREATION */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-3xs animate-fade-in no-print">
          <div className="bg-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-[#1A1A1B] max-w-md w-full overflow-hidden text-gray-900">
            <div className="bg-[#004488] border-b-2 border-[#1A1A1B] text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-wider">Novo Registro de Candidatura</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-white hover:text-amber-300 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">Candidato(a) (Nome Completo):</label>
                <input 
                  type="text"
                  required
                  value={newCandidate.name}
                  onChange={e => setNewCandidate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João da Silva Santos"
                  className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none focus:outline-none focus:border-[#004488] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">Número de Urna:</label>
                  <input 
                    type="text"
                    required
                    maxLength={5}
                    value={newCandidate.number}
                    onChange={e => setNewCandidate(prev => ({ ...prev, number: e.target.value.replace(/\D/g, "") }))}
                    placeholder="Ex: 45045"
                    className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none focus:outline-none focus:border-[#004488] font-mono font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">Nome de Urna:</label>
                  <input 
                    type="text"
                    value={newCandidate.urnName}
                    onChange={e => setNewCandidate(prev => ({ ...prev, urnName: e.target.value.toUpperCase() }))}
                    placeholder="Ex: JOÃO SILVA"
                    className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none focus:outline-none focus:border-[#004488] font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">Cargo:</label>
                  <select
                    value={newCandidate.role}
                    onChange={e => setNewCandidate(prev => ({ ...prev, role: e.target.value }))}
                    className={`w-full text-xs p-2.5 bg-white border-2 border-[#1A1A1B] rounded-none focus:outline-none font-black cursor-pointer ${
                      newCandidate.role === "Candidato(a) a Deputado(a) Federal" 
                        ? "text-emerald-700 border-emerald-600 bg-emerald-50/50" 
                        : "text-[#004488] border-[#004488] bg-blue-50/50"
                    }`}
                  >
                    <option value="Candidato(a) a Deputado(a) Estadual" className="text-[#004488] font-bold">Deputado(a) Estadual (Azul)</option>
                    <option value="Candidato(a) a Deputado(a) Federal" className="text-emerald-700 font-bold">Deputado(a) Federal (Verde)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">Partido:</label>
                  <select
                    value={newCandidate.party}
                    onChange={e => setNewCandidate(prev => ({ ...prev, party: e.target.value as any }))}
                    className="w-full text-xs p-2.5 bg-white border-2 border-[#1A1A1B] rounded-none focus:outline-none focus:border-[#004488] font-black text-[#004488] cursor-pointer"
                  >
                    <option value="PSDB">PSDB (45)</option>
                    <option value="Cidadania">Cidadania (23)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">Fase da Campanha:</label>
                  <select
                    value={newCandidate.status}
                    onChange={e => setNewCandidate(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full text-xs p-2.5 bg-white border-2 border-[#1A1A1B] rounded-none focus:outline-none focus:border-[#004488] font-black cursor-pointer"
                  >
                    <option value="Pré-Campanha">Pré-Campanha</option>
                    <option value="Aprovado Convenção">Aprovado Convenção</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">WhatsApp Oficial:</label>
                <input 
                  type="text"
                  value={newCandidate.whatsapp}
                  onChange={e => setNewCandidate(prev => ({ ...prev, whatsapp: e.target.value }))}
                  placeholder="Ex: (48) 99999-9999"
                  className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none focus:outline-none focus:border-[#004488]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-700 block mb-1 uppercase tracking-wider">E-mail Oficial:</label>
                <input 
                  type="email"
                  value={newCandidate.email}
                  onChange={e => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@campanha.com.br"
                  className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none focus:outline-none focus:border-[#004488]"
                />
              </div>

              <div className="pt-4 border-t-2 border-[#1A1A1B] flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-black uppercase text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#004488] hover:bg-[#003366] text-xs font-black uppercase text-white rounded-none border-2 border-[#1A1A1B] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                >
                  Cadastrar & Preencher Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. FOOTER */}
      <footer className="bg-[#1A1A1B] text-slate-400 text-center py-6 text-xs font-bold border-t-4 border-[#FFD700] no-print flex-shrink-0">
        <p className="uppercase tracking-wider text-slate-200">Coordenação Estadual da Federação PSDB - Cidadania de Santa Catarina &copy; 2026</p>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Plataforma restrita a membros e coordenadores partidários autorizados.</p>
      </footer>
    </div>
  );
}
