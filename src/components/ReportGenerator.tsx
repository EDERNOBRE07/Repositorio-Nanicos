import React, { useState } from "react";
import { Candidate, PartyReport } from "../types";
import { FileText, Award, Calendar, RefreshCw, Send, Check, ShieldAlert, Sparkles } from "lucide-react";

interface ReportGeneratorProps {
  candidates: Candidate[];
  reports: PartyReport[];
  onGenerateReport: (candidateId: string, type: "Desempenho" | "Jurídico" | "Geral" | "Estratégico") => Promise<any>;
}

export default function ReportGenerator({ candidates, reports, onGenerateReport }: ReportGeneratorProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [reportType, setReportType] = useState<"Desempenho" | "Jurídico" | "Geral" | "Estratégico">("Jurídico");
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<PartyReport | null>(reports[0] || null);
  const [filterType, setFilterType] = useState<string>("todos");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) return;
    
    setLoading(true);
    try {
      const generated = await onGenerateReport(selectedCandidateId, reportType);
      if (generated && generated.report) {
        setActiveReport(generated.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeBadge = (type: string) => {
    switch (type) {
      case "Jurídico": return "bg-red-50 text-red-700 border-red-100";
      case "Desempenho": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Estratégico": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Geral":
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterType === "todos") return true;
    return r.type === filterType;
  });

  return (
    <div className="bg-white rounded-none border-2 border-[#1A1A1B] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6" id="reports-generator-module">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[#1A1A1B]">
        <Sparkles className="text-blue-700 animate-pulse" size={24} />
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
            Relatórios Estratégicos Automatizados (IA)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Gere análises de viabilidade jurídica, potencial de votação e diretrizes de campanha por Inteligência Artificial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left pane: Generator Form & History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Generator Form */}
          <div className="bg-slate-50 p-4 rounded-none border-2 border-[#1A1A1B] text-gray-900">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">Solicitar Nova Análise</h4>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-600 block mb-1 uppercase">Candidato(a):</label>
                <select
                  required
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border-2 border-[#1A1A1B] rounded-none focus:outline-blue-600 font-bold"
                >
                  <option value="">Selecione o candidato...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.urnName} ({c.party}) - Nº {c.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-600 block mb-1 uppercase">Tipo de Análise:</label>
                <div className="grid grid-cols-2 gap-1.5 bg-gray-200 p-1 rounded-none border-2 border-[#1A1A1B]">
                  {(["Jurídico", "Desempenho", "Estratégico", "Geral"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReportType(type)}
                      className={`py-1.5 text-[10px] font-black rounded-none text-center transition cursor-pointer ${
                        reportType === type 
                          ? "bg-white text-gray-900 border border-[#1A1A1B] shadow-3xs" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedCandidateId}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-xs font-black text-white rounded-none border-2 border-[#1A1A1B] transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={13} />
                    Gerando Relatório com IA...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Gerar Relatório de Inteligência
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Histórico</h4>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="text-[11px] font-bold bg-white border-2 border-[#1A1A1B] rounded-none p-1 text-gray-700 focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="Jurídico">Jurídico</option>
                <option value="Desempenho">Desempenho</option>
                <option value="Estratégico">Estratégico</option>
                <option value="Geral">Geral</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredReports.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 bg-slate-50 border-2 border-dashed border-[#1A1A1B]">
                  Nenhum relatório gerado ainda.
                </div>
              ) : (
                filteredReports.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveReport(r)}
                    className={`w-full text-left p-2.5 rounded-none border-2 transition text-xs flex items-center justify-between gap-2 cursor-pointer ${
                      activeReport?.id === r.id 
                        ? "border-[#004488] bg-blue-50/20 shadow-[2px_2px_0px_0px_#004488]" 
                        : "border-[#1A1A1B] bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-gray-900 truncate">{r.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString("pt-BR")} | Por {r.author}
                      </p>
                    </div>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-none border border-[#1A1A1B] ${getReportTypeBadge(r.type)}`}>
                      {r.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Report Reader Viewport */}
        <div className="lg:col-span-2">
          {activeReport ? (
            <div className="bg-[#fcfcfc] border-2 border-[#1A1A1B] rounded-none p-6 md:p-8 shadow-[6px_6px_0px_0px_#FFD700] flex flex-col h-full text-gray-900 relative">
              {/* Report Header styling */}
              <div className="border-b-2 border-[#1A1A1B] pb-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-none border border-[#1A1A1B] ${getReportTypeBadge(activeReport.type)}`}>
                    RELATÓRIO {activeReport.type}
                  </span>
                  <span className="text-xs text-gray-500 font-mono font-bold">
                    Gerado em: {new Date(activeReport.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-3 tracking-tight uppercase">
                  {activeReport.title}
                </h3>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase">
                  Autor: <strong className="text-gray-800 font-black">{activeReport.author}</strong> &nbsp;|&nbsp; 
                  Candidato(a): <strong className="text-[#004488] font-black">{activeReport.candidateName || "N/A"}</strong>
                </p>
              </div>

              {/* Document/Paper Body */}
              <div className="prose prose-sm max-w-none flex-1 text-gray-800 leading-relaxed overflow-y-auto max-h-[380px] whitespace-pre-line bg-white p-5 rounded-none border-2 border-[#1A1A1B]">
                {activeReport.content}
              </div>

              {/* Watermark of compliance */}
              <div className="mt-4 pt-3 border-t-2 border-[#1A1A1B] flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
                <span>Federação PSDB-Cidadania SC &copy; 2026</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <Check size={13} className="stroke-[3]" />
                  Validação Interna da Coordenação Partidária
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 bg-[#fafafa] rounded-none border-2 border-dashed border-[#1A1A1B] text-gray-500">
              <FileText size={40} className="text-gray-300 mb-3" />
              <p className="font-black uppercase text-xs tracking-wider text-gray-700">Nenhum relatório selecionado</p>
              <p className="text-xs text-gray-400 mt-2 max-w-xs text-center font-medium">
                Selecione um relatório do histórico ou use o gerador de IA na lateral esquerda para formular uma análise.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
