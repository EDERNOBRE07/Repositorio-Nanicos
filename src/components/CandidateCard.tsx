import React, { useState } from "react";
import { Candidate } from "../types";
import { UserCheck, FileCheck2, MapPin, Eye, AlertCircle, Phone } from "lucide-react";

interface CandidateCardProps {
  key?: string;
  candidate: Candidate;
  onEdit: (candidate: Candidate) => void;
  onOpenAgenda?: (candidate: Candidate) => void;
  onSelect: (candidate: Candidate) => void;
}

export default function CandidateCard({ candidate, onEdit, onOpenAgenda, onSelect }: CandidateCardProps) {
  const [imageError, setImageError] = useState(false);
  const approvedPubs = (candidate.publications || []).filter(p => p.status === "Aprovado" || p.status === "Postado").length;
  const totalPubs = (candidate.publications || []).length;
  const pubPercentage = totalPubs > 0 ? Math.round((approvedPubs / totalPubs) * 100) : 0;
  
  // Cities with active data
  const mappedCities = candidate.mappings.filter(m => m.atuacao).length;
  const totalMeta = candidate.mappings.filter(m => m.atuacao).reduce((sum, m) => sum + (parseInt(m.meta2026) || 0), 0);

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pré-Campanha": return "bg-sky-50 text-sky-700 border-sky-200";
      case "Aprovado Convenção": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Registro Concluído": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Em Campanha": return "bg-blue-50 text-[#004488] border-blue-200";
      case "Suspenso": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const isPsdb = candidate.party === "PSDB";

  return (
    <div 
      className={`bg-white rounded-none border-2 border-[#1A1A1B] transition-all duration-300 hover:translate-x-[-2px] hover:translate-y-[-2px] flex flex-col h-full ${
        isPsdb 
          ? "shadow-[4px_4px_0px_0px_#004488] hover:shadow-[6px_6px_0px_0px_#004488]" 
          : "shadow-[4px_4px_0px_0px_#FFD700] hover:shadow-[6px_6px_0px_0px_#FFD700]"
      }`}
      id={`candidate-card-${candidate.id}`}
    >
      {/* Upper header color bar with geometric separator */}
      <div className={`h-3 ${isPsdb ? "bg-[#004488]" : "bg-[#FFD700]"} border-b-2 border-[#1A1A1B]`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Row 1: Photo and name */}
        <div className="flex items-start gap-4 mb-4">
          {candidate.photoUrl && !imageError ? (
            <img 
              src={candidate.photoUrl} 
              alt={candidate.name} 
              className="w-[60px] h-[80px] rounded-none object-cover border-2 border-[#1A1A1B] flex-shrink-0"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-[60px] h-[80px] rounded-none flex flex-col items-center justify-center font-black text-lg flex-shrink-0 border-2 border-[#1A1A1B] ${
              isPsdb ? "bg-[#004488]/10 text-[#004488]" : "bg-amber-50 text-amber-700"
            }`}>
              {candidate.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-none border border-[#1A1A1B] uppercase tracking-wider ${
                isPsdb ? "bg-[#004488] text-white" : "bg-[#FFD700] text-black"
              }`}>
                {candidate.party}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-none border border-[#1A1A1B] ${getStatusColor(candidate.status)}`}>
                {candidate.status}
              </span>
            </div>
            
            <h4 className="text-base font-black text-[#1A1A1B] mt-2 truncate" title={candidate.name}>
              {candidate.name}
            </h4>
            <p className="text-xs text-gray-500 font-mono font-medium">
              Nº {candidate.number || "---"} &nbsp;|&nbsp; Urna: {candidate.urnName || "N/A"}
            </p>
          </div>
        </div>

        {/* Section divider */}
        <hr className="border-t-2 border-[#1A1A1B] my-2" />

        {/* Info Blocks */}
        <div className="space-y-3 flex-1">
          {/* WhatsApp / Contato */}
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <Phone size={14} className="text-[#1A1A1B] flex-shrink-0" />
            <span className="font-medium truncate">{candidate.whatsapp || "Sem contato cadastrado"}</span>
          </div>

          {/* Publication Agenda compliance percentage */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenAgenda) onOpenAgenda(candidate);
            }}
            className="group cursor-pointer hover:bg-slate-50 p-1.5 border-2 border-dashed border-transparent hover:border-[#1A1A1B] transition-all"
            title="Clique para gerenciar a Agenda de Publicações"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-700 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px] group-hover:text-[#004488]">
                <FileCheck2 size={14} className="text-[#1A1A1B]" />
                Publicações ({approvedPubs}/{totalPubs})
              </span>
              <span className={`font-black ${pubPercentage === 100 ? "text-emerald-600" : pubPercentage >= 50 ? "text-blue-600" : "text-amber-600"}`}>
                {pubPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-none border border-[#1A1A1B] overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  pubPercentage === 100 ? "bg-emerald-500" : pubPercentage >= 50 ? "bg-[#004488]" : "bg-amber-500"
                }`}
                style={{ width: `${pubPercentage}%` }}
              />
            </div>
            <div className="text-[9px] text-gray-400 font-extrabold uppercase mt-1 text-right group-hover:text-[#004488]">
              Clique para agendar e gerenciar →
            </div>
          </div>

          {/* Geo mapping stat */}
          <div className="bg-slate-50 p-2.5 rounded-none border-2 border-[#1A1A1B] flex items-center justify-between text-xs">
            <span className="text-gray-700 font-medium flex items-center gap-1">
              <MapPin size={14} className="text-[#1A1A1B]" />
              Cidades Ativas: <strong className="text-[#1A1A1B] font-bold">{mappedCities}</strong>
            </span>
            <span className="text-gray-700 text-right">
              Meta: <strong className="text-[#004488] font-bold">{totalMeta.toLocaleString("pt-BR")}</strong>
            </span>
          </div>
        </div>

        {/* Warning if publications are pending or rejected */}
        {pubPercentage < 100 && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-amber-900 bg-amber-50 p-2 rounded-none border border-[#1A1A1B]">
            <AlertCircle size={13} className="flex-shrink-0 text-amber-700" />
            <span className="truncate uppercase tracking-wider">Postagens pendentes</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t-2 border-[#1A1A1B]">
          <button 
            onClick={() => onSelect(candidate)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-none border-2 border-[#1A1A1B] text-xs font-bold text-[#1A1A1B] bg-white hover:bg-gray-100 transition cursor-pointer"
            title="Ver Relatório de Candidatura"
          >
            <Eye size={13} />
            Relatórios
          </button>
          
          <button 
            onClick={() => onEdit(candidate)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-none border-2 border-[#1A1A1B] text-xs font-black text-white transition cursor-pointer ${
              isPsdb ? "bg-[#004488] hover:bg-[#002b55]" : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            Ficha Completa
          </button>
        </div>
      </div>
    </div>
  );
}
