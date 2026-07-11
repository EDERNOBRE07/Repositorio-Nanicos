import React, { useState, useMemo } from "react";
import { Candidate, CityMapping, PartyType } from "../types";
import { SANTA_CATARINA_REGIONS, CityStats } from "../data/regionsData";
import { 
  MapPin, Users, TrendingUp, Award, ChevronDown, 
  ChevronUp, Search, Filter, Printer, Globe, HelpCircle, FileText, FileDown, RefreshCw
} from "lucide-react";

interface RegionalVisionProps {
  candidates: Candidate[];
}

export default function RegionalVision({ candidates }: RegionalVisionProps) {
  // Local UI states
  const [regionFilter, setRegionFilter] = useState<string>("TODAS");
  const [partyFilter, setPartyFilter] = useState<string>("TODOS");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [showOnlyWithActivity, setShowOnlyWithActivity] = useState<boolean>(true);
  const [isPreparingPDF, setIsPreparingPDF] = useState<boolean>(false);

  // Safe number parser for formatted strings (e.g. "1.500" -> 1500)
  const parseFormattedInt = (val: string | number | undefined | null): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number") return val;
    const cleaned = val.toString().replace(/\./g, "").replace(/,/g, "").trim();
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Safe number formatter (1500 -> "1.500")
  const formatNumber = (num: number | string | undefined): string => {
    if (num === undefined || num === null || num === "") return "0";
    const parsed = typeof num === "string" ? parseInt(num.replace(/\D/g, ""), 10) : num;
    if (isNaN(parsed)) return num.toString();
    return new Intl.NumberFormat("pt-BR").format(parsed);
  };

  // Helper to find official city statistics
  const getCityStats = (cityName: string, regionName: string): CityStats => {
    const reg = SANTA_CATARINA_REGIONS.find(r => r.region === regionName);
    if (reg) {
      const city = reg.cities.find(c => c.name === cityName);
      if (city) return city;
    }
    return { name: cityName, habitantes: 0, eleitores: 0, filiados: 0 };
  };

  // Helper to find the correct region name for a city name
  const getRegionForCity = (cityName: string): string | null => {
    const found = SANTA_CATARINA_REGIONS.find(r => 
      r.cities.some(c => c.name.toLowerCase() === cityName.toLowerCase())
    );
    return found ? found.region : null;
  };

  // Group candidate activity by region and city
  const regionalActivityData = useMemo(() => {
    const activityMap: Record<string, Record<string, { candidate: Candidate; mapping: CityMapping }[]>> = {};

    candidates.forEach(candidate => {
      // Skip candidate if party filter is active and doesn't match
      if (partyFilter !== "TODOS" && candidate.party !== partyFilter) {
        return;
      }

      const mappings = candidate.mappings || [];
      mappings.forEach(m => {
        const hasActivity = m.atuacao === true || (m.atuacao !== false && (m.lideranca || m.historicoVotos || m.meta2026));
        if (hasActivity) {
          const regionName = getRegionForCity(m.cityName) || m.region;
          const cityName = m.cityName;

          if (!activityMap[regionName]) {
            activityMap[regionName] = {};
          }
          if (!activityMap[regionName][cityName]) {
            activityMap[regionName][cityName] = [];
          }
          activityMap[regionName][cityName].push({
            candidate,
            mapping: m
          });
        }
      });
    });

    return activityMap;
  }, [candidates, partyFilter]);

  // Consolidate statistics by Region
  const consolidatedRegions = useMemo(() => {
    return SANTA_CATARINA_REGIONS.map(reg => {
      const regionName = reg.region;
      const activeCitiesMap = regionalActivityData[regionName] || {};
      const activeCityNames = Object.keys(activeCitiesMap);
      
      // Calculate list of unique candidates active in this region
      const activeCandidatesMap: Record<string, Candidate> = {};
      let totalHistoricoVotos = 0;
      let totalMeta2026 = 0;
      let totalBom = 0;
      let totalIdeal = 0;
      let totalOtimo = 0;

      activeCityNames.forEach(cityName => {
        const matches = activeCitiesMap[cityName];
        matches.forEach(({ candidate, mapping }) => {
          activeCandidatesMap[candidate.id] = candidate;
          totalHistoricoVotos += parseFormattedInt(mapping.historicoVotos);
          totalMeta2026 += parseFormattedInt(mapping.meta2026);
          totalBom += parseFormattedInt(mapping.perspectivaBom);
          totalIdeal += parseFormattedInt(mapping.perspectivaIdeal);
          totalOtimo += parseFormattedInt(mapping.perspectivaOtimo);
        });
      });

      const activeCandidates = Object.values(activeCandidatesMap);

      // Sum official TRE statistics for all cities in the region
      const regionTotalEleitores = reg.cities.reduce((sum, c) => sum + c.eleitores, 0);
      const regionTotalHabitantes = reg.cities.reduce((sum, c) => sum + c.habitantes, 0);
      const regionTotalFiliados = reg.cities.reduce((sum, c) => sum + c.filiados, 0);

      // Sum official TRE statistics only for the ACTIVE cities in this region
      const activeCitiesTotalEleitores = reg.cities
        .filter(c => activeCityNames.includes(c.name))
        .reduce((sum, c) => sum + c.eleitores, 0);

      return {
        regionName,
        totalCities: reg.cities.length,
        activeCitiesCount: activeCityNames.length,
        activeCityNames,
        activeCandidates,
        officialTotalEleitores: regionTotalEleitores,
        officialTotalHabitantes: regionTotalHabitantes,
        officialTotalFiliados: regionTotalFiliados,
        coveredEleitores: activeCitiesTotalEleitores,
        historicoVotos: totalHistoricoVotos,
        meta2026: totalMeta2026,
        perspectivaBom: totalBom,
        perspectivaIdeal: totalIdeal,
        perspectivaOtimo: totalOtimo,
        citiesData: reg.cities.map(c => {
          const candidateDetails = activeCitiesMap[c.name] || [];
          return {
            ...c,
            isActive: candidateDetails.length > 0,
            candidateDetails
          };
        })
      };
    });
  }, [regionalActivityData]);

  // Apply filters: Search query, Region selection, and activity filter
  const filteredConsolidatedRegions = useMemo(() => {
    return consolidatedRegions.filter(item => {
      // Filter by Region selection
      if (regionFilter !== "TODAS" && item.regionName !== regionFilter) {
        return false;
      }

      // Filter by activity
      if (showOnlyWithActivity && item.activeCitiesCount === 0) {
        return false;
      }

      // Filter by Search Query (searches region name, city names, active candidate names, or leaders)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const matchesRegion = item.regionName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query);
        
        const matchesCity = item.citiesData.some(c => 
          c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query)
        );

        const matchesCandidateOrLeader = item.citiesData.some(c => 
          c.candidateDetails.some(({ candidate, mapping }) => 
            candidate.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query) ||
            candidate.urnName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query) ||
            mapping.lideranca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query) ||
            mapping.situacao.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query)
          )
        );

        return matchesRegion || matchesCity || matchesCandidateOrLeader;
      }

      return true;
    });
  }, [consolidatedRegions, regionFilter, showOnlyWithActivity, searchQuery]);

  // Aggregate global totals of filtered regions for KPI blocks
  const globalKpis = useMemo(() => {
    let regionsWithPresence = 0;
    let totalActiveCities = 0;
    let totalCoveredEleitores = 0;
    let totalHistoricoVotos = 0;
    let totalMeta2026 = 0;
    let totalIdealPerspective = 0;

    let totalBomPerspective = 0;
    let totalOtimoPerspective = 0;

    // Calculate totalMeta2026 as the sum of metas of all candidates (filtered by party if active)
    totalMeta2026 = candidates
      .filter(c => partyFilter === "TODOS" || c.party === partyFilter)
      .reduce((sum, c) => {
        const candidateMeta = (c.mappings || [])
          .filter(m => m.atuacao === true || (m.atuacao !== false && (m.lideranca || m.historicoVotos || m.meta2026)))
          .reduce((s, m) => s + parseFormattedInt(m.meta2026), 0);
        return sum + candidateMeta;
      }, 0);

    filteredConsolidatedRegions.forEach(item => {
      if (item.activeCitiesCount > 0) {
        regionsWithPresence++;
      }
      totalActiveCities += item.activeCitiesCount;
      totalCoveredEleitores += item.coveredEleitores;
      totalHistoricoVotos += item.historicoVotos;
      totalIdealPerspective += item.perspectivaIdeal;
      totalBomPerspective += item.perspectivaBom;
      totalOtimoPerspective += item.perspectivaOtimo;
    });

    return {
      regionsWithPresence,
      totalActiveCities,
      totalCoveredEleitores,
      totalHistoricoVotos,
      totalMeta2026,
      totalIdealPerspective,
      totalBomPerspective,
      totalOtimoPerspective
    };
  }, [filteredConsolidatedRegions, candidates, partyFilter]);

  // Toggle single region expansion
  const toggleRegion = (regionName: string) => {
    setExpandedRegions(prev => ({
      ...prev,
      [regionName]: !prev[regionName]
    }));
  };

  // Expand or Collapse all regions
  const toggleAllRegions = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    if (expand) {
      filteredConsolidatedRegions.forEach(r => {
        newState[r.regionName] = true;
      });
    }
    setExpandedRegions(newState);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    setIsPreparingPDF(true);
    
    // Save current expanded state
    const previousExpanded = { ...expandedRegions };

    // Expand all active regions so they are visible in the print/PDF
    const allActiveExpanded: Record<string, boolean> = {};
    filteredConsolidatedRegions.forEach(item => {
      if (item.activeCitiesCount > 0) {
        allActiveExpanded[item.regionName] = true;
      }
    });
    setExpandedRegions(allActiveExpanded);

    // Give a small delay for React to render the expanded tables, then print
    setTimeout(() => {
      window.print();
      // Restore previous expanded state after printing dialog opens
      setExpandedRegions(previousExpanded);
      setIsPreparingPDF(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION (no-print) */}
      <div className="bg-white p-6 border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="bg-[#004488] text-white p-3 border-2 border-[#1A1A1B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Globe size={28} className="text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase text-[#004488]">
              Consolidação de Presença Regional
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
              Cruzamento geopolítico de lideranças, eleitores e perspectivas de voto da Federação em SC
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleExportPDF}
            disabled={isPreparingPDF}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFD700] hover:bg-[#ffe240] disabled:bg-amber-200 text-gray-900 border-2 border-[#1A1A1B] font-black text-xs uppercase tracking-wider shadow-none hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
          >
            {isPreparingPDF ? (
              <>
                <RefreshCw className="animate-spin" size={15} />
                Gerando PDF...
              </>
            ) : (
              <>
                <FileDown size={15} />
                Exportar PDF Consolidado
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FAF9F6] border-2 border-[#1A1A1B] font-black text-xs uppercase tracking-wider hover:bg-gray-100 shadow-none hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
          >
            <Printer size={15} />
            Imprimir Vista Atual
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER (Hidden on web UI) */}
      <div className="hidden print-only">
        <div className="header-container pb-4 border-b-4 border-[#004488] mb-6 flex justify-between items-center">
          <div className="header-text">
            <h1 className="text-2xl font-black text-[#004488] uppercase">Consolidação Regional da Federação</h1>
            <p className="text-xs font-bold text-gray-600 uppercase mt-1">
              Plataforma Eleitoral de Santa Catarina - Relatório de Inteligência Geopolítica (2026)
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-gray-500">
            Gerado em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
          </div>
        </div>
      </div>

      {/* FILTER & CONTROL PANEL (no-print) */}
      <div className="bg-white p-4 border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 no-print">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por região, município, candidato ou liderança..."
              className="w-full pl-10 pr-4 py-2 border-2 border-[#1A1A1B] rounded-none text-xs font-bold focus:outline-[#004488]"
            />
          </div>

          {/* Regional Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-white border-2 border-[#1A1A1B] px-3 py-2">
            <MapPin size={13} className="text-[#1A1A1B]" />
            <span className="text-[#1A1A1B] font-black uppercase tracking-wider text-[10px]">Regional:</span>
            <select 
              value={regionFilter}
              onChange={e => setRegionFilter(e.target.value)}
              className="bg-transparent font-black text-[#004488] focus:outline-none cursor-pointer text-xs"
            >
              <option value="TODAS">Todas as Regionais</option>
              {SANTA_CATARINA_REGIONS.map(r => (
                <option key={r.region} value={r.region}>{r.region}</option>
              ))}
            </select>
          </div>

          {/* Party Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-white border-2 border-[#1A1A1B] px-3 py-2">
            <Filter size={13} className="text-[#1A1A1B]" />
            <span className="text-[#1A1A1B] font-black uppercase tracking-wider text-[10px]">Partido:</span>
            <select 
              value={partyFilter}
              onChange={e => setPartyFilter(e.target.value)}
              className="bg-transparent font-black text-[#004488] focus:outline-none cursor-pointer text-xs"
            >
              <option value="TODOS">Ambos (Federação)</option>
              <option value="PSDB">Apenas PSDB</option>
              <option value="Cidadania">Apenas Cidadania</option>
            </select>
          </div>
        </div>

        {/* Extra Toggles and Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Show only active toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-black uppercase text-gray-700">
              <input 
                type="checkbox"
                checked={showOnlyWithActivity}
                onChange={e => setShowOnlyWithActivity(e.target.checked)}
                className="rounded-none border-2 border-[#1A1A1B] text-[#004488] focus:ring-[#004488] h-4 w-4 cursor-pointer"
              />
              Apenas regiões com atuação ativa
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-extrabold uppercase">Ações Rápidas:</span>
            <button
              onClick={() => toggleAllRegions(true)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 font-bold text-[10px] uppercase cursor-pointer"
            >
              Expandir Todas
            </button>
            <button
              onClick={() => toggleAllRegions(false)}
              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 font-bold text-[10px] uppercase cursor-pointer"
            >
              Recolher Todas
            </button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS (Always visible, clean grid) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white p-4 border-2 border-[#1A1A1B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Regionais Mapeadas</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black font-mono text-[#004488]">
              {globalKpis.regionsWithPresence}
            </span>
            <span className="text-xs text-gray-400 font-bold">/ {SANTA_CATARINA_REGIONS.length}</span>
          </div>
          <div className="border-t border-gray-100 pt-1.5 mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold">
            <MapPin size={11} className="text-gray-400" /> Cobertura de Estado
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 border-2 border-[#1A1A1B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Cidades Ativas</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black font-mono text-gray-800">
              {globalKpis.totalActiveCities}
            </span>
            <span className="text-xs text-gray-400 font-bold">/ 295 SC</span>
          </div>
          <div className="border-t border-gray-100 pt-1.5 mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold">
            <Users size={11} className="text-gray-400" /> Presença nos Municípios
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 border-2 border-[#1A1A1B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Eleitores Cobertos</span>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-slate-800 leading-none">
              {formatNumber(globalKpis.totalCoveredEleitores)}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-1.5 mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold">
            <Award size={11} className="text-amber-500" /> Base de Eleitores TRE
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 border-2 border-[#1A1A1B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Histórico de Votos</span>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-blue-800 leading-none">
              {formatNumber(globalKpis.totalHistoricoVotos)}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-1.5 mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold">
            <TrendingUp size={11} className="text-blue-500" /> Votos Consolidados SC
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-emerald-50 border-2 border-[#1A1A1B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Meta Consolidada 2026</span>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-emerald-800 leading-none">
              {formatNumber(globalKpis.totalMeta2026)}
            </span>
          </div>
          <div className="border-t border-emerald-100 pt-1.5 mt-2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
            <TrendingUp size={11} className="text-emerald-500 animate-pulse" /> Alvo Eleitoral Federação
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-blue-50 border-2 border-[#1A1A1B] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-blue-700 tracking-wider">Meta Cenário Ideal</span>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-blue-800 leading-none">
              {formatNumber(globalKpis.totalIdealPerspective)}
            </span>
          </div>
          <div className="border-t border-blue-100 pt-1.5 mt-2 flex items-center gap-1 text-[10px] text-blue-600 font-bold">
            <Award size={11} className="text-blue-500" /> Projeção Otimizada
          </div>
        </div>
      </div>

      {/* CORE: CONSOLIDATED REGIONS TABLE */}
      <div className="bg-white border-2 border-[#1A1A1B] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        
        <div className="bg-gradient-to-r from-[#004488] to-[#002b55] text-white px-5 py-3 border-b-2 border-[#1A1A1B] flex items-center justify-between">
          <h3 className="font-sans font-black text-xs uppercase tracking-wider">
            Tabela Consolidada de Mapeamento por Região
          </h3>
          <span className="bg-[#FFD700] text-gray-900 text-[10px] font-black uppercase px-2.5 py-0.5 border border-[#1A1A1B]">
            {filteredConsolidatedRegions.length} Região(ões) Filtrada(s)
          </span>
        </div>

        {filteredConsolidatedRegions.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
            <h4 className="text-base font-bold text-gray-800">Nenhum dado consolidado</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Nenhuma regional corresponde aos filtros de busca ativos ou nenhuma possui atividade registrada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b-2 border-[#1A1A1B] text-gray-800 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center no-print"></th>
                  <th className="py-3 px-4">Região (Regional)</th>
                  <th className="py-3 px-4">Municípios</th>
                  <th className="py-3 px-4">Candidatos Atuantes</th>
                  <th className="py-3 px-4 text-right">Eleitores TRE (Ativos)</th>
                  <th className="py-3 px-4 text-right">Votos Históricos</th>
                  <th className="py-3 px-4 text-right text-emerald-800 bg-emerald-50/40">Meta 2026</th>
                  <th className="py-3 px-4 text-center bg-blue-50/20">Cenários (B / I / Ó)</th>
                  <th className="py-3 px-4 text-center w-24 no-print">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-100 text-xs">
                {filteredConsolidatedRegions.map(item => {
                  const isExpanded = !!expandedRegions[item.regionName];
                  
                  return (
                    <React.Fragment key={item.regionName}>
                      {/* Main Region Row */}
                      <tr className={`hover:bg-slate-50 transition ${item.activeCitiesCount > 0 ? "font-semibold text-gray-900" : "text-gray-400 bg-gray-50/40"}`}>
                        
                        {/* Toggle expand chevron (no-print) */}
                        <td className="py-3 px-4 text-center no-print">
                          {item.activeCitiesCount > 0 ? (
                            <button
                              onClick={() => toggleRegion(item.regionName)}
                              className="p-1.5 border border-gray-300 hover:border-gray-600 rounded-none bg-white transition text-[#004488] cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        {/* Region Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-black tracking-tight text-gray-900 text-xs uppercase">
                              {item.regionName}
                            </span>
                            {item.activeCitiesCount > 0 && (
                              <span className="bg-blue-100 text-blue-800 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm border border-blue-200">
                                Ativo
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block font-normal mt-0.5">
                            {formatNumber(item.officialTotalEleitores)} eleitores no total regional
                          </span>
                        </td>

                        {/* Mapped cities fraction */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-800 font-mono">
                            {item.activeCitiesCount} <span className="text-gray-400 font-normal">/ {item.totalCities}</span>
                          </span>
                          <span className="text-[10px] text-gray-400 block font-normal mt-0.5">
                            cidades com atuação
                          </span>
                        </td>

                        {/* Active candidates badges */}
                        <td className="py-3 px-4">
                          {item.activeCandidates.length === 0 ? (
                            <span className="text-gray-400 italic text-[11px]">Nenhum candidato mapeado</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {item.activeCandidates.map(cand => {
                                const isPSDB = cand.party === "PSDB";
                                return (
                                  <span 
                                    key={cand.id}
                                    className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-sm border inline-flex items-center gap-1 shadow-2xs ${
                                      isPSDB 
                                        ? "bg-blue-50 text-blue-800 border-blue-200" 
                                        : "bg-pink-50 text-pink-800 border-pink-200"
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isPSDB ? "bg-blue-500" : "bg-[#E6007E]"}`}></span>
                                    {cand.urnName || cand.name.split(" ")[0]} ({cand.number})
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* TRE Electors of active cities */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-gray-700">
                          {item.activeCitiesCount > 0 ? formatNumber(item.coveredEleitores) : "-"}
                          <span className="text-[9px] text-gray-400 block font-normal mt-0.5">
                            {item.activeCitiesCount > 0 ? `${Math.round((item.coveredEleitores / item.officialTotalEleitores) * 100)}% de cobertura` : "sem cobertura"}
                          </span>
                        </td>

                        {/* Aggregated Historico Votos */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-800">
                          {item.historicoVotos > 0 ? formatNumber(item.historicoVotos) : "-"}
                          <span className="text-[9px] text-gray-400 block font-normal mt-0.5">
                            voto histórico
                          </span>
                        </td>

                        {/* Aggregated Goal 2026 */}
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/20">
                          {item.meta2026 > 0 ? formatNumber(item.meta2026) : "-"}
                          {item.meta2026 > 0 && item.historicoVotos > 0 && (
                            <span className="text-[9px] text-emerald-600 block font-normal mt-0.5">
                              +{Math.round(((item.meta2026 - item.historicoVotos) / item.historicoVotos) * 100)}% de cresc.
                            </span>
                          )}
                        </td>

                        {/* Scenario Perspectives Bom/Ideal/Otimo */}
                        <td className="py-3 px-4 text-center bg-blue-50/10 font-mono text-[10px]">
                          {item.activeCitiesCount > 0 ? (
                            <div className="inline-flex rounded-sm overflow-hidden border border-gray-200 leading-none">
                              <span className="px-1.5 py-1 bg-gray-50 text-gray-700 border-r border-gray-200" title="Consolidado Bom">
                                B: <strong className="font-bold">{item.perspectivaBom ? formatNumber(item.perspectivaBom) : "-"}</strong>
                              </span>
                              <span className="px-1.5 py-1 bg-blue-50 text-blue-800 border-r border-gray-200" title="Consolidado Ideal">
                                I: <strong className="font-bold">{item.perspectivaIdeal ? formatNumber(item.perspectivaIdeal) : "-"}</strong>
                              </span>
                              <span className="px-1.5 py-1 bg-emerald-50 text-emerald-800" title="Consolidado Ótimo">
                                Ó: <strong className="font-bold">{item.perspectivaOtimo ? formatNumber(item.perspectivaOtimo) : "-"}</strong>
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        {/* Row Toggle Actions (no-print) */}
                        <td className="py-3 px-4 text-center no-print">
                          {item.activeCitiesCount > 0 ? (
                            <button
                              onClick={() => toggleRegion(item.regionName)}
                              className="text-xs font-black text-[#004488] hover:underline uppercase cursor-pointer"
                            >
                              {isExpanded ? "Fechar" : "Detalhar"}
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Sub-Table containing City breakdowns */}
                      {isExpanded && item.activeCitiesCount > 0 && (
                        <tr>
                          <td colSpan={9} className="bg-[#FCFCFB] px-6 py-4 border-l-4 border-[#004488]">
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase text-[#004488] tracking-wider flex items-center gap-1.5">
                                  <MapPin size={13} />
                                  Detalhamento de Cidades e Candidatos Ativos - Regional {item.regionName}
                                </h4>
                                <span className="text-[10px] text-gray-400 font-bold">
                                  Mostrando apenas municípios com atividade de campanha
                                </span>
                              </div>

                              <div className="border border-gray-300 rounded-none overflow-hidden shadow-xs">
                                <table className="w-full text-left border-collapse bg-white">
                                  <thead>
                                    <tr className="bg-gray-100 border-b border-gray-300 text-[9px] font-black uppercase tracking-wider text-gray-600">
                                      <th className="py-2 px-3">Município (TRE SC)</th>
                                      <th className="py-2 px-3">Candidato</th>
                                      <th className="py-2 px-3">Liderança Mapeada</th>
                                      <th className="py-2 px-3 text-right">Histórico (Votos)</th>
                                      <th className="py-2 px-3 text-right text-emerald-800 bg-emerald-50/20">Meta 2026</th>
                                      <th className="py-2 px-3 text-center bg-blue-50/10">Cenários (B / I / Ó)</th>
                                      <th className="py-2 px-3">Situação Local / Diagnóstico Geopolítico</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 text-[11px]">
                                    {item.citiesData
                                      .filter(c => c.isActive) // Show only cities that have candidates mapped
                                      .map(c => {
                                        const cityStats = getCityStats(c.name, item.regionName);
                                        
                                        return c.candidateDetails.map(({ candidate, mapping }, idx) => {
                                          const isPSDB = candidate.party === "PSDB";
                                          
                                          return (
                                            <tr key={`${c.name}-${candidate.id}-${idx}`} className="hover:bg-slate-50/40">
                                              
                                              {/* City Column (Rowspanned or listed on each row) */}
                                              <td className="py-2 px-3 font-bold border-r border-gray-100">
                                                {idx === 0 ? (
                                                  <div>
                                                    <span className="text-gray-900 uppercase font-black">{c.name}</span>
                                                    <span className="text-[9px] text-gray-400 block font-bold font-mono mt-0.5">
                                                      Eleitores: {formatNumber(cityStats.eleitores)} | Habitantes: {formatNumber(cityStats.habitantes)}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="text-gray-300 italic text-[10px]">Mesma cidade</span>
                                                )}
                                              </td>

                                              {/* Candidate info */}
                                              <td className="py-2 px-3 border-r border-gray-100">
                                                <div className="flex items-center gap-1.5">
                                                  <span className={`w-2 h-2 rounded-full ${isPSDB ? "bg-blue-500" : "bg-[#E6007E]"}`}></span>
                                                  <div>
                                                    <span className="font-extrabold text-gray-900 uppercase">
                                                      {candidate.name}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400 block font-black">
                                                      {candidate.party} | Nº {candidate.number}
                                                    </span>
                                                  </div>
                                                </div>
                                              </td>

                                              {/* Mapped Leader */}
                                              <td className="py-2 px-3 border-r border-gray-100">
                                                {mapping.lideranca ? (
                                                  <span className="font-bold text-gray-800">{mapping.lideranca}</span>
                                                ) : (
                                                  <span className="text-gray-400 italic">Sem líder definido</span>
                                                )}
                                              </td>

                                              {/* Candidate historical votes in this city */}
                                              <td className="py-2 px-3 text-right font-mono font-bold text-gray-700 border-r border-gray-100">
                                                {formatNumber(mapping.historicoVotos) !== "0" ? formatNumber(mapping.historicoVotos) : "-"}
                                              </td>

                                              {/* Candidate meta 2026 in this city */}
                                              <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/10 border-r border-gray-100">
                                                {formatNumber(mapping.meta2026) !== "0" ? formatNumber(mapping.meta2026) : "-"}
                                              </td>

                                              {/* Candidate perspective scenarios in this city */}
                                              <td className="py-2 px-3 text-center bg-blue-50/5 border-r border-gray-100 font-mono text-[10px]">
                                                <div className="inline-flex rounded-sm overflow-hidden border border-gray-150 leading-none">
                                                  <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 border-r border-gray-150" title="Cenário Bom">
                                                    B: {mapping.perspectivaBom ? formatNumber(mapping.perspectivaBom) : "-"}
                                                  </span>
                                                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border-r border-gray-150" title="Cenário Ideal">
                                                    I: {mapping.perspectivaIdeal ? formatNumber(mapping.perspectivaIdeal) : "-"}
                                                  </span>
                                                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700" title="Cenário Ótimo">
                                                    Ó: {mapping.perspectivaOtimo ? formatNumber(mapping.perspectivaOtimo) : "-"}
                                                  </span>
                                                </div>
                                              </td>

                                              {/* Candidate situation notes */}
                                              <td className="py-2 px-3 max-w-xs text-gray-600 leading-relaxed text-[10px]">
                                                {mapping.situacao ? (
                                                  <p className="line-clamp-2" title={mapping.situacao}>{mapping.situacao}</p>
                                                ) : (
                                                  <span className="text-gray-400 italic">Nenhum comentário</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        });
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#FAF9F6] border-t-2 border-[#1A1A1B] text-gray-900 text-xs font-black uppercase tracking-wider">
                <tr className="bg-slate-100/80">
                  <td className="py-3 px-4 no-print"></td>
                  <td className="py-3 px-4 font-black">Total Consolidado</td>
                  <td className="py-3 px-4 font-mono font-bold text-gray-800">
                    {globalKpis.totalActiveCities} <span className="text-gray-400 font-normal">cidades</span>
                  </td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-700">
                    {formatNumber(globalKpis.totalCoveredEleitores)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-800">
                    {formatNumber(globalKpis.totalHistoricoVotos)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50/40">
                    {formatNumber(globalKpis.totalMeta2026)}
                  </td>
                  <td className="py-3 px-4 text-center bg-blue-50/20 font-mono text-[10px]">
                    <div className="inline-flex rounded-sm overflow-hidden border border-gray-200 leading-none">
                      <span className="px-1.5 py-1 bg-gray-50 text-gray-700 border-r border-gray-200" title="Total Bom">
                        B: <strong className="font-bold">{formatNumber(globalKpis.totalBomPerspective)}</strong>
                      </span>
                      <span className="px-1.5 py-1 bg-blue-50 text-blue-800 border-r border-gray-200" title="Total Ideal">
                        I: <strong className="font-bold">{formatNumber(globalKpis.totalIdealPerspective)}</strong>
                      </span>
                      <span className="px-1.5 py-1 bg-emerald-50 text-emerald-800" title="Total Ótimo">
                        Ó: <strong className="font-bold">{formatNumber(globalKpis.totalOtimoPerspective)}</strong>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* STRATEGIC REMARKS (no-print) */}
      <div className="bg-amber-50/40 p-4 border-2 border-dashed border-[#FFD700] rounded-none flex items-start gap-3 no-print">
        <HelpCircle size={18} className="text-[#004488] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-gray-900 block font-black uppercase mb-1">Como ler a Consolidação Regional:</strong>
          <p className="mb-1">
            Esta tabela agrega os dados de <strong>{candidates.length} candidatos</strong> da Federação. 
            Os <strong>"Eleitores TRE (Ativos)"</strong> são calculados somando o eleitorado oficial das cidades onde pelo menos um candidato possui atuação mapeada.
          </p>
          <p>
            Caso múltiplos candidatos declarem atuação na mesma cidade, seus <strong>Votos Históricos</strong> e <strong>Metas 2026</strong> são consolidados, permitindo à coordenação estadual enxergar a meta agregada por regional partidária. Clique em <strong>"Detalhar"</strong> para examinar as lideranças locais específicas.
          </p>
        </div>
      </div>
    </div>
  );
}
