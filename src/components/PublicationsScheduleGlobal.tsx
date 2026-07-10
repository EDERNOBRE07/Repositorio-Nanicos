import React, { useState } from "react";
import { Candidate, CandidatePublication } from "../types";
import { 
  Search, Calendar, Clock, Globe, Filter, Users, 
  ExternalLink, CheckCircle2, AlertTriangle, PlaySquare, BookOpen
} from "lucide-react";

interface PublicationsScheduleGlobalProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
}

export default function PublicationsScheduleGlobal({ candidates, onSelectCandidate }: PublicationsScheduleGlobalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("TODOS");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("TODAS");
  const [selectedStatus, setSelectedStatus] = useState<string>("TODOS");

  // Flatten all publications with candidate reference
  interface FlatPub {
    candidate: Candidate;
    pub: CandidatePublication;
  }

  const allPubs: FlatPub[] = [];
  candidates.forEach(cand => {
    (cand.publications || []).forEach(pub => {
      allPubs.push({
        candidate: cand,
        pub
      });
    });
  });

  // Sort by date and time (most recent or closest first)
  allPubs.sort((a, b) => {
    const dateA = `${a.pub.date}T${a.pub.time || "00:00"}`;
    const dateB = `${b.pub.date}T${b.pub.time || "00:00"}`;
    return dateA.localeCompare(dateB);
  });

  // Filtering logic
  const filteredPubs = allPubs.filter(item => {
    const matchesSearch = 
      item.pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pub.caption && item.pub.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.candidate.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCandidate = selectedCandidateId === "TODOS" || item.candidate.id === selectedCandidateId;
    const matchesPlatform = selectedPlatform === "TODAS" || item.pub.platforms.includes(selectedPlatform as any);
    const matchesStatus = selectedStatus === "TODOS" || item.pub.status === selectedStatus;

    return matchesSearch && matchesCandidate && matchesPlatform && matchesStatus;
  });

  // Calculate stats
  const totalCount = allPubs.length;
  const approvedCount = allPubs.filter(p => p.pub.status === "Aprovado" || p.pub.status === "Postado").length;
  const pendingCount = allPubs.filter(p => p.pub.status === "Enviado").length;
  const postedCount = allPubs.filter(p => p.pub.status === "Postado").length;

  return (
    <div className="space-y-6">
      {/* Neo-brutalist Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Total Planejado</span>
          <span className="text-2xl font-black text-[#1A1A1B] font-mono mt-1">{totalCount}</span>
        </div>
        
        <div className="bg-emerald-50 p-4 border-2 border-emerald-500 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.2)] flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Aprovadas (OK)</span>
          <span className="text-2xl font-black text-emerald-800 font-mono mt-1">{approvedCount}</span>
        </div>

        <div className="bg-blue-50 p-4 border-2 border-blue-500 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)] flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Aguardando Revisão</span>
          <span className="text-2xl font-black text-blue-800 font-mono mt-1">{pendingCount}</span>
        </div>

        <div className="bg-purple-50 p-4 border-2 border-purple-500 shadow-[4px_4px_0px_0px_rgba(168,85,247,0.2)] flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Publicadas (No Ar)</span>
          <span className="text-2xl font-black text-purple-800 font-mono mt-1">{postedCount}</span>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-5 border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
          <Filter size={14} />
          Filtros de Pesquisa e Navegação
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por post ou candidato..."
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#1A1A1B] text-xs font-bold focus:outline-none"
            />
          </div>

          {/* Candidate Filter */}
          <select
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
            className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-none"
          >
            <option value="TODOS">TODOS OS CANDIDATOS</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.party})</option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-none"
          >
            <option value="TODAS">TODAS AS PLATAFORMAS</option>
            <option value="Instagram">INSTAGRAM</option>
            <option value="Facebook">FACEBOOK</option>
            <option value="TikTok">TIKTOK</option>
            <option value="WhatsApp">WHATSAPP</option>
            <option value="YouTube">YOUTUBE</option>
            <option value="Twitter">TWITTER</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-white border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-none"
          >
            <option value="TODOS">TODOS OS STATUS</option>
            <option value="Rascunho">RASCUNHO</option>
            <option value="Em Produção">EM PRODUÇÃO</option>
            <option value="Enviado">ENVIADO (REVISÃO)</option>
            <option value="Aprovado">APROVADO</option>
            <option value="Rejeitado">REJEITADO</option>
            <option value="Postado">POSTADO / AO VIVO</option>
          </select>
        </div>
      </div>

      {/* Publications List */}
      {filteredPubs.length === 0 ? (
        <div className="py-16 border-2 border-dashed border-[#1A1A1B] bg-[#FAF9F6] text-center">
          <Globe className="mx-auto text-gray-300 mb-2" size={40} />
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Nenhuma publicação cadastrada atende aos filtros atuais</p>
          <p className="text-[11px] text-gray-400 mt-1">Selecione um candidato no painel inicial para agendar novas postagens em sua ficha de acompanhamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPubs.map(({ candidate, pub }) => {
            const isApproved = pub.status === "Aprovado";
            const isRejected = pub.status === "Rejeitado";
            const isSubmitted = pub.status === "Enviado";
            const isPosted = pub.status === "Postado";

            return (
              <div 
                key={pub.id}
                className={`p-5 border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between ${
                  isApproved ? "bg-emerald-50/10 border-emerald-500/80" :
                  isRejected ? "bg-rose-50/10 border-rose-500/80" :
                  isSubmitted ? "bg-blue-50/10 border-blue-500/80" :
                  isPosted ? "bg-purple-50/10 border-purple-500/80" :
                  "bg-white"
                }`}
              >
                <div>
                  {/* Top Candidate & Date row */}
                  <div className="flex items-start justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-none border border-black ${
                        candidate.party === "PSDB" ? "bg-[#004488]" : "bg-[#FFD700]"
                      }`} />
                      <span className="text-[11px] font-black uppercase text-gray-800 truncate" title={candidate.name}>
                        {candidate.name}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono font-bold text-gray-500 whitespace-nowrap">
                      {pub.date.split("-").reverse().join("/")} às {pub.time || "12:00"}
                    </div>
                  </div>

                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h5 className="text-xs font-extrabold text-[#1A1A1B] leading-snug">
                      {pub.title}
                    </h5>
                    
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 border border-[#1A1A1B] whitespace-nowrap ${
                      isApproved ? "bg-emerald-100 text-emerald-800" :
                      isRejected ? "bg-rose-100 text-rose-800" :
                      isSubmitted ? "bg-blue-100 text-blue-800 animate-pulse" :
                      isPosted ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {pub.status}
                    </span>
                  </div>

                  {/* Format & Platforms info */}
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mb-3">
                    <span>FORMATO: <strong className="text-gray-700">{pub.format}</strong></span>
                    <div className="flex items-center gap-1">
                      {pub.platforms.map(p => (
                        <span key={p} className="bg-slate-100 text-slate-700 border border-slate-200 px-1 text-[8px] font-black rounded-none">
                          {p.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Caption snippet */}
                  {pub.caption && (
                    <p className="text-xs text-gray-600 bg-gray-50/50 p-2 border-l-2 border-[#1A1A1B] italic font-medium line-clamp-3 mb-4">
                      "{pub.caption}"
                    </p>
                  )}
                </div>

                {/* Card footer redirect action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  {pub.fileName ? (
                    <span className="text-[9px] font-bold text-blue-700 uppercase flex items-center gap-1">
                      📁 Mídia Anexada ({pub.fileSize || "1.0 MB"})
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                      🚫 Sem mídia anexada
                    </span>
                  )}

                  <button
                    onClick={() => onSelectCandidate(candidate)}
                    className="flex items-center gap-1 px-3 py-1 bg-[#004488] hover:bg-[#002b55] text-white text-[10px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
                  >
                    Gerenciar na Ficha
                    <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
