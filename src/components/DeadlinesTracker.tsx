import React, { useState } from "react";
import { ElectoralDeadline } from "../types";
import { Calendar, AlertTriangle, CheckCircle, Clock, Plus, Filter } from "lucide-react";

interface DeadlinesTrackerProps {
  deadlines: ElectoralDeadline[];
  onAddDeadline: (deadline: any) => Promise<void>;
}

export default function DeadlinesTracker({ deadlines, onAddDeadline }: DeadlinesTrackerProps) {
  const [filter, setFilter] = useState<string>("todos");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDl, setNewDl] = useState({
    title: "",
    date: "",
    description: "",
    category: "Registro" as const
  });

  const getStatusBadge = (status: string, daysRemaining: number) => {
    switch (status) {
      case "Concluído":
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={13} />
            Concluído
          </span>
        );
      case "Crítico":
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertTriangle size={13} />
            Urgente: {daysRemaining} dias
          </span>
        );
      case "Pendente":
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={13} />
            Em {daysRemaining} dias
          </span>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Convenção": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Registro": return "bg-amber-50 text-amber-700 border-amber-100";
      case "Prestação de Contas": return "bg-sky-50 text-sky-700 border-sky-100";
      case "Propaganda": return "bg-purple-50 text-purple-700 border-purple-100";
      default: return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  // Filter deadlines
  const filteredDeadlines = deadlines.filter(d => {
    if (filter === "todos") return true;
    if (filter === "pendentes") return d.status !== "Concluído";
    if (filter === "criticos") return d.status === "Crítico";
    if (filter === "concluidos") return d.status === "Concluído";
    return d.category === filter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDl.title || !newDl.date) return;
    
    await onAddDeadline({
      ...newDl,
      status: "Pendente",
      daysRemaining: 10 // calculated on server
    });

    setNewDl({ title: "", date: "", description: "", category: "Registro" });
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-none border-2 border-[#1A1A1B] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6" id="deadlines-tracker-module">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b-2 border-[#1A1A1B]">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
            <Calendar className="text-[#004488]" size={20} />
            Controle de Prazos Eleitorais TSE (2026)
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Acompanhe datas limites cruciais para registro de candidaturas, coligações e contas eleitorais.
          </p>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-[#004488] hover:bg-[#003366] text-xs font-black text-white rounded-none border-2 border-[#1A1A1B] transition cursor-pointer"
        >
          <Plus size={14} />
          Novo Prazo
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-none border-2 border-[#1A1A1B] mb-6 text-gray-900">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 mb-3">Registrar Novo Prazo Legal</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-black text-gray-600 block mb-1 uppercase">Título do Prazo:</label>
              <input 
                type="text" 
                required
                value={newDl.title}
                onChange={e => setNewDl(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Prazo de Registro Fpolis" 
                className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none bg-white focus:outline-[#004488]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-600 block mb-1 uppercase">Data Limite:</label>
              <input 
                type="date" 
                required
                value={newDl.date}
                onChange={e => setNewDl(prev => ({ ...prev, date: e.target.value }))}
                className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none bg-white focus:outline-[#004488]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-600 block mb-1 uppercase">Categoria:</label>
              <select
                value={newDl.category}
                onChange={e => setNewDl(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none bg-white focus:outline-[#004488] font-bold"
              >
                <option value="Convenção">Convenção</option>
                <option value="Registro">Registro de Candidatura</option>
                <option value="Prestação de Contas">Prestação de Contas</option>
                <option value="Propaganda">Propaganda Eleitoral</option>
                <option value="Outro">Outros Prazos</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-[10px] font-black text-gray-600 block mb-1 uppercase">Descrição Legal:</label>
            <input 
              type="text" 
              value={newDl.description}
              onChange={e => setNewDl(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva as implicações deste prazo para a Federação..." 
              className="w-full text-xs p-2.5 border-2 border-[#1A1A1B] rounded-none bg-white focus:outline-[#004488]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 uppercase"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white rounded-none border-2 border-[#1A1A1B] cursor-pointer"
            >
              Salvar Prazo
            </button>
          </div>
        </form>
      )}

      {/* Filter and timeline tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-5 bg-gray-100 p-1.5 rounded-none border-2 border-[#1A1A1B]">
        <button 
          onClick={() => setFilter("todos")}
          className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
            filter === "todos" ? "bg-white text-gray-900 border-[#1A1A1B] shadow-3xs" : "text-gray-500 hover:text-gray-900 border-transparent"
          }`}
        >
          Todos os Prazos
        </button>
        <button 
          onClick={() => setFilter("pendentes")}
          className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
            filter === "pendentes" ? "bg-white text-gray-900 border-[#1A1A1B] shadow-3xs" : "text-gray-500 hover:text-gray-900 border-transparent"
          }`}
        >
          Pendentes
        </button>
        <button 
          onClick={() => setFilter("criticos")}
          className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
            filter === "criticos" ? "bg-white text-gray-900 border-[#1A1A1B] shadow-3xs" : "text-gray-500 hover:text-gray-900 border-transparent"
          }`}
        >
          Críticos / Urgentes
        </button>
        <button 
          onClick={() => setFilter("Convenção")}
          className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
            filter === "Convenção" ? "bg-white text-gray-900 border-[#1A1A1B] shadow-3xs" : "text-gray-500 hover:text-gray-900 border-transparent"
          }`}
        >
          Convenções
        </button>
        <button 
          onClick={() => setFilter("Registro")}
          className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
            filter === "Registro" ? "bg-white text-gray-900 border-[#1A1A1B] shadow-3xs" : "text-gray-500 hover:text-gray-900 border-transparent"
          }`}
        >
          Registros
        </button>
      </div>

      {/* Timeline items list */}
      <div className="space-y-4">
        {filteredDeadlines.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-[#1A1A1B] rounded-none text-gray-500 font-bold">
            Nenhum prazo encontrado nesta categoria.
          </div>
        ) : (
          filteredDeadlines.map((dl) => (
            <div 
              key={dl.id} 
              className={`p-4 rounded-none border-2 border-[#1A1A1B] transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                dl.status === "Concluído" ? "bg-emerald-50/10" :
                dl.status === "Crítico" ? "bg-rose-50/20" :
                "bg-white hover:bg-slate-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-none border border-[#1A1A1B] ${getCategoryColor(dl.category)}`}>
                    {dl.category}
                  </span>
                  <span className="text-xs text-gray-500 font-mono font-bold">
                    Limite: {dl.date.split("-").reverse().join("/")}
                  </span>
                </div>
                
                <h4 className={`text-sm font-black ${dl.status === "Concluído" ? "text-gray-400 line-through" : "text-[#1A1A1B]"}`}>
                  {dl.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {dl.description}
                </p>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 min-w-[120px] pt-3 md:pt-0 border-t md:border-none border-gray-100">
                {getStatusBadge(dl.status, dl.daysRemaining)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
