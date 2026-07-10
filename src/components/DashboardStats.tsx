import React from "react";
import { Candidate, ElectoralDeadline } from "../types";
import { Users, FileCheck2, CalendarClock, TrendingUp, Award } from "lucide-react";

interface DashboardStatsProps {
  candidates: Candidate[];
  deadlines: ElectoralDeadline[];
  onSelectCandidate?: (candidate: Candidate) => void;
}

export default function DashboardStats({ candidates, deadlines, onSelectCandidate }: DashboardStatsProps) {
  // Candidate counts
  const totalCandidates = candidates.length;
  const psdbCount = candidates.filter(c => c.party === "PSDB").length;
  const cidadaniaCount = candidates.filter(c => c.party === "Cidadania").length;

  // Publications compliance
  const totalPubs = candidates.reduce((acc, c) => acc + (c.publications || []).length, 0);
  const approvedPubs = candidates.reduce(
    (acc, c) => acc + (c.publications || []).filter(p => p.status === "Aprovado" || p.status === "Postado").length,
    0
  );
  const complianceRate = totalPubs > 0 ? Math.round((approvedPubs / totalPubs) * 100) : 0;

  // Votes target
  const totalTargetVotes = candidates.reduce((acc, c) => {
    const candidateMeta = c.mappings.reduce((sum, m) => sum + (parseInt(m.meta2026) || 0), 0);
    return acc + candidateMeta;
  }, 0);

  // Next critical deadline
  const criticalDeadlines = deadlines
    .filter(d => d.status !== "Concluído")
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  const nextDeadline = criticalDeadlines[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Candidates Overview */}
      <div className="bg-white p-5 rounded-none border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_#004488] flex flex-col justify-between" id="stat-candidates">
        <div className="geometric-divider mb-3" />
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Candidatos Registrados</span>
            <h3 className="text-3xl font-black text-[#1A1A1B] font-mono">{totalCandidates}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#004488]/10 text-[#004488] border border-[#004488]/30">
                {psdbCount} PSDB
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E6007E]/10 text-[#E6007E] border border-[#E6007E]/30">
                {cidadaniaCount} Cidadania
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-[#004488]/10 text-[#004488] border border-[#004488]/20">
            <Users size={18} />
          </div>
        </div>
      </div>

      {/* Compliance / Publications */}
      <div className="bg-white p-5 rounded-none border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_#E6007E] flex flex-col justify-between" id="stat-compliance">
        <div className="geometric-divider mb-3" style={{ background: "var(--cidadania-pink)" }} />
        <div className="flex justify-between items-start">
          <div className="w-full">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Aprovação de Publicações</span>
            <h3 className="text-3xl font-black text-[#1A1A1B] font-mono">{complianceRate}%</h3>
            
            <div className="w-full bg-gray-200 h-2 rounded-none mt-4 border border-[#1A1A1B] overflow-hidden">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500" 
                style={{ width: `${complianceRate}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-500 mt-2 block uppercase tracking-wider">
              {approvedPubs} de {totalPubs} posts OK
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FileCheck2 size={18} />
          </div>
        </div>
      </div>

      {/* Goal Target Votes */}
      <div className="bg-white p-5 rounded-none border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_#FFD700] flex flex-col justify-between" id="stat-votes">
        <div className="geometric-divider mb-3" style={{ background: "var(--psdb-blue)" }} />
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Meta de Votos (2026)</span>
            <h3 className="text-3xl font-black text-[#1A1A1B] font-mono">{totalTargetVotes.toLocaleString("pt-BR")}</h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-4 uppercase tracking-wider">
              <TrendingUp size={13} />
              Mapeamento Consolidado
            </span>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-200">
            <Award size={18} />
          </div>
        </div>
      </div>

      {/* Next Crucial Deadline */}
      <div className="bg-white p-5 rounded-none border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_#1A1A1B] flex flex-col justify-between" id="stat-deadline">
        <div className="geometric-divider mb-3" style={{ background: "#1A1A1B" }} />
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Próximo Prazo Eleitoral</span>
            {nextDeadline ? (
              <>
                <h3 className="text-sm font-black text-red-700 leading-tight truncate max-w-[170px]" title={nextDeadline.title}>
                  {nextDeadline.title}
                </h3>
                <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 mt-3 inline-block uppercase tracking-wider">
                  Faltam {nextDeadline.daysRemaining} dias
                </span>
              </>
            ) : (
              <>
                <h3 className="text-sm font-black text-gray-600">Todos Concluídos</h3>
                <span className="text-[10px] text-gray-500 mt-3 block uppercase tracking-wider">Tudo em dia</span>
              </>
            )}
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 border border-red-200">
            <CalendarClock size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
