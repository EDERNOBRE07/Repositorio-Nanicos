import React, { useState, useEffect, useRef, useCallback } from "react";
import { Candidate, CandidatePublication, PublicationStatusType, KeyContact, CityMapping, CampaignStatusType, PartyType } from "../types";
import { 
  ArrowLeft, Save, Upload, CheckCircle2, AlertCircle, FileText, 
  HelpCircle, Trash2, Printer, Check, X, MessageSquare, AlertTriangle,
  Search, Edit2, Filter, Calendar, Clock, Plus, Link2, Globe, FileVideo, Image
} from "lucide-react";
import { SANTA_CATARINA_REGIONS } from "../data/regionsData";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const getStartOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
};

const compressImage = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const normalizeCandidate = (c: Candidate): Candidate => {
  if (!c) return c;
  return {
    ...c,
    mappings: (c.mappings || []).map(m => ({
      ...m,
      atuacao: m.atuacao ?? (m.lideranca || m.historicoVotos || m.meta2026 ? true : false)
    }))
  };
};

interface FichaAcompanhamentoProps {
  candidate: Candidate;
  onBack: () => void;
  onSaveCandidate: (candidate: Candidate) => Promise<void>;
  onDeleteCandidate?: (id: string) => void;
  initialTab?: "ficha" | "agenda";
}

export default function FichaAcompanhamento({ candidate, onBack, onSaveCandidate, onDeleteCandidate, initialTab = "ficha" }: FichaAcompanhamentoProps) {
  // Local state initialized with candidate prop
  const [formData, setFormData] = useState<Candidate>(() => normalizeCandidate(candidate));
  const [saveStatus, setSaveStatus] = useState<"salvo" | "digitando" | "salvando" | "erro">("salvo");
  const [activeTab, setActiveTab] = useState<"ficha" | "agenda">(initialTab);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Publications states
  const [pubSearchQuery, setPubSearchQuery] = useState("");
  const [pubPlatformFilter, setPubPlatformFilter] = useState("TODAS");
  const [pubStatusFilter, setPubStatusFilter] = useState("TODOS");
  const [pubFormatFilter, setPubFormatFilter] = useState("TODOS");
  const [pubPostTypeFilter, setPubPostTypeFilter] = useState("TODOS");
  const [pubAreaFilter, setPubAreaFilter] = useState("TODOS");
  const [planningViewMode, setPlanningViewMode] = useState<"diario" | "semanal" | "mensal">("mensal");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 6, 10)); // July 10, 2026
  const [currentMonth, setCurrentMonth] = useState<number>(6); // July
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [editingPubId, setEditingPubId] = useState<string | null>(null);
  const [pubEditForm, setPubEditForm] = useState<Partial<CandidatePublication>>({});
  const [showNewPubModal, setShowNewPubModal] = useState(false);
  
  // Ref for tracking the latest data to prevent stale closures during debounced save
  const dataRef = useRef<Candidate>(formData);
  dataRef.current = formData;

  // Debounced Auto-save logic
  useEffect(() => {
    // Every time formData changes, if it is different from candidate, set status to digitando
    // then set a timeout to save
    if (JSON.stringify(formData) === JSON.stringify(normalizeCandidate(candidate))) {
      return;
    }

    setSaveStatus("digitando");
    const delayDebounce = setTimeout(async () => {
      setSaveStatus("salvando");
      try {
        await onSaveCandidate(dataRef.current);
        setSaveStatus("salvo");
      } catch (e) {
        console.error("Auto-save failed:", e);
        setSaveStatus("erro");
      }
    }, 1500); // Save 1.5 seconds after typing stops

    return () => clearTimeout(delayDebounce);
  }, [formData, onSaveCandidate]);

  // Synchronize when candidate prop changes (e.g., initial load or manual refresh)
  useEffect(() => {
    setFormData(normalizeCandidate(candidate));
    setSaveStatus("salvo");
    setActiveTab(initialTab);
    setImageError(false);
  }, [candidate, initialTab]);

  // Helper to change single fields
  const handleFieldChange = (field: keyof Candidate, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && typeof value === "string") {
        if (!prev.urnName || prev.urnName === prev.name.toUpperCase()) {
          updated.urnName = value.toUpperCase();
        }
      }
      return updated;
    });
  };

  // Helper to change contacts table
  const handleContactChange = (index: number, field: keyof KeyContact, value: string) => {
    setFormData(prev => {
      const updatedContacts = [...prev.keyContacts];
      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value
      };
      return {
        ...prev,
        keyContacts: updatedContacts
      };
    });
  };

  // Geographic mapping custom states
  const [isEditingMappings, setIsEditingMappings] = useState(false);
  const [mappingDrafts, setMappingDrafts] = useState<CityMapping[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("TODAS");
  const [atuacaoFilter, setAtuacaoFilter] = useState<"todos" | "atuando">("todos");
  const [mappingViewMode, setMappingViewMode] = useState<"cards" | "tabela">("cards");
  const [editingRegional, setEditingRegional] = useState<string | null>(null);
  const [regionalDrafts, setRegionalDrafts] = useState<CityMapping[]>([]);

  const openEditRegionalModal = (regionName: string) => {
    const reg = SANTA_CATARINA_REGIONS.find(r => r.region === regionName);
    if (!reg) return;
    const drafts = reg.cities.map(city => getCityMapping(city.name, reg.region));
    setEditingRegional(regionName);
    setRegionalDrafts(drafts);
  };

  const handleRegionalDraftChange = (cityId: string, field: keyof CityMapping, value: any) => {
    setRegionalDrafts(prev => prev.map(m => {
      if (m.cityId === cityId) {
        const updated = { ...m, [field]: value };
        if (field === "atuacao" && value === true) {
          let filiados = 0;
          for (const reg of SANTA_CATARINA_REGIONS) {
            const city = reg.cities.find(c => c.name === m.cityName);
            if (city) {
              filiados = city.filiados || 0;
              break;
            }
          }
          const metaVal = Math.round((filiados * 0.10) * 3);
          const bomVal = Math.round(metaVal * 0.80);
          const idealVal = metaVal;
          const otimoVal = Math.round(metaVal * 1.20);

          updated.meta2026 = String(metaVal);
          updated.perspectivaBom = String(bomVal);
          updated.perspectivaIdeal = String(idealVal);
          updated.perspectivaOtimo = String(otimoVal);
        }
        if (field !== "atuacao" && value && !m.atuacao) {
          updated.atuacao = true;
        }
        return updated;
      }
      return m;
    }));
  };

  const saveRegionalChanges = async () => {
    if (isEditingMappings) {
      setMappingDrafts(prev => {
        const copy = [...prev];
        regionalDrafts.forEach(draft => {
          const idx = copy.findIndex(m => m.cityId === draft.cityId);
          if (idx >= 0) {
            copy[idx] = draft;
          } else {
            copy.push(draft);
          }
        });
        return copy;
      });
      setEditingRegional(null);
      setRegionalDrafts([]);
    } else {
      setSaveStatus("salvando");
      const currentMappings = [...(formData.mappings || [])];
      regionalDrafts.forEach(draft => {
        const idx = currentMappings.findIndex(m => m.cityId === draft.cityId);
        if (idx >= 0) {
          currentMappings[idx] = draft;
        } else {
          currentMappings.push(draft);
        }
      });
      
      const updatedCandidate = {
        ...formData,
        mappings: currentMappings
      };
      
      try {
        await onSaveCandidate(updatedCandidate);
        setFormData(updatedCandidate);
        setSaveStatus("salvo");
        setEditingRegional(null);
        setRegionalDrafts([]);
      } catch (e) {
        console.error("Failed to save regional mappings:", e);
        setSaveStatus("erro");
      }
    }
  };

  // Number formatter for demographic and vote numbers
  const formatNumber = (num: number | string | undefined) => {
    if (num === undefined || num === null || num === "") return "-";
    const parsed = typeof num === "string" ? parseInt(num, 10) : num;
    if (isNaN(parsed)) return num.toString();
    return new Intl.NumberFormat("pt-BR").format(parsed);
  };

  // Helper to find a specific city mapping inside active draft or saved state
  const getCityMapping = useCallback((cityName: string, regionName: string): CityMapping => {
    const cityId = cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    const sourceList = isEditingMappings ? mappingDrafts : (formData.mappings || []);
    
    const found = sourceList.find(m => m.cityName === cityName || m.cityId === cityId);
    if (found) return found;
    
    return {
      cityId,
      cityName,
      region: regionName,
      lideranca: "",
      historicoVotos: "",
      meta2026: "",
      situacao: "",
      atuacao: false,
      perspectivaBom: "",
      perspectivaIdeal: "",
      perspectivaOtimo: ""
    };
  }, [isEditingMappings, mappingDrafts, formData.mappings]);

  // Entering edit mode
  const startEditingMappings = () => {
    const initialDrafts: CityMapping[] = [];
    SANTA_CATARINA_REGIONS.forEach(reg => {
      reg.cities.forEach(city => {
        const cityId = city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
        const existing = (formData.mappings || []).find(m => m.cityName === city.name || m.cityId === cityId);
        if (existing) {
          initialDrafts.push({
            ...existing,
            atuacao: existing.atuacao ?? (existing.lideranca || existing.historicoVotos || existing.meta2026 ? true : false)
          });
        } else {
          initialDrafts.push({
            cityId,
            cityName: city.name,
            region: reg.region,
            lideranca: "",
            historicoVotos: "",
            meta2026: "",
            situacao: "",
            atuacao: false,
            perspectivaBom: "",
            perspectivaIdeal: "",
            perspectivaOtimo: ""
          });
        }
      });
    });
    setMappingDrafts(initialDrafts);
    setIsEditingMappings(true);
  };

  // Editing values in draft
  const handleDraftChange = (cityId: string, field: keyof CityMapping, value: any) => {
    setMappingDrafts(prev => prev.map(m => {
      if (m.cityId === cityId) {
        const updated = { ...m, [field]: value };
        if (field === "atuacao" && value === true) {
          let filiados = 0;
          for (const reg of SANTA_CATARINA_REGIONS) {
            const city = reg.cities.find(c => c.name === m.cityName);
            if (city) {
              filiados = city.filiados || 0;
              break;
            }
          }
          const metaVal = Math.round((filiados * 0.10) * 3);
          const bomVal = Math.round(metaVal * 0.80);
          const idealVal = metaVal;
          const otimoVal = Math.round(metaVal * 1.20);

          updated.meta2026 = String(metaVal);
          updated.perspectivaBom = String(bomVal);
          updated.perspectivaIdeal = String(idealVal);
          updated.perspectivaOtimo = String(otimoVal);
        }
        // If they checked atuacao, or filled lideranca/meta/historico, make sure atuacao is set
        if (field !== "atuacao" && value && !m.atuacao) {
          updated.atuacao = true;
        }
        return updated;
      }
      return m;
    }));
  };

  // Saving mappings back to Candidate and writing to db
  const saveMappings = async () => {
    setSaveStatus("salvando");
    const updatedCandidate = {
      ...formData,
      mappings: mappingDrafts
    };
    
    try {
      await onSaveCandidate(updatedCandidate);
      setFormData(updatedCandidate);
      setSaveStatus("salvo");
      setIsEditingMappings(false);
    } catch (e) {
      console.error("Failed to save mappings:", e);
      setSaveStatus("erro");
    }
  };

  // Canceling and discarding draft
  const cancelEditingMappings = () => {
    setIsEditingMappings(false);
    setMappingDrafts([]);
  };

  // Publications scheduling & saving
  const handleSavePublication = async (pub: CandidatePublication) => {
    setSaveStatus("salvando");
    const currentPubs = formData.publications || [];
    const exists = currentPubs.some(p => p.id === pub.id);
    
    let updatedPubs: CandidatePublication[];
    if (exists) {
      updatedPubs = currentPubs.map(p => p.id === pub.id ? { ...pub, lastUpdated: new Date().toISOString() } : p);
    } else {
      updatedPubs = [...currentPubs, { ...pub, id: pub.id || "pub-" + Date.now(), lastUpdated: new Date().toISOString() }];
    }
    
    const updatedCandidate = {
      ...formData,
      publications: updatedPubs
    };
    
    try {
      await onSaveCandidate(updatedCandidate);
      setFormData(updatedCandidate);
      setSaveStatus("salvo");
      setEditingPubId(null);
      setShowNewPubModal(false);
    } catch (e) {
      console.error("Failed to save publication:", e);
      setSaveStatus("erro");
    }
  };

  const handleDeletePublication = async (pubId: string) => {
    if (!window.confirm("Deseja realmente excluir esta publicação do cronograma?")) return;
    
    setSaveStatus("salvando");
    const currentPubs = formData.publications || [];
    const updatedPubs = currentPubs.filter(p => p.id !== pubId);
    
    const updatedCandidate = {
      ...formData,
      publications: updatedPubs
    };
    
    try {
      await onSaveCandidate(updatedCandidate);
      setFormData(updatedCandidate);
      setSaveStatus("salvo");
    } catch (e) {
      console.error("Failed to delete publication:", e);
      setSaveStatus("erro");
    }
  };

  const handlePublicationUpload = async (pubId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeMB} MB`;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        setSaveStatus("salvando");
        const response = await fetch(`/api/candidates/${formData.id}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pubId,
            fileName: file.name,
            fileSize: sizeStr,
            base64
          })
        });
        const resData = await response.json();
        if (resData.success) {
          const updatedPublications = (formData.publications || []).map(p => {
            if (p.id === pubId) {
              return {
                ...p,
                status: "Enviado" as PublicationStatusType,
                fileName: file.name,
                fileSize: sizeStr,
                lastUpdated: new Date().toISOString()
              };
            }
            return p;
          });
          const nextData = {
            ...formData,
            publications: updatedPublications
          };
          setFormData(nextData);
          await onSaveCandidate(nextData);
          setSaveStatus("salvo");
        } else {
          setSaveStatus("erro");
        }
      } catch (error) {
        console.error("Publication file upload failed:", error);
        setSaveStatus("erro");
      }
    };
    reader.readAsDataURL(file);
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setPhotoUploading(true);
    const file = files[0];

    const reader = new FileReader();
    reader.onload = async () => {
      const originalBase64 = reader.result as string;
      try {
        const base64 = await compressImage(originalBase64);
        const response = await fetch(`/api/candidates/${formData.id}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docId: "photo",
            fileName: file.name,
            base64
          })
        });
        const resData = await response.json();
        if (resData.success) {
          const nextData = {
            ...formData,
            photoUrl: resData.candidate.photoUrl
          };
          setFormData(nextData);
          setImageError(false);
          await onSaveCandidate(nextData);
          setSaveStatus("salvo");
        } else {
          setSaveStatus("erro");
        }
      } catch (error) {
        console.error("Photo upload failed:", error);
        setSaveStatus("erro");
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Change Publication validation state (Coordinator Actions)
  const handlePublicationStatus = async (pubId: string, status: PublicationStatusType, reason?: string, postUrl?: string) => {
    try {
      setSaveStatus("salvando");
      const response = await fetch(`/api/candidates/${formData.id}/publication-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubId, status, rejectReason: reason, postUrl })
      });
      const resData = await response.json();
      if (resData.success) {
        setFormData(prev => ({
          ...prev,
          publications: (prev.publications || []).map(p => {
            if (p.id === pubId) {
              return {
                ...p,
                status,
                rejectReason: status === "Rejeitado" ? reason : undefined,
                postUrl: status === "Postado" ? postUrl || p.postUrl : p.postUrl,
                lastUpdated: new Date().toISOString()
              };
            }
            return p;
          })
        }));
        setSaveStatus("salvo");
      }
    } catch (e) {
      console.error("Failed to update publication status", e);
      setSaveStatus("erro");
    }
  };

  const handleManualSave = async () => {
    setSaveStatus("salvando");
    try {
      await onSaveCandidate(formData);
      setSaveStatus("salvo");
    } catch (e) {
      console.error("Manual save failed:", e);
      setSaveStatus("erro");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isPsdb = formData.party === "PSDB";

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top sticky action panel */}
      <div className="sticky top-0 bg-white border-b-2 border-[#1A1A1B] z-10 px-6 py-4 shadow-none flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-transparent hover:border-[#1A1A1B] rounded-none transition cursor-pointer"
            title="Voltar ao Painel"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">{formData.name || formData.urnName || "Novo Candidato"}</h2>
              <span className={`text-[10px] px-2 py-0.5 font-black uppercase rounded-none border border-[#1A1A1B] ${isPsdb ? "bg-[#004488] text-white" : "bg-[#FFD700] text-gray-900"}`}>
                {formData.party}
              </span>
            </div>
            {/* Auto-save indicators */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {saveStatus === "salvo" && (
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <CheckCircle2 size={13} className="stroke-[3]" />
                  Todas as alterações salvas no banco de dados
                </span>
              )}
              {saveStatus === "digitando" && (
                <span className="text-xs text-amber-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 animate-pulse">
                  <AlertCircle size={13} />
                  Alterações detectadas... clique em salvar ou aguarde o auto-salvamento
                </span>
              )}
              {saveStatus === "salvando" && (
                <span className="text-xs text-blue-700 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3 text-blue-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gravando no banco de dados...
                </span>
              )}
              {saveStatus === "erro" && (
                <span className="text-xs text-red-700 font-black uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <AlertCircle size={13} />
                  Falha ao salvar. Verifique sua conexão.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs switch */}
          <div className="flex bg-gray-200 border-2 border-[#1A1A1B] rounded-none p-1 mr-4">
            <button
              onClick={() => setActiveTab("ficha")}
              className={`px-4 py-1.5 rounded-none text-xs font-black uppercase transition cursor-pointer ${
                activeTab === "ficha" 
                  ? "bg-white text-gray-900 border border-[#1A1A1B] shadow-3xs" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Ficha Estratégica
            </button>
            <button
              onClick={() => setActiveTab("agenda")}
              className={`px-4 py-1.5 rounded-none text-xs font-black uppercase transition cursor-pointer ${
                activeTab === "agenda" 
                  ? "bg-white text-gray-900 border border-[#1A1A1B] shadow-3xs" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Agenda de Publicações ({(formData.publications || []).filter(p => p.status === "Aprovado" || p.status === "Postado").length}/{(formData.publications || []).length})
            </button>
          </div>

          <button
            onClick={handleManualSave}
            disabled={saveStatus === "salvando"}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#1A1A1B] text-xs font-black uppercase text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed rounded-none transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer"
          >
            <Save size={15} />
            {saveStatus === "salvando" ? "Gravando..." : "Salvar Alterações"}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 border-2 border-[#1A1A1B] text-xs font-black uppercase text-gray-700 bg-white hover:bg-gray-50 rounded-none transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer"
          >
            <Printer size={15} />
            Imprimir Ficha
          </button>

          {onDeleteCandidate && (
            <button
              onClick={() => {
                if (window.confirm("Deseja realmente remover este candidato e excluir todas as informações associadas?")) {
                  onDeleteCandidate(formData.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-800 border-2 border-[#1A1A1B] hover:bg-red-200 text-xs font-black uppercase rounded-none transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] cursor-pointer"
            >
              <Trash2 size={15} />
              Excluir Registro
            </button>
          )}
        </div>
      </div>

      {/* Main Form content wrapper */}
      <div className="max-w-5xl mx-auto p-4 md:p-8 no-print">
        {activeTab === "ficha" ? (
          /* SECTION 1: FICHA ESTRATÉGICA EDITABLE */
          <div className="bg-white rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-2 border-[#1A1A1B] p-6 md:p-10 text-gray-900 relative">
            {/* Cabecalho da Ficha */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#004488] pb-5 mb-6 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-black text-[#004488] uppercase tracking-wide">Ficha de Acompanhamento Estratégico</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-500 font-bold">Partido:</label>
                    <select 
                      value={formData.party} 
                      onChange={(e) => handleFieldChange("party", e.target.value as PartyType)}
                      className="border-b border-gray-300 font-bold focus:border-[#004488] focus:outline-hidden bg-transparent"
                    >
                      <option value="PSDB">PSDB</option>
                      <option value="Cidadania">Cidadania</option>
                    </select>
                  </div>
                  <span>|</span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-500 font-bold">Cargo:</label>
                    <select 
                      value={formData.role || "Candidato(a) a Deputado(a) Estadual"} 
                      onChange={(e) => handleFieldChange("role", e.target.value)}
                      className={`border-b-2 font-black text-xs px-2 py-0.5 rounded-none focus:outline-hidden cursor-pointer ${
                        formData.role === "Candidato(a) a Deputado(a) Federal"
                          ? "text-emerald-800 border-emerald-600 bg-emerald-50"
                          : "text-[#004488] border-[#004488] bg-blue-50"
                      }`}
                    >
                      <option value="Candidato(a) a Deputado(a) Estadual" className="text-[#004488] font-bold">Candidato(a) a Deputado(a) Estadual (Azul)</option>
                      <option value="Candidato(a) a Deputado(a) Federal" className="text-emerald-800 font-bold">Candidato(a) a Deputado(a) Federal (Verde)</option>
                    </select>
                  </div>
                  <span>|</span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-gray-500 font-bold">Fase:</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => handleFieldChange("status", e.target.value as CampaignStatusType)}
                      className="border-b border-gray-300 font-bold text-gray-700 focus:border-[#004488] focus:outline-hidden bg-transparent"
                    >
                      <option value="Pré-Campanha">Pré-Campanha</option>
                      <option value="Aprovado Convenção">Aprovado Convenção</option>
                      <option value="Registro Concluído">Registro Concluído</option>
                      <option value="Em Campanha">Em Campanha</option>
                      <option value="Suspenso">Suspenso</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Photo Box upload */}
              <div className="relative group">
                <label className="cursor-pointer block">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="hidden" 
                  />
                  {formData.photoUrl && !imageError ? (
                    <div className="w-28 h-36 border-2 border-[#bbbbbb] rounded-md overflow-hidden relative shadow-sm">
                      <img 
                        src={formData.photoUrl} 
                        alt={formData.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-semibold text-center transition-opacity">
                        Alterar Foto
                      </div>
                    </div>
                  ) : (
                    <div className="w-28 h-36 border-2 border-dashed border-[#bbbbbb] bg-[#f8f9fa] rounded-md flex flex-col justify-center items-center text-center p-2 text-xs text-gray-600 font-bold hover:bg-gray-100 transition">
                      <Upload size={20} className="text-gray-400 mb-1.5" />
                      <span>Foto Oficial</span>
                      <span className="text-[10px] text-gray-400 font-normal mt-0.5">(Clique/Anexar)</span>
                    </div>
                  )}
                </label>
                {photoUploading && (
                  <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 text-[#004488]" />
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO: DADOS DO CANDIDATO */}
            <div className="bg-[#004488] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-sm tracking-wider mb-4">
              Dados do(a) Candidato(a)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Candidato(a):</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="Nome completo do candidato"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm font-semibold focus:border-[#004488] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Número de Urna (Nº):</label>
                <input 
                  type="text"
                  maxLength={5}
                  value={formData.number}
                  onChange={(e) => handleFieldChange("number", e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 45045"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm font-mono font-bold focus:border-[#004488] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Nome de Urna:</label>
                <input 
                  type="text"
                  value={formData.urnName}
                  onChange={(e) => handleFieldChange("urnName", e.target.value)}
                  placeholder="Como aparecerá na urna eletrônica"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm font-semibold focus:border-[#004488] focus:outline-hidden"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">WhatsApp Oficial:</label>
                <input 
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleFieldChange("whatsapp", e.target.value)}
                  placeholder="Ex: (48) 99999-9999"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Instagram:</label>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1 text-sm">@</span>
                  <input 
                    type="text"
                    value={formData.instagram.replace(/^@/, "")}
                    onChange={(e) => handleFieldChange("instagram", "@" + e.target.value)}
                    placeholder="usuario"
                    className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Facebook:</label>
                <input 
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => handleFieldChange("facebook", e.target.value)}
                  placeholder="Nome do perfil/página"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-4">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">E-mail Oficial de Campanha:</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="contato@campanha.com.br"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>
            </div>

            {/* SEÇÃO: RESPONSÁVEL DE MÍDIAS */}
            <div className="bg-[#004488] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-sm tracking-wider mb-4">
              Responsável pelas Mídias Sociais
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Nome do Responsável de Mídias:</label>
                <input 
                  type="text"
                  value={formData.mediaCoordinatorName}
                  onChange={(e) => handleFieldChange("mediaCoordinatorName", e.target.value)}
                  placeholder="Coordenador de Comunicação"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">WhatsApp do Responsável:</label>
                <input 
                  type="text"
                  value={formData.mediaCoordinatorWhatsApp}
                  onChange={(e) => handleFieldChange("mediaCoordinatorWhatsApp", e.target.value)}
                  placeholder="Ex: (48) 99999-9999"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>
            </div>

            {/* SEÇÃO: PERFIL E ATUAÇÃO */}
            <div className="bg-[#004488] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-sm tracking-wider mb-4">
              Atuação Profissional e Redes
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Atuação Profissional / Ocupação atual:</label>
                <input 
                  type="text"
                  value={formData.professionalBackground}
                  onChange={(e) => handleFieldChange("professionalBackground", e.target.value)}
                  placeholder="Sua principal ocupação profissional ou cargos exercidos anteriormente"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-6">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Áreas de Interesse Estratégico:</label>
                <input 
                  type="text"
                  value={formData.areasOfInterest}
                  onChange={(e) => handleFieldChange("areasOfInterest", e.target.value)}
                  placeholder="Ex: Saúde Pública, Desenvolvimento Agrícola, Educação Técnica, Infraestrutura Municipal"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Equipes de Campanha:</label>
                <input 
                  type="text"
                  value={formData.teams}
                  onChange={(e) => handleFieldChange("teams", e.target.value)}
                  placeholder="Ex: Equipe Sul, Frente de Juventude"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Família / Conexões Familiares:</label>
                <input 
                  type="text"
                  value={formData.family}
                  onChange={(e) => handleFieldChange("family", e.target.value)}
                  placeholder="Bases familiares influentes"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Grupos Organizados / Apoios:</label>
                <input 
                  type="text"
                  value={formData.groups}
                  onChange={(e) => handleFieldChange("groups", e.target.value)}
                  placeholder="Sindicatos, igrejas, clubes de serviço"
                  className="w-full border-b border-[#bbbbbb] py-1 text-sm focus:border-[#004488] focus:outline-hidden"
                />
              </div>
            </div>

            {/* SEÇÃO: TRAJETÓRIA E BANDEIRAS (LINE TEXTAREAS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="bg-[#004488] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-sm tracking-wider mb-2">
                  Trajetória Breve
                </div>
                <textarea 
                  value={formData.trajectory}
                  onChange={(e) => handleFieldChange("trajectory", e.target.value)}
                  rows={4}
                  placeholder="Resumo biográfico do candidato focado em conquistas anteriores e preparo político"
                  className="w-full p-3 text-sm bg-amber-50/20 border border-[#cccccc] rounded-lg focus:border-[#004488] focus:outline-hidden leading-relaxed"
                  style={{
                    backgroundImage: "linear-gradient(#ffffff 24px, #e2e8f0 25px)",
                    backgroundSize: "100% 25px"
                  }}
                />
              </div>

              <div>
                <div className="bg-[#004488] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-sm tracking-wider mb-2">
                  Bandeiras Políticas
                </div>
                <textarea 
                  value={formData.politicalFlags}
                  onChange={(e) => handleFieldChange("politicalFlags", e.target.value)}
                  rows={4}
                  placeholder="Os principais pilares programáticos que fundamentam a sua candidatura à Assembleia Legislativa"
                  className="w-full p-3 text-sm bg-amber-50/20 border border-[#cccccc] rounded-lg focus:border-[#004488] focus:outline-hidden leading-relaxed"
                  style={{
                    backgroundImage: "linear-gradient(#ffffff 24px, #e2e8f0 25px)",
                    backgroundSize: "100% 25px"
                  }}
                />
              </div>
            </div>

            {/* SEÇÃO: REGISTRO DE CONTATOS CHAVE */}
            <div className="bg-[#004488] text-white font-bold text-xs uppercase px-3 py-1.5 rounded-sm tracking-wider mb-4">
              Contatos e Articuladores Chave da Campanha (Foco Local)
            </div>
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-[#bbbbbb] text-xs">
                <thead>
                  <tr className="bg-[#e6f0fa]">
                    <th className="border border-[#bbbbbb] p-2 text-left text-[#004488] font-bold uppercase tracking-wider" style={{ width: "32%" }}>Nome (Lado A)</th>
                    <th className="border border-[#bbbbbb] p-2 text-left text-[#004488] font-bold uppercase tracking-wider" style={{ width: "18%" }}>WhatsApp (Lado A)</th>
                    <th className="border border-[#bbbbbb] p-2 text-left text-[#004488] font-bold uppercase tracking-wider" style={{ width: "32%" }}>Nome (Lado B)</th>
                    <th className="border border-[#bbbbbb] p-2 text-left text-[#004488] font-bold uppercase tracking-wider" style={{ width: "18%" }}>WhatsApp (Lado B)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const contact = formData.keyContacts[idx] || { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" };
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="border border-[#bbbbbb] p-1.5">
                          <input 
                            type="text"
                            value={contact.ladoAName}
                            onChange={(e) => handleContactChange(idx, "ladoAName", e.target.value)}
                            placeholder="Nome do articulador local"
                            className="w-full bg-transparent border-none py-0.5 px-1 focus:outline-hidden font-medium"
                          />
                        </td>
                        <td className="border border-[#bbbbbb] p-1.5 font-mono">
                          <input 
                            type="text"
                            value={contact.ladoAWhatsApp}
                            onChange={(e) => handleContactChange(idx, "ladoAWhatsApp", e.target.value)}
                            placeholder="Telefone/Whats"
                            className="w-full bg-transparent border-none py-0.5 px-1 focus:outline-hidden"
                          />
                        </td>
                        <td className="border border-[#bbbbbb] p-1.5">
                          <input 
                            type="text"
                            value={contact.ladoBName}
                            onChange={(e) => handleContactChange(idx, "ladoBName", e.target.value)}
                            placeholder="Liderança de apoio municipal"
                            className="w-full bg-transparent border-none py-0.5 px-1 focus:outline-hidden font-medium"
                          />
                        </td>
                        <td className="border border-[#bbbbbb] p-1.5 font-mono">
                          <input 
                            type="text"
                            value={contact.ladoBWhatsApp}
                            onChange={(e) => handleContactChange(idx, "ladoBWhatsApp", e.target.value)}
                            placeholder="Telefone/Whats"
                            className="w-full bg-transparent border-none py-0.5 px-1 focus:outline-hidden"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SEÇÃO: MAPEAMENTO E DADOS ELEITORAIS */}
            <div className="mt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-[#004488] rounded-xs"></div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Mapeamento Geográfico e Planejamento Eleitoral (Santa Catarina)
                  </h3>
                </div>
                
                {/* Botão de Editar / Salvar */}
                <div>
                  {!isEditingMappings ? (
                    <button
                      type="button"
                      onClick={startEditingMappings}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-[#004488] font-bold text-xs uppercase tracking-wider border-2 border-[#004488] rounded-md shadow-xs transition-all cursor-pointer"
                    >
                      <Edit2 size={14} />
                      Editar Planejamento
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEditingMappings}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-md transition-all cursor-pointer"
                      >
                        <X size={14} />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveMappings}
                        className="flex items-center gap-1 px-4 py-1.5 bg-[#004488] hover:bg-[#003366] text-white font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-all cursor-pointer"
                      >
                        <Check size={14} />
                        Salvar Mapeamento
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* PAINEL DE MÉTRICAS ACUMULADAS */}
              {(() => {
                const allCityMappingsList = isEditingMappings ? mappingDrafts : (formData.mappings || []);
                const activeMappings = allCityMappingsList.filter(m => m.atuacao);
                const totalCitiesAtuacao = activeMappings.length;
                
                let sumHabitantes = 0;
                let sumEleitores = 0;
                let sumFiliados = 0;
                
                activeMappings.forEach(mapping => {
                  for (const reg of SANTA_CATARINA_REGIONS) {
                    const foundCity = reg.cities.find(c => c.name === mapping.cityName);
                    if (foundCity) {
                      sumHabitantes += foundCity.habitantes;
                      sumEleitores += foundCity.eleitores;
                      sumFiliados += foundCity.filiados;
                      break;
                    }
                  }
                });

                const sumHistoricoVotos = activeMappings.reduce((acc, m) => acc + (parseInt(m.historicoVotos, 10) || 0), 0);
                const sumMeta2026 = activeMappings.reduce((acc, m) => acc + (parseInt(m.meta2026, 10) || 0), 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <div className={`border rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all ${
                      totalCitiesAtuacao > 0 
                        ? "bg-emerald-400 border-emerald-500 text-black" 
                        : "bg-[#f8f9fa] border-[#bbbbbb]"
                    }`}>
                      <div className={`text-[10px] uppercase font-extrabold tracking-wider ${
                        totalCitiesAtuacao > 0 ? "text-neutral-800" : "text-gray-500"
                      }`}>Cidades Ativas</div>
                      <div className={`text-lg font-black font-mono mt-0.5 ${
                        totalCitiesAtuacao > 0 ? "text-black" : "text-[#004488]"
                      }`}>{totalCitiesAtuacao} <span className={`text-xs font-normal ${
                        totalCitiesAtuacao > 0 ? "text-neutral-700" : "text-gray-400"
                      }`}>/ 295</span></div>
                    </div>
                    <div className="bg-[#f8f9fa] border border-[#bbbbbb] rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all">
                      <div className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">Habitantes Cobertos</div>
                      <div className="text-lg font-black text-gray-800 font-mono mt-0.5">{formatNumber(sumHabitantes)}</div>
                    </div>
                    <div className="bg-[#f8f9fa] border border-[#bbbbbb] rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all">
                      <div className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">Eleitores Cobertos</div>
                      <div className="text-lg font-black text-gray-800 font-mono mt-0.5">{formatNumber(sumEleitores)}</div>
                    </div>
                    <div className="bg-[#f8f9fa] border border-[#bbbbbb] rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all">
                      <div className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">Filiados Cobertos</div>
                      <div className="text-lg font-black text-amber-600 font-mono mt-0.5">{formatNumber(sumFiliados)}</div>
                    </div>
                    <div className="bg-[#f8f9fa] border border-[#bbbbbb] rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all">
                      <div className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">Votos Históricos</div>
                      <div className="text-lg font-black text-gray-800 font-mono mt-0.5">{formatNumber(sumHistoricoVotos)}</div>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 shadow-2xs hover:shadow-xs transition-all">
                      <div className="text-[10px] text-emerald-600 uppercase font-extrabold tracking-wider">Meta Total 2026</div>
                      <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">{formatNumber(sumMeta2026)}</div>
                    </div>
                  </div>
                );
              })()}

              {/* BARRA DE FILTROS E BUSCA */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Busca */}
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filtrar por município..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#004488] focus:border-[#004488] transition-all"
                    />
                  </div>
                  
                  {/* Filtro Regional */}
                  <div className="relative">
                    <select
                      value={selectedRegionFilter}
                      onChange={(e) => setSelectedRegionFilter(e.target.value)}
                      className="block w-full py-1.5 pl-3 pr-8 border border-gray-300 rounded-md text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-[#004488] focus:border-[#004488] transition-all"
                    >
                      <option value="TODAS">Todas as Regionais (45)</option>
                      {SANTA_CATARINA_REGIONS.map(r => (
                        <option key={r.region} value={r.region}>{r.region}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filtro por Atuação e Modo de Visualização */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase">Ver:</span>
                    <div className="inline-flex rounded-md border border-gray-300 p-0.5 bg-gray-100">
                      <button
                        type="button"
                        onClick={() => setAtuacaoFilter("todos")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
                          atuacaoFilter === "todos"
                            ? "bg-white text-gray-800 shadow-2xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Todos os Municípios
                      </button>
                      <button
                        type="button"
                        onClick={() => setAtuacaoFilter("atuando")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
                          atuacaoFilter === "atuando"
                            ? "bg-emerald-600 text-white font-extrabold shadow-2xs"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Cidades de Atuação
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-gray-500 uppercase">Visualização:</span>
                    <div className="inline-flex rounded-md border border-gray-300 p-0.5 bg-gray-100">
                      <button
                        type="button"
                        onClick={() => setMappingViewMode("cards")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
                          mappingViewMode === "cards"
                            ? "bg-white text-[#004488] shadow-2xs font-extrabold"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Regionais (Cards)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMappingViewMode("tabela")}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-sm transition-all cursor-pointer ${
                          mappingViewMode === "tabela"
                            ? "bg-white text-[#004488] shadow-2xs font-extrabold"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Tabela de Municípios
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RENDERIZAÇÃO CARDS OU TABELA DE MAPEAMENTO */}
              {mappingViewMode === "cards" ? (
                /* REGIONAL CARDS VIEW */
                (() => {
                  const filteredRegs = SANTA_CATARINA_REGIONS.filter(reg => {
                    if (selectedRegionFilter !== "TODAS" && reg.region !== selectedRegionFilter) {
                      return false;
                    }
                    
                    const matchesSearch = searchQuery === "" || 
                      reg.region.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
                        searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                      ) ||
                      reg.cities.some(city => 
                        city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
                          searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        )
                      );
                    
                    if (!matchesSearch) return false;
                    
                    if (atuacaoFilter === "atuando") {
                      const hasActiveCity = reg.cities.some(city => {
                        const m = getCityMapping(city.name, reg.region);
                        return !!m.atuacao;
                      });
                      if (!hasActiveCity) return false;
                    }
                    
                    return true;
                  });

                  if (filteredRegs.length === 0) {
                    return (
                      <div className="p-12 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center rounded-lg bg-white">
                        <Globe className="text-gray-300 mb-2" size={40} />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nenhuma regional encontrada para os filtros ativos</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredRegs.map(reg => {
                        const totalCities = reg.cities.length;
                        const activeCitiesCount = reg.cities.filter(c => {
                          const m = getCityMapping(c.name, reg.region);
                          return !!m.atuacao;
                        }).length;
                        
                        const totalEleitores = reg.cities.reduce((acc, c) => acc + c.eleitores, 0);
                        
                        const sumBom = reg.cities.reduce((acc, c) => {
                          const m = getCityMapping(c.name, reg.region);
                          return acc + (parseInt(m.perspectivaBom || "", 10) || 0);
                        }, 0);
                        const sumIdeal = reg.cities.reduce((acc, c) => {
                          const m = getCityMapping(c.name, reg.region);
                          return acc + (parseInt(m.perspectivaIdeal || "", 10) || 0);
                        }, 0);
                        const sumOtimo = reg.cities.reduce((acc, c) => {
                          const m = getCityMapping(c.name, reg.region);
                          return acc + (parseInt(m.perspectivaOtimo || "", 10) || 0);
                        }, 0);

                        return (
                          <div 
                            key={reg.region}
                            id={`regional-card-${reg.region.toLowerCase().replace(/\s+/g, "-")}`}
                            onClick={() => openEditRegionalModal(reg.region)}
                            className="bg-white border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,68,136,1)] hover:border-[#004488] p-5 transition-all cursor-pointer flex flex-col justify-between group relative"
                          >
                            <div className="mb-4">
                              {/* Card Header */}
                              <div className="flex items-start justify-between border-b border-gray-200 pb-2 mb-3">
                                <h4 className="font-sans font-black tracking-tight text-[#004488] text-sm uppercase group-hover:text-[#003366] transition-colors pr-2">
                                  Regional: {reg.region}
                                </h4>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 border rounded-sm whitespace-nowrap transition-colors ${
                                  activeCitiesCount > 0 
                                    ? "bg-emerald-400 text-black border-emerald-500 font-extrabold" 
                                    : "bg-slate-100 text-slate-800 border-slate-300"
                                }`}>
                                  {activeCitiesCount} / {totalCities} Ativas
                                </span>
                              </div>

                              {/* Total de Eleitores */}
                              <div className="flex items-center justify-between text-xs text-gray-600 font-bold mb-3">
                                <span>Total de Eleitores:</span>
                                <span className="font-mono text-gray-900 font-extrabold">
                                  {formatNumber(totalEleitores)}
                                </span>
                              </div>

                              {/* Perspectivas de Voto bar */}
                              <div className="space-y-1 mb-4">
                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Perspectiva de Votos:</span>
                                <div className="flex rounded-md overflow-hidden border border-gray-200 font-mono text-[10px] leading-none">
                                  <span className="px-1.5 py-1.5 flex-1 text-center bg-gray-50 text-gray-700 border-r border-gray-200" title="Cenário Bom">
                                    B: <strong className="font-extrabold">{sumBom ? formatNumber(sumBom) : "-"}</strong>
                                  </span>
                                  <span className="px-1.5 py-1.5 flex-1 text-center bg-blue-50 text-blue-800 border-r border-gray-200" title="Cenário Ideal">
                                    I: <strong className="font-extrabold">{sumIdeal ? formatNumber(sumIdeal) : "-"}</strong>
                                  </span>
                                  <span className="px-1.5 py-1.5 flex-1 text-center bg-emerald-50 text-emerald-800" title="Cenário Ótimo">
                                    Ó: <strong className="font-extrabold">{sumOtimo ? formatNumber(sumOtimo) : "-"}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Cidades nomes */}
                              <div className="border-t border-gray-100 pt-3">
                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1.5">Municípios:</span>
                                <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1">
                                  {reg.cities.map(city => {
                                    const m = getCityMapping(city.name, reg.region);
                                    const isAtivo = !!m.atuacao;
                                    return (
                                      <span 
                                        key={city.name} 
                                        className={`text-[9px] px-1.5 py-0.5 rounded-xs border transition-colors ${
                                          isAtivo 
                                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold" 
                                            : "bg-gray-50 text-gray-400 border-gray-100 font-normal"
                                        }`}
                                      >
                                        {city.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Hover Edit overlay hint */}
                            <div className="mt-2 text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider flex items-center justify-end gap-1">
                              <Edit2 size={10} className="text-[#004488]" />
                              Clique para Editar
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                /* TABLE VIEW (ORIGINAL TABLE CODE) */
                (() => {
                  const filteredRegionsList = SANTA_CATARINA_REGIONS.map(reg => {
                    if (selectedRegionFilter !== "TODAS" && reg.region !== selectedRegionFilter) {
                      return null;
                    }
                    
                    const filteredCities = reg.cities.filter(city => {
                      const matchesSearch = city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
                        searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                      );
                      
                      if (!matchesSearch) return false;
                      
                      const mapping = getCityMapping(city.name, reg.region);
                      if (atuacaoFilter === "atuando" && !mapping.atuacao) {
                        return false;
                      }
                      
                      return true;
                    });
                    
                    if (filteredCities.length === 0) return null;
                    
                    return {
                      ...reg,
                      cities: filteredCities
                    };
                  }).filter(Boolean) as { region: string; cities: typeof SANTA_CATARINA_REGIONS[0]["cities"] }[];

                  const activeCityMappingsList = isEditingMappings ? mappingDrafts : (formData.mappings || []);
                  const activeMappingsListForTotal = activeCityMappingsList.filter(m => m.atuacao);
                  
                  let totalHabitantes = 0;
                  let totalEleitores = 0;
                  let totalFiliados = 0;
                  
                  activeMappingsListForTotal.forEach(mapping => {
                    for (const reg of SANTA_CATARINA_REGIONS) {
                      const foundCity = reg.cities.find(c => c.name === mapping.cityName);
                      if (foundCity) {
                        totalHabitantes += foundCity.habitantes;
                        totalEleitores += foundCity.eleitores;
                        totalFiliados += foundCity.filiados;
                        break;
                      }
                    }
                  });

                  const totalHistoricoVotos = activeMappingsListForTotal.reduce((acc, m) => acc + (parseInt(m.historicoVotos, 10) || 0), 0);
                  const totalMeta2026 = activeMappingsListForTotal.reduce((acc, m) => acc + (parseInt(m.meta2026, 10) || 0), 0);

                  return (
                    <div className="overflow-x-auto border border-[#bbbbbb] rounded-md max-h-[600px] overflow-y-auto">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="bg-[#e6f0fa] text-[#004488] font-black uppercase tracking-wider sticky top-0 z-10 border-b border-[#bbbbbb]">
                            <th className="border border-[#bbbbbb] p-2 text-center" style={{ width: "40px" }}>Atuação</th>
                            <th className="border border-[#bbbbbb] p-2" style={{ minWidth: "130px" }}>Município</th>
                            <th className="border border-[#bbbbbb] p-2 text-right" style={{ width: "70px" }}>Habitantes</th>
                            <th className="border border-[#bbbbbb] p-2 text-right" style={{ width: "70px" }}>Eleitores</th>
                            <th className="border border-[#bbbbbb] p-2 text-right" style={{ width: "60px" }}>Filiados</th>
                            <th className="border border-[#bbbbbb] p-2" style={{ minWidth: "150px" }}>Liderança Principal</th>
                            <th className="border border-[#bbbbbb] p-2 text-center" style={{ width: "75px" }}>Histórico</th>
                            <th className="border border-[#bbbbbb] p-2 text-center" style={{ width: "75px" }}>Meta 2026</th>
                            <th className="border border-[#bbbbbb] p-2 text-center" style={{ minWidth: "130px" }}>Perspectiva Votos 2026</th>
                            <th className="border border-[#bbbbbb] p-2" style={{ minWidth: "180px" }}>Situação / Demanda Crucial</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegionsList.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="p-8 text-center text-xs text-gray-500 italic bg-white">
                                Nenhum município localizado com os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            filteredRegionsList.map((reg) => (
                              <React.Fragment key={reg.region}>
                                {/* Region Header Row */}
                                <tr className="bg-[#f1f3f5] font-black text-gray-700 border-y border-[#bbbbbb] sticky top-[28px] z-5">
                                  <td colSpan={10} className="p-2 text-left tracking-wider uppercase font-bold text-[10px] text-[#004488] bg-slate-100">
                                    Regional: {reg.region} ({reg.cities.length} {reg.cities.length === 1 ? 'município' : 'municípios'})
                                  </td>
                                </tr>
                                
                                {/* Cities Rows */}
                                {reg.cities.map(city => {
                                  const mapping = getCityMapping(city.name, reg.region);
                                  const isAtivo = !!mapping.atuacao;
                                  
                                  return (
                                    <tr 
                                      key={city.name} 
                                      className={`border-b border-gray-200 hover:bg-slate-50/70 transition-all ${
                                        isAtivo ? "bg-emerald-50/40 font-medium text-emerald-950" : "text-gray-500 bg-white"
                                      }`}
                                    >
                                      {/* Checkbox Atuação */}
                                      <td className="border border-gray-200 p-2 text-center">
                                        {isEditingMappings ? (
                                          <input 
                                            type="checkbox"
                                            checked={isAtivo}
                                            onChange={(e) => handleDraftChange(mapping.cityId, "atuacao", e.target.checked)}
                                            className="h-3.5 w-3.5 text-[#004488] border-gray-300 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center">
                                            {isAtivo ? (
                                              <div className="w-4 h-4 bg-[#004488] text-white rounded-xs flex items-center justify-center">
                                                <Check size={12} className="stroke-[3]" />
                                              </div>
                                            ) : (
                                              <div className="w-4 h-4 border border-gray-300 rounded-xs bg-gray-50"></div>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      
                                      {/* Município */}
                                      <td className={`border border-gray-200 p-2 font-bold ${isAtivo ? "text-gray-900" : "text-gray-600"}`}>
                                        {city.name}
                                      </td>
                                      
                                      {/* Habitantes */}
                                      <td className="border border-gray-200 p-2 text-right font-mono text-gray-600">
                                        {formatNumber(city.habitantes)}
                                      </td>
                                      
                                      {/* Eleitores */}
                                      <td className="border border-gray-200 p-2 text-right font-mono text-gray-600">
                                        {formatNumber(city.eleitores)}
                                      </td>
                                      
                                      {/* Filiados */}
                                      <td className="border border-gray-200 p-2 text-right font-mono text-amber-700 font-semibold bg-amber-50/10">
                                        {formatNumber(city.filiados)}
                                      </td>
                                      
                                      {/* Liderança Principal */}
                                      <td className="border border-gray-200 p-1.5">
                                        {isEditingMappings ? (
                                          <input 
                                            type="text"
                                            value={mapping.lideranca || ""}
                                            onChange={(e) => handleDraftChange(mapping.cityId, "lideranca", e.target.value)}
                                            placeholder="Ex: Roberto Souza"
                                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-hidden focus:ring-1 focus:ring-[#004488]"
                                          />
                                        ) : (
                                          <span className="truncate block max-w-[150px]" title={mapping.lideranca || ""}>
                                            {mapping.lideranca || <span className="text-gray-300 italic">Nenhuma</span>}
                                          </span>
                                        )}
                                      </td>
                                      
                                      {/* Histórico */}
                                      <td className="border border-gray-200 p-1.5 text-center font-mono">
                                        {isEditingMappings ? (
                                          <input 
                                            type="text"
                                            value={mapping.historicoVotos || ""}
                                            onChange={(e) => handleDraftChange(mapping.cityId, "historicoVotos", e.target.value.replace(/\D/g, ""))}
                                            placeholder="0"
                                            className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-center text-[10px] focus:outline-hidden font-mono"
                                          />
                                        ) : (
                                          <span>{mapping.historicoVotos ? formatNumber(mapping.historicoVotos) : "-"}</span>
                                        )}
                                      </td>
                                      
                                      {/* Meta */}
                                      <td className="border border-gray-200 p-1.5 text-center font-mono font-bold bg-amber-50/5">
                                        {isEditingMappings ? (
                                          <input 
                                            type="text"
                                            value={mapping.meta2026 || ""}
                                            onChange={(e) => handleDraftChange(mapping.cityId, "meta2026", e.target.value.replace(/\D/g, ""))}
                                            placeholder="Meta"
                                            className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-center text-[10px] focus:outline-hidden font-mono font-bold text-[#004488]"
                                          />
                                        ) : (
                                          <span className="text-[#004488] font-extrabold">{mapping.meta2026 ? formatNumber(mapping.meta2026) : "-"}</span>
                                        )}
                                      </td>
                                      
                                      {/* Perspectivas */}
                                      <td className="border border-gray-200 p-1.5 text-center">
                                        {isEditingMappings ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <input 
                                              type="text"
                                              value={mapping.perspectivaBom || ""}
                                              onChange={(e) => handleDraftChange(mapping.cityId, "perspectivaBom", e.target.value.replace(/\D/g, ""))}
                                              placeholder="Bom"
                                              title="Perspectiva Cenário Bom"
                                              className="w-10 text-center bg-white border border-gray-300 rounded p-0.5 text-[9px] font-mono"
                                            />
                                            <input 
                                              type="text"
                                              value={mapping.perspectivaIdeal || ""}
                                              onChange={(e) => handleDraftChange(mapping.cityId, "perspectivaIdeal", e.target.value.replace(/\D/g, ""))}
                                              placeholder="Ideal"
                                              title="Perspectiva Cenário Ideal"
                                              className="w-10 text-center bg-white border border-gray-300 rounded p-0.5 text-[9px] font-mono"
                                            />
                                            <input 
                                              type="text"
                                              value={mapping.perspectivaOtimo || ""}
                                              onChange={(e) => handleDraftChange(mapping.cityId, "perspectivaOtimo", e.target.value.replace(/\D/g, ""))}
                                              placeholder="Ótimo"
                                              title="Perspectiva Cenário Ótimo"
                                              className="w-10 text-center bg-white border border-gray-300 rounded p-0.5 text-[9px] font-mono"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-center gap-1 text-[10px]">
                                            {mapping.perspectivaBom || mapping.perspectivaIdeal || mapping.perspectivaOtimo ? (
                                              <div className="flex rounded-xs overflow-hidden border border-gray-200 font-mono">
                                                <span className="px-1 bg-gray-50 text-gray-600 border-r border-gray-100" title="Cenário Bom: Votos estimáveis">{mapping.perspectivaBom ? formatNumber(mapping.perspectivaBom) : "0"}</span>
                                                <span className="px-1 bg-blue-50 text-blue-700 border-r border-gray-100" title="Cenário Ideal: Votos projetados">{mapping.perspectivaIdeal ? formatNumber(mapping.perspectivaIdeal) : "0"}</span>
                                                <span className="px-1 bg-emerald-50 text-emerald-700" title="Cenário Ótimo: Votos potenciais">{mapping.perspectivaOtimo ? formatNumber(mapping.perspectivaOtimo) : "0"}</span>
                                              </div>
                                            ) : (
                                              <span className="text-gray-300 italic">Não definida</span>
                                            )}
                                          </div>
                                        )}
                                      </td>
                                      
                                      {/* Situação Demanda */}
                                      <td className="border border-gray-200 p-1.5">
                                        {isEditingMappings ? (
                                          <input 
                                            type="text"
                                            value={mapping.situacao || ""}
                                            onChange={(e) => handleDraftChange(mapping.cityId, "situacao", e.target.value)}
                                            placeholder="Ex: Recursos para hospital"
                                            className="w-full bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] focus:outline-hidden focus:ring-1 focus:ring-[#004488]"
                                          />
                                        ) : (
                                          <span className="truncate block max-w-[200px]" title={mapping.situacao || ""}>
                                            {mapping.situacao || <span className="text-gray-300 italic">Sem observações</span>}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            ))
                          )}
                        </tbody>
                        {activeMappingsListForTotal.length > 0 && (
                          <tfoot className="bg-gray-100 border-t-2 border-[#bbbbbb] font-bold sticky bottom-0 z-10 text-gray-900 font-mono text-[11px]">
                            <tr className="divide-x divide-gray-200 bg-gray-100">
                              <td className="border border-[#bbbbbb] p-2 text-center">
                                {/* Checkbox empty */}
                              </td>
                              <td className="border border-[#bbbbbb] p-2 uppercase font-black text-gray-800 text-[10px]">
                                Total Acumulado (Cidades Ativas)
                              </td>
                              <td className="border border-[#bbbbbb] p-2 text-right font-black">
                                {formatNumber(totalHabitantes)}
                              </td>
                              <td className="border border-[#bbbbbb] p-2 text-right font-black">
                                {formatNumber(totalEleitores)}
                              </td>
                              <td className="border border-[#bbbbbb] p-2 text-right font-black text-amber-600">
                                {formatNumber(totalFiliados)}
                              </td>
                              <td className="border border-[#bbbbbb] p-2">
                                {/* Liderança empty */}
                              </td>
                              <td className="border border-[#bbbbbb] p-2 text-center font-black">
                                {formatNumber(totalHistoricoVotos)}
                              </td>
                              <td className="border border-[#bbbbbb] p-2 text-center font-black text-[#004488] bg-blue-50/50">
                                {formatNumber(totalMeta2026)}
                              </td>
                              <td className="border border-[#bbbbbb] p-2">
                                {/* Perspectives empty */}
                              </td>
                              <td className="border border-[#bbbbbb] p-2">
                                {/* Situation empty */}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        ) : (
          /* SECTION 2: AGENDA DE PUBLICAÇÕES WORKSPACE (Neo-Brutalist Media Manager) */
          <div className="bg-white rounded-none border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8">
            {/* Header section with Stats & Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-[#1A1A1B]">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                  <Globe className="text-[#004488]" size={24} />
                  Agenda de Publicações e Cronograma de Mídias
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                  Gerencie o conteúdo, aprove mídias e monitore o cronograma de postagens de campanha.
                </p>
              </div>

              {/* Progress Summary */}
              <div className="flex items-center gap-4 bg-gray-50 p-3 border-2 border-[#1A1A1B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-extrabold uppercase tracking-wider block">Progresso Geral</span>
                  <span className="text-lg font-black text-[#004488] font-mono">
                    {Math.round((((formData.publications || []).filter(p => p.status === "Aprovado" || p.status === "Postado").length) / Math.max((formData.publications || []).length, 1)) * 100)}%
                  </span>
                </div>
                <div className="h-8 w-[2px] bg-[#1A1A1B]" />
                <div className="text-left">
                  <span className="text-xs text-gray-500 font-extrabold uppercase tracking-wider block">Status dos Cards</span>
                  <span className="text-xs font-black text-gray-800 uppercase">
                    {(formData.publications || []).filter(p => p.status === "Aprovado" || p.status === "Postado").length} de {(formData.publications || []).length} OK
                  </span>
                </div>
              </div>
            </div>

            {/* Filtering and Search Controls bar */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6">
              {/* Search & Select Controls */}
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text"
                    value={pubSearchQuery}
                    onChange={(e) => setPubSearchQuery(e.target.value)}
                    placeholder="Buscar postagem..."
                    className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#1A1A1B] text-xs font-bold rounded-none focus:outline-hidden focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                {/* Platform filter buttons */}
                <div className="flex items-center bg-gray-100 border-2 border-[#1A1A1B] p-1 rounded-none overflow-x-auto max-w-full">
                  {["TODAS", "Instagram", "Facebook", "TikTok", "WhatsApp", "YouTube"].map((plat) => (
                    <button
                      key={plat}
                      onClick={() => setPubPlatformFilter(plat)}
                      className={`px-3 py-1 text-[10px] font-black uppercase transition cursor-pointer whitespace-nowrap ${
                        pubPlatformFilter === plat 
                          ? "bg-[#004488] text-white" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>

                {/* Status selector */}
                <select
                  value={pubStatusFilter}
                  onChange={(e) => setPubStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border-2 border-[#1A1A1B] text-xs font-black uppercase rounded-none focus:outline-hidden"
                >
                  <option value="TODOS">TODOS OS STATUS</option>
                  <option value="Rascunho">RASCUNHO</option>
                  <option value="Em Produção">EM PRODUÇÃO</option>
                  <option value="Enviado">ENVIADO / REVISÃO</option>
                  <option value="Aprovado">APROVADO</option>
                  <option value="Rejeitado">REJEITADO</option>
                  <option value="Postado">POSTADO / AO VIVO</option>
                </select>
              </div>

              {/* Add New Publication Button */}
              <button
                onClick={() => {
                  setPubEditForm({
                    id: "pub-" + Date.now(),
                    title: "",
                    date: new Date().toISOString().split("T")[0],
                    time: "12:00",
                    platforms: ["Instagram"],
                    format: "Vertical",
                    postType: "Feed",
                    area: "Geral",
                    caption: "",
                    status: "Rascunho"
                  });
                  setShowNewPubModal(true);
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#004488] text-white text-xs font-black uppercase border-2 border-[#1A1A1B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer"
              >
                <Plus size={16} />
                Nova Publicação
              </button>
            </div>

            {/* Filter controls row 2 - Advanced Filters & Visualization Toggles */}
            <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-50 p-4 border-2 border-[#1A1A1B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-700">
                <Filter size={14} className="text-[#004488]" />
                Filtros Avançados:
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-gray-500">Formato:</span>
                <select
                  value={pubFormatFilter}
                  onChange={(e) => setPubFormatFilter(e.target.value)}
                  className="px-2 py-1 bg-white border border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">TODOS</option>
                  <option value="Vertical">Vertical</option>
                  <option value="Horizontal">Horizontal</option>
                </select>
              </div>

              {/* Post Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-gray-500">Tipo:</span>
                <select
                  value={pubPostTypeFilter}
                  onChange={(e) => setPubPostTypeFilter(e.target.value)}
                  className="px-2 py-1 bg-white border border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">TODOS</option>
                  <option value="Feed">Feed</option>
                  <option value="Reels">Reels</option>
                  <option value="Dark Post">Dark Post</option>
                </select>
              </div>

              {/* Area Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-gray-500">Área:</span>
                <select
                  value={pubAreaFilter}
                  onChange={(e) => setPubAreaFilter(e.target.value)}
                  className="px-2 py-1 bg-white border border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">TODAS AS ÁREAS</option>
                  <option value="Geral">Geral (Toda SC)</option>
                  {Array.from(new Set([
                    ...SANTA_CATARINA_REGIONS.map(r => r.region),
                    ...((formData.mappings || []).filter(m => m.atuacao).map(m => m.cityName)),
                    ...((formData.publications || []).map(p => p.area).filter(Boolean) as string[])
                  ])).map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              {/* Visualizer Mode Toggle */}
              <div className="md:ml-auto flex items-center bg-gray-200 border-2 border-[#1A1A1B] p-0.5 rounded-none shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <button
                  onClick={() => setPlanningViewMode("diario")}
                  className={`px-3 py-1 text-[10px] font-black uppercase transition cursor-pointer whitespace-nowrap ${
                    planningViewMode === "diario" 
                      ? "bg-[#004488] text-white" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Diário
                </button>
                <button
                  onClick={() => setPlanningViewMode("semanal")}
                  className={`px-3 py-1 text-[10px] font-black uppercase transition cursor-pointer whitespace-nowrap ${
                    planningViewMode === "semanal" 
                      ? "bg-[#004488] text-white" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Semanal
                </button>
                <button
                  onClick={() => setPlanningViewMode("mensal")}
                  className={`px-3 py-1 text-[10px] font-black uppercase transition cursor-pointer whitespace-nowrap ${
                    planningViewMode === "mensal" 
                      ? "bg-[#004488] text-white" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Mensal
                </button>
              </div>
            </div>

            {/* List of Publications */}
            {(() => {
              const filteredPubs = (formData.publications || []).filter(p => {
                const matchesSearch = pubSearchQuery === "" || 
                  p.title.toLowerCase().includes(pubSearchQuery.toLowerCase()) || 
                  (p.caption && p.caption.toLowerCase().includes(pubSearchQuery.toLowerCase()));
                const matchesPlatform = pubPlatformFilter === "TODAS" || p.platforms.includes(pubPlatformFilter as any);
                const matchesStatus = pubStatusFilter === "TODOS" || p.status === pubStatusFilter;
                const matchesFormat = pubFormatFilter === "TODOS" || p.format === pubFormatFilter;
                const matchesPostType = pubPostTypeFilter === "TODOS" || p.postType === pubPostTypeFilter;
                const matchesArea = pubAreaFilter === "TODOS" || p.area === pubAreaFilter;
                return matchesSearch && matchesPlatform && matchesStatus && matchesFormat && matchesPostType && matchesArea;
              });

              if (filteredPubs.length === 0) {
                return (
                  <div className="py-12 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                    <Globe className="text-gray-300 mb-2" size={40} />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nenhuma publicação encontrada para os filtros ativos</p>
                    <button
                      onClick={() => { setPubSearchQuery(""); setPubPlatformFilter("TODAS"); setPubStatusFilter("TODOS"); }}
                      className="mt-3 px-3 py-1 bg-gray-100 border border-[#1A1A1B] text-[10px] font-bold uppercase hover:bg-gray-200 transition"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredPubs.map((pub) => {
                    const isEditing = editingPubId === pub.id;
                    const isApproved = pub.status === "Aprovado";
                    const isRejected = pub.status === "Rejeitado";
                    const isSubmitted = pub.status === "Enviado";
                    const isPosted = pub.status === "Postado";

                    return (
                      <div 
                        key={pub.id}
                        className={`p-5 border-2 border-[#1A1A1B] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between ${
                          isApproved ? "bg-emerald-50/10 border-emerald-500/80" :
                          isRejected ? "bg-rose-50/10 border-rose-500/80" :
                          isSubmitted ? "bg-blue-50/10 border-blue-500/80" :
                          isPosted ? "bg-purple-50/15 border-purple-500/80" :
                          "bg-white"
                        }`}
                      >
                        {isEditing ? (
                          /* INLINE CARD EDIT MODE */
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2 border-gray-200">
                              <span className="text-[10px] font-black uppercase text-blue-600">Editando Publicação</span>
                              <span className="text-[10px] text-gray-400 font-mono font-bold">ID: {pub.id}</span>
                            </div>

                            {/* Title input */}
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Título do Post</label>
                              <input 
                                type="text"
                                value={pubEditForm.title || ""}
                                onChange={(e) => setPubEditForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden"
                              />
                            </div>

                            {/* Date and Time inputs */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Data</label>
                                <input 
                                  type="date"
                                  value={pubEditForm.date || ""}
                                  onChange={(e) => setPubEditForm(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Horário</label>
                                <input 
                                  type="time"
                                  value={pubEditForm.time || ""}
                                  onChange={(e) => setPubEditForm(prev => ({ ...prev, time: e.target.value }))}
                                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden"
                                />
                              </div>
                            </div>

                            {/* Format and Status */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Formato</label>
                                <select 
                                  value={pubEditForm.format || "Card"}
                                  onChange={(e) => setPubEditForm(prev => ({ ...prev, format: e.target.value as any }))}
                                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden"
                                >
                                  <option value="Card">CARD ESTÁTICO</option>
                                  <option value="Carrossel">CARROSSEL</option>
                                  <option value="Vídeo">VÍDEO DE RUA</option>
                                  <option value="Reels">REELS / TIKTOK</option>
                                  <option value="Story">STORY INTERATIVO</option>
                                  <option value="Live">TRANSMISSÃO AO VIVO</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Status Interno</label>
                                <select 
                                  value={pubEditForm.status || "Rascunho"}
                                  onChange={(e) => setPubEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden"
                                >
                                  <option value="Rascunho">RASCUNHO</option>
                                  <option value="Em Produção">EM PRODUÇÃO</option>
                                  <option value="Enviado">ENVIADO (REVISÃO)</option>
                                  <option value="Aprovado">APROVADO</option>
                                  <option value="Postado">POSTADO</option>
                                </select>
                              </div>
                            </div>

                            {/* Área de Publicação (Regional) Select */}
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Área de Publicação (Regional)</label>
                              <select
                                value={pubEditForm.area || ""}
                                onChange={(e) => {
                                  const nextArea = e.target.value;
                                  setPubEditForm(prev => ({
                                    ...prev,
                                    area: nextArea,
                                    cities: []
                                  }));
                                }}
                                className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden"
                              >
                                <option value="">-- SELECIONE UMA REGIONAL --</option>
                                <option value="Geral">GERAL (TODA SC)</option>
                                {SANTA_CATARINA_REGIONS.map(r => (
                                  <option key={r.region} value={r.region}>{r.region}</option>
                                ))}
                              </select>
                            </div>

                            {/* Novo Campo de Cidades da Regional */}
                            {pubEditForm.area && pubEditForm.area !== "Geral" && (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="block text-[10px] font-black uppercase text-gray-700">
                                    Cidades Vinculadas à Regional para Publicação
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const allRegCities = SANTA_CATARINA_REGIONS.find(r => r.region === pubEditForm.area)?.cities.map(c => c.name) || [];
                                        setPubEditForm(prev => ({ ...prev, cities: allRegCities }));
                                      }}
                                      className="text-[9px] font-black text-emerald-700 hover:underline uppercase cursor-pointer"
                                    >
                                      [ Selecionar Todas ]
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPubEditForm(prev => ({ ...prev, cities: [] }));
                                      }}
                                      className="text-[9px] font-black text-rose-700 hover:underline uppercase cursor-pointer"
                                    >
                                      [ Limpar Seleção ]
                                    </button>
                                  </div>
                                </div>
                                
                                {(() => {
                                  const regData = SANTA_CATARINA_REGIONS.find(r => r.region === pubEditForm.area);
                                  if (!regData || regData.cities.length === 0) {
                                    return <p className="text-[10px] text-gray-400 uppercase font-bold">Nenhuma cidade encontrada para esta regional.</p>;
                                  }
                                  return (
                                    <div className="grid grid-cols-2 gap-2 border-2 border-[#1A1A1B] p-2 bg-gray-50 max-h-40 overflow-y-auto">
                                      {regData.cities.map(city => {
                                        const isSelected = (pubEditForm.cities || []).includes(city.name);
                                        return (
                                          <div
                                            key={city.name}
                                            onClick={() => {
                                              const current = pubEditForm.cities || [];
                                              const next = current.includes(city.name)
                                                ? current.filter(c => c !== city.name)
                                                : [...current, city.name];
                                              setPubEditForm(prev => ({ ...prev, cities: next }));
                                            }}
                                            className={`p-2 border-2 text-[11px] font-bold uppercase transition cursor-pointer flex items-center justify-between rounded-none ${
                                              isSelected
                                                ? "bg-blue-50 border-[#004488] text-[#004488] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                                : "bg-white border-gray-300 hover:border-[#1A1A1B] text-gray-700"
                                            }`}
                                          >
                                            <span className="truncate pr-1">{city.name}</span>
                                            <input 
                                              type="checkbox"
                                              checked={isSelected}
                                              readOnly
                                              className="h-3 w-3 accent-[#004488] pointer-events-none flex-shrink-0"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Caption area */}
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Legenda Recomendada / Roteiro</label>
                              <textarea 
                                rows={3}
                                value={pubEditForm.caption || ""}
                                onChange={(e) => setPubEditForm(prev => ({ ...prev, caption: e.target.value }))}
                                placeholder="Digite a legenda da postagem..."
                                className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden resize-y"
                              />
                            </div>

                            {/* Platforms selection */}
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Plataformas de Publicação</label>
                              <div className="flex flex-wrap gap-2.5 mt-1.5">
                                {["Instagram", "Facebook", "TikTok", "WhatsApp", "YouTube", "Twitter"].map(plat => {
                                  const isSelected = pubEditForm.platforms?.includes(plat as any);
                                  return (
                                    <button
                                      type="button"
                                      key={plat}
                                      onClick={() => {
                                        const current = pubEditForm.platforms || [];
                                        const next = current.includes(plat as any)
                                          ? current.filter(p => p !== plat)
                                          : [...current, plat as any];
                                        setPubEditForm(prev => ({ ...prev, platforms: next }));
                                      }}
                                      className={`px-3 py-1 border border-[#1A1A1B] text-[10px] font-black uppercase transition cursor-pointer ${
                                        isSelected ? "bg-[#004488] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                      }`}
                                    >
                                      {plat}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Edit Form Actions */}
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => handleSavePublication(pubEditForm as CandidatePublication)}
                                className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase border-2 border-[#1A1A1B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition cursor-pointer"
                              >
                                Salvar Post
                              </button>
                              <button
                                onClick={() => setEditingPubId(null)}
                                className="px-4 py-2 bg-white text-gray-700 text-xs font-black uppercase border border-gray-300 hover:bg-gray-50 transition cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* STANDARD VIEW MODE */
                          <div className="flex flex-col justify-between h-full space-y-4">
                            <div>
                              {/* Card Top Metadata */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 border border-[#1A1A1B] ${
                                  isApproved ? "bg-emerald-100 text-emerald-800" :
                                  isRejected ? "bg-rose-100 text-rose-800" :
                                  isSubmitted ? "bg-blue-100 text-blue-800 animate-pulse" :
                                  isPosted ? "bg-purple-100 text-purple-800" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {pub.status}
                                </span>

                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold font-mono">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={13} />
                                    {pub.date.split("-").reverse().join("/")}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={13} />
                                    {pub.time}
                                  </span>
                                </div>
                              </div>

                              {/* Card Title & Format */}
                              <div className="mb-2">
                                <h4 className="text-sm font-extrabold text-[#1A1A1B] leading-snug">
                                  {pub.title}
                                </h4>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-0.5">
                                  Formato: <strong className="text-gray-700">{pub.format}</strong>
                                </span>
                              </div>

                              {/* Regional & Selected Cities */}
                              {pub.area && (
                                <div className="mb-3 text-xs">
                                  <span className="text-[9px] font-black uppercase text-gray-500 block mb-1">
                                    📍 Regional / Cidades:
                                  </span>
                                  <div className="bg-slate-50 border border-gray-200 p-2 rounded-none space-y-1">
                                    <div className="text-[11px] font-black text-[#004488] uppercase">
                                      {pub.area}
                                    </div>
                                    {pub.cities && pub.cities.length > 0 ? (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {pub.cities.map(city => (
                                          <span 
                                            key={city} 
                                            className="px-1 py-0.5 bg-white border border-gray-300 text-[9px] font-bold text-gray-700 uppercase"
                                          >
                                            {city}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-[9px] font-bold text-gray-400 uppercase block italic">
                                        (Toda a regional selecionada)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Platforms Pillets */}
                              <div className="flex flex-wrap gap-1 mb-3">
                                {pub.platforms.map((plat) => {
                                  const isInsta = plat === "Instagram";
                                  const isFb = plat === "Facebook";
                                  const isWpp = plat === "WhatsApp";
                                  const isYt = plat === "YouTube";
                                  const isTiktok = plat === "TikTok";

                                  return (
                                    <span 
                                      key={plat}
                                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 border border-black/10 ${
                                        isInsta ? "bg-rose-50 text-rose-700 border-rose-200" :
                                        isFb ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        isWpp ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                        isYt ? "bg-red-50 text-red-700 border-red-200" :
                                        isTiktok ? "bg-slate-900 text-white" :
                                        "bg-gray-50 text-gray-700"
                                      }`}
                                    >
                                      {plat}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Caption container */}
                              {pub.caption && (
                                <div className="bg-gray-50 p-3 border border-gray-200 text-xs text-gray-700 font-medium mb-3 whitespace-pre-line leading-relaxed max-h-[140px] overflow-y-auto">
                                  {pub.caption}
                                </div>
                              )}

                              {/* Attached media file metadata */}
                              {pub.fileName ? (
                                <div className="bg-white p-2 border border-[#1A1A1B] flex items-center justify-between text-xs mb-3">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FileVideo size={14} className="text-[#004488] flex-shrink-0" />
                                    <span className="truncate font-bold text-gray-700" title={pub.fileName}>
                                      {pub.fileName}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-gray-400 font-mono font-bold whitespace-nowrap pl-2">{pub.fileSize}</span>
                                </div>
                              ) : (
                                <div className="p-3 border border-dashed border-gray-300 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                                  Nenhuma mídia anexada
                                </div>
                              )}

                              {/* Rejection comments box */}
                              {isRejected && pub.rejectReason && (
                                <div className="bg-rose-50 p-2.5 rounded-none text-xs text-rose-800 border-l-4 border-rose-600 flex items-start gap-1.5 mb-3">
                                  <AlertTriangle size={14} className="flex-shrink-0 text-rose-600 mt-0.5" />
                                  <div>
                                    <strong className="font-extrabold uppercase text-[10px] tracking-wider block">Correção Solicitada pela Coordenação:</strong>
                                    <span className="font-medium">{pub.rejectReason}</span>
                                  </div>
                                </div>
                              )}

                              {/* Live Posted URL link */}
                              {isPosted && pub.postUrl && (
                                <a 
                                  href={pub.postUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="bg-purple-50 p-2 rounded-none text-xs text-purple-800 border border-purple-200 flex items-center gap-1.5 mb-3 hover:bg-purple-100 transition"
                                >
                                  <Link2 size={14} className="text-purple-600 animate-pulse" />
                                  <strong className="font-extrabold">Post publicado:</strong> 
                                  <span className="underline font-bold truncate flex-1">{pub.postUrl}</span>
                                </a>
                              )}
                            </div>

                            {/* Card Footer Actions and Upload */}
                            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 mt-auto">
                              {/* Upload area or edit media */}
                              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-[#1A1A1B] text-[10px] font-black uppercase text-gray-700 hover:bg-gray-100 transition cursor-pointer">
                                <Upload size={12} className="text-gray-500" />
                                {pub.fileName ? "Substituir Arte/Roteiro" : "Anexar Arte/Roteiro"}
                                <input 
                                  type="file" 
                                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx" 
                                  onChange={(e) => handlePublicationUpload(pub.id, e)} 
                                  className="hidden" 
                                />
                              </label>

                              {/* Control/Review actions panel */}
                              <div className="flex items-center gap-1.5">
                                {/* Edit Publication Button */}
                                <button
                                  onClick={() => {
                                    setPubEditForm({ ...pub });
                                    setEditingPubId(pub.id);
                                  }}
                                  className="p-1.5 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-none transition cursor-pointer"
                                  title="Editar Publicação"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {/* Delete Publication Button */}
                                <button
                                  onClick={() => handleDeletePublication(pub.id)}
                                  className="p-1.5 text-red-700 hover:text-red-900 bg-white hover:bg-red-50 border border-red-200 rounded-none transition cursor-pointer"
                                  title="Remover Post"
                                >
                                  <Trash2 size={13} />
                                </button>

                                {/* Spacer bar */}
                                <div className="h-4 w-[1px] bg-gray-200 mx-1" />

                                {/* Validation checks */}
                                {!isApproved && !isPosted && (
                                  <button
                                    onClick={() => handlePublicationStatus(pub.id, "Aprovado")}
                                    className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-none border border-emerald-200 transition cursor-pointer"
                                    title="Aprovar Conteúdo"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}

                                {!isRejected && (
                                  <button
                                    onClick={() => {
                                      const reason = window.prompt("Insira o feedback ou correções necessárias:");
                                      if (reason !== null) {
                                        handlePublicationStatus(pub.id, "Rejeitado", reason || "Mídia necessita ajustes de arte/texto.");
                                      }
                                    }}
                                    className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-none border border-red-200 transition cursor-pointer"
                                    title="Solicitar Ajustes"
                                  >
                                    <X size={14} />
                                  </button>
                                )}

                                {isApproved && (
                                  <button
                                    onClick={() => {
                                      const liveUrl = window.prompt("Insira a URL do post publicado no Instagram/Facebook/YouTube:");
                                      if (liveUrl) {
                                        handlePublicationStatus(pub.id, "Postado", undefined, liveUrl);
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-black uppercase text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-none border border-purple-200 transition cursor-pointer"
                                  >
                                    Marcar Postado
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* NEW PUBLICATION OVERLAY MODAL */}
      {showNewPubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white border-4 border-[#1A1A1B] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg rounded-none overflow-hidden">
            {/* Modal Title bar */}
            <div className="bg-[#004488] p-4 text-white border-b-4 border-[#1A1A1B] flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <Plus size={16} />
                Agendar Nova Publicação
              </h4>
              <button 
                onClick={() => setShowNewPubModal(false)}
                className="text-white hover:text-gray-200 cursor-pointer text-xs font-bold uppercase"
              >
                [ Fechar ]
              </button>
            </div>

            {/* Modal Form content */}
            <div className="p-6 space-y-4">
              {/* Title input */}
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Título do Post</label>
                <input 
                  type="text"
                  value={pubEditForm.title || ""}
                  onChange={(e) => setPubEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Visita ao Hospital Regional de Chapecó"
                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden"
                />
              </div>

              {/* Date and Time inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Data</label>
                  <input 
                    type="date"
                    value={pubEditForm.date || ""}
                    onChange={(e) => setPubEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Horário</label>
                  <input 
                    type="time"
                    value={pubEditForm.time || ""}
                    onChange={(e) => setPubEditForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Format input */}
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Formato do Post</label>
                <select 
                  value={pubEditForm.format || "Card"}
                  onChange={(e) => setPubEditForm(prev => ({ ...prev, format: e.target.value as any }))}
                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden"
                >
                  <option value="Card">CARD ESTÁTICO</option>
                  <option value="Carrossel">CARROSSEL</option>
                  <option value="Vídeo">VÍDEO DE RUA</option>
                  <option value="Reels">REELS / TIKTOK</option>
                  <option value="Story">STORY INTERATIVO</option>
                  <option value="Live">TRANSMISSÃO AO VIVO</option>
                </select>
              </div>

              {/* Área de Publicação (Regional) Select */}
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Área de Publicação (Regional)</label>
                <select
                  value={pubEditForm.area || ""}
                  onChange={(e) => {
                    const nextArea = e.target.value;
                    setPubEditForm(prev => ({
                      ...prev,
                      area: nextArea,
                      cities: []
                    }));
                  }}
                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-black uppercase focus:outline-hidden"
                >
                  <option value="">-- SELECIONE UMA REGIONAL --</option>
                  <option value="Geral">GERAL (TODA SC)</option>
                  {SANTA_CATARINA_REGIONS.map(r => (
                    <option key={r.region} value={r.region}>{r.region}</option>
                  ))}
                </select>
              </div>

              {/* Novo Campo de Cidades da Regional */}
              {pubEditForm.area && pubEditForm.area !== "Geral" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-black uppercase text-gray-700">
                      Cidades Vinculadas à Regional para Publicação
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allRegCities = SANTA_CATARINA_REGIONS.find(r => r.region === pubEditForm.area)?.cities.map(c => c.name) || [];
                          setPubEditForm(prev => ({ ...prev, cities: allRegCities }));
                        }}
                        className="text-[9px] font-black text-emerald-700 hover:underline uppercase cursor-pointer"
                      >
                        [ Selecionar Todas ]
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPubEditForm(prev => ({ ...prev, cities: [] }));
                        }}
                        className="text-[9px] font-black text-rose-700 hover:underline uppercase cursor-pointer"
                      >
                        [ Limpar Seleção ]
                      </button>
                    </div>
                  </div>
                  
                  {(() => {
                    const regData = SANTA_CATARINA_REGIONS.find(r => r.region === pubEditForm.area);
                    if (!regData || regData.cities.length === 0) {
                      return <p className="text-[10px] text-gray-400 uppercase font-bold">Nenhuma cidade encontrada para esta regional.</p>;
                    }
                    return (
                      <div className="grid grid-cols-2 gap-2 border-2 border-[#1A1A1B] p-2 bg-gray-50 max-h-40 overflow-y-auto">
                        {regData.cities.map(city => {
                          const isSelected = (pubEditForm.cities || []).includes(city.name);
                          return (
                            <div
                              key={city.name}
                              onClick={() => {
                                const current = pubEditForm.cities || [];
                                const next = current.includes(city.name)
                                  ? current.filter(c => c !== city.name)
                                  : [...current, city.name];
                                setPubEditForm(prev => ({ ...prev, cities: next }));
                              }}
                              className={`p-2 border-2 text-[11px] font-bold uppercase transition cursor-pointer flex items-center justify-between rounded-none ${
                                isSelected
                                  ? "bg-blue-50 border-[#004488] text-[#004488] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                                  : "bg-white border-gray-300 hover:border-[#1A1A1B] text-gray-700"
                              }`}
                            >
                              <span className="truncate pr-1">{city.name}</span>
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="h-3 w-3 accent-[#004488] pointer-events-none flex-shrink-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Caption input */}
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Legenda Recomendada / Roteiro</label>
                <textarea 
                  rows={4}
                  value={pubEditForm.caption || ""}
                  onChange={(e) => setPubEditForm(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder="Olá a todos! Hoje vim compartilhar nossa visão sobre..."
                  className="w-full p-2 border-2 border-[#1A1A1B] text-xs font-bold focus:outline-hidden resize-none"
                />
              </div>

              {/* Platforms selection */}
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-700 mb-1">Plataformas de Distribuição</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {["Instagram", "Facebook", "TikTok", "WhatsApp", "YouTube", "Twitter"].map(plat => {
                    const isSelected = pubEditForm.platforms?.includes(plat as any);
                    return (
                      <button
                        type="button"
                        key={plat}
                        onClick={() => {
                          const current = pubEditForm.platforms || [];
                          const next = current.includes(plat as any)
                            ? current.filter(p => p !== plat)
                            : [...current, plat as any];
                          setPubEditForm(prev => ({ ...prev, platforms: next }));
                        }}
                        className={`px-3 py-1 border border-[#1A1A1B] text-[10px] font-black uppercase transition cursor-pointer ${
                          isSelected ? "bg-[#004488] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {plat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 px-6 py-4 border-t-4 border-[#1A1A1B] flex items-center justify-end gap-2.5">
              <button
                onClick={() => handleSavePublication(pubEditForm as CandidatePublication)}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase border-2 border-[#1A1A1B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition cursor-pointer"
              >
                Salvar e Criar
              </button>
              <button
                onClick={() => setShowNewPubModal(false)}
                className="px-5 py-2.5 bg-white text-gray-700 text-xs font-black uppercase border-2 border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGIONAL EDITING MODAL */}
      {editingRegional && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print overflow-y-auto">
          <div className="bg-white border-4 border-[#1A1A1B] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-5xl rounded-none flex flex-col my-8 max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#004488] p-4 text-white border-b-4 border-[#1A1A1B] flex items-center justify-between flex-shrink-0">
              <h4 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <Globe size={16} />
                Editar Planejamento Regional: {editingRegional}
              </h4>
              <button 
                onClick={() => { setEditingRegional(null); setRegionalDrafts([]); }}
                className="text-white hover:text-gray-200 cursor-pointer text-xs font-bold uppercase font-mono"
              >
                [ Fechar X ]
              </button>
            </div>

            {/* Modal Body (Scrollable Table) */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-4">
                Configure a atuação, liderança, metas e perspectivas de votos para os municípios desta regional:
              </p>

              <div className="overflow-x-auto border border-[#bbbbbb] rounded-md max-h-[500px]">
                <table className="w-full border-collapse text-left text-[11px]">
                  <thead>
                    <tr className="bg-[#e6f0fa] text-[#004488] font-black uppercase tracking-wider sticky top-0 z-10 border-b border-[#bbbbbb]">
                      <th className="border border-[#bbbbbb] p-2 text-center" style={{ width: "50px" }}>Atuação</th>
                      <th className="border border-[#bbbbbb] p-2" style={{ minWidth: "140px" }}>Município</th>
                      <th className="border border-[#bbbbbb] p-2 text-right" style={{ width: "70px" }}>Eleitores</th>
                      <th className="border border-[#bbbbbb] p-2 text-right" style={{ width: "60px" }}>Filiados</th>
                      <th className="border border-[#bbbbbb] p-2" style={{ minWidth: "150px" }}>Liderança Principal</th>
                      <th className="border border-[#bbbbbb] p-2 text-center" style={{ width: "80px" }}>Histórico</th>
                      <th className="border border-[#bbbbbb] p-2 text-center" style={{ width: "80px" }}>Meta 2026</th>
                      <th className="border border-[#bbbbbb] p-2 text-center" style={{ minWidth: "160px" }}>Perspectiva Votos (Bom / Ideal / Ótimo)</th>
                      <th className="border border-[#bbbbbb] p-2" style={{ minWidth: "180px" }}>Situação / Demanda Crucial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionalDrafts.map((draft) => {
                      const regionalData = SANTA_CATARINA_REGIONS.find(r => r.region === editingRegional);
                      const cityStats = regionalData?.cities.find(c => c.name === draft.cityName);
                      const isAtivo = !!draft.atuacao;

                      return (
                        <tr 
                          key={draft.cityId}
                          className={`border-b border-gray-200 hover:bg-slate-50 transition-all ${
                            isAtivo ? "bg-emerald-50/40 font-medium text-gray-900" : "text-gray-500 bg-white"
                          }`}
                        >
                          {/* Checkbox Atuação */}
                          <td className="border border-gray-200 p-2 text-center">
                            <input 
                              type="checkbox"
                              checked={isAtivo}
                              onChange={(e) => handleRegionalDraftChange(draft.cityId, "atuacao", e.target.checked)}
                              className="h-3.5 w-3.5 text-emerald-600 border-gray-300 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </td>

                          {/* Município */}
                          <td className="border border-gray-200 p-2 font-bold">
                            {draft.cityName}
                          </td>

                          {/* Eleitores */}
                          <td className="border border-gray-200 p-2 text-right font-mono text-gray-600">
                            {cityStats ? formatNumber(cityStats.eleitores) : "-"}
                          </td>

                          {/* Filiados */}
                          <td className="border border-gray-200 p-2 text-right font-mono text-amber-700">
                            {cityStats ? formatNumber(cityStats.filiados) : "-"}
                          </td>

                          {/* Liderança */}
                          <td className="border border-gray-200 p-1.5">
                            <input 
                              type="text"
                              value={draft.lideranca || ""}
                              onChange={(e) => handleRegionalDraftChange(draft.cityId, "lideranca", e.target.value)}
                              placeholder="Liderança principal"
                              className="w-full bg-white border border-gray-300 rounded px-1.5 py-1 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-[#004488]"
                            />
                          </td>

                          {/* Histórico */}
                          <td className="border border-gray-200 p-1.5 text-center font-mono">
                            <input 
                              type="text"
                              value={draft.historicoVotos || ""}
                              onChange={(e) => handleRegionalDraftChange(draft.cityId, "historicoVotos", e.target.value.replace(/\D/g, ""))}
                              placeholder="0"
                              className="w-full bg-white border border-gray-300 rounded px-1 py-1 text-center text-[11px] focus:outline-hidden font-mono"
                            />
                          </td>

                          {/* Meta */}
                          <td className="border border-gray-200 p-1.5 text-center font-mono font-bold">
                            <input 
                              type="text"
                              value={draft.meta2026 || ""}
                              onChange={(e) => handleRegionalDraftChange(draft.cityId, "meta2026", e.target.value.replace(/\D/g, ""))}
                              placeholder="Meta"
                              className="w-full bg-white border border-gray-300 rounded px-1 py-1 text-center text-[11px] focus:outline-hidden font-mono font-bold text-[#004488]"
                            />
                          </td>

                          {/* Perspectivas */}
                          <td className="border border-gray-200 p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input 
                                type="text"
                                value={draft.perspectivaBom || ""}
                                onChange={(e) => handleRegionalDraftChange(draft.cityId, "perspectivaBom", e.target.value.replace(/\D/g, ""))}
                                placeholder="Bom"
                                title="Perspectiva Cenário Bom"
                                className="w-12 text-center bg-white border border-gray-300 rounded p-1 text-[10px] font-mono"
                              />
                              <input 
                                type="text"
                                value={draft.perspectivaIdeal || ""}
                                onChange={(e) => handleRegionalDraftChange(draft.cityId, "perspectivaIdeal", e.target.value.replace(/\D/g, ""))}
                                placeholder="Ideal"
                                title="Perspectiva Cenário Ideal"
                                className="w-12 text-center bg-white border border-gray-300 rounded p-1 text-[10px] font-mono"
                              />
                              <input 
                                type="text"
                                value={draft.perspectivaOtimo || ""}
                                onChange={(e) => handleRegionalDraftChange(draft.cityId, "perspectivaOtimo", e.target.value.replace(/\D/g, ""))}
                                placeholder="Ótimo"
                                title="Perspectiva Cenário Ótimo"
                                className="w-12 text-center bg-white border border-gray-300 rounded p-1 text-[10px] font-mono"
                              />
                            </div>
                          </td>

                          {/* Situação Demanda */}
                          <td className="border border-gray-200 p-1.5">
                            <input 
                              type="text"
                              value={draft.situacao || ""}
                              onChange={(e) => handleRegionalDraftChange(draft.cityId, "situacao", e.target.value)}
                              placeholder="Ex: Recursos para hospital"
                              className="w-full bg-white border border-gray-300 rounded px-1.5 py-1 text-[11px] focus:outline-hidden focus:ring-1 focus:ring-[#004488]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t-4 border-[#1A1A1B] flex items-center justify-end gap-2.5 flex-shrink-0">
              <button
                onClick={saveRegionalChanges}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase border-2 border-[#1A1A1B] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition cursor-pointer flex items-center gap-1"
              >
                <Check size={14} className="stroke-[3]" />
                Salvar Alterações
              </button>
              <button
                onClick={() => { setEditingRegional(null); setRegionalDrafts([]); }}
                className="px-5 py-2.5 bg-white text-gray-700 text-xs font-black uppercase border-2 border-gray-300 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT VIEW STRUCTURE (Styled specifically for physical/A4 printer formatting) */}
      <div className="print-only" style={{ display: "none" }}>
        {/* CABEÇALHO DA FICHA */}
        <div className="header-container">
          <div className="header-text">
            <h1>Ficha de Acompanhamento Estratégico</h1>
            <p>Partido: {formData.party} &nbsp;|&nbsp; Cargo: {formData.role || "Candidato(a) a Deputado(a) Estadual"} &nbsp;|&nbsp; Fase: {formData.status}</p>
          </div>
          <div className="photo-upload-box" style={{ backgroundImage: formData.photoUrl ? `url(${formData.photoUrl})` : "none", backgroundSize: "cover", backgroundPosition: "center" }}>
            {!formData.photoUrl && <span>Foto Oficial<br />(Anexo / Upload)</span>}
          </div>
        </div>

        {/* DADOS DO CANDIDATO */}
        <div className="section-title">Dados do(a) Candidato(a)</div>
        <table className="form-grid">
          <tr>
            <td className="label" style={{ width: "10%" }}>Candidato(a):</td>
            <td style={{ width: "60%" }}><span className="input-line">{formData.name}</span></td>
            <td className="label" style={{ width: "8%" }}>Número:</td>
            <td style={{ width: "22%" }}><span className="input-line">{formData.number}</span></td>
          </tr>
          <tr>
            <td className="label">Nome de Urna:</td>
            <td><span className="input-line">{formData.urnName}</span></td>
            <td className="label">WhatsApp:</td>
            <td><span className="input-line">{formData.whatsapp}</span></td>
          </tr>
          <tr>
            <td className="label">Instagram:</td>
            <td><span className="input-line">{formData.instagram}</span></td>
            <td className="label">Facebook:</td>
            <td><span className="input-line">{formData.facebook}</span></td>
          </tr>
          <tr>
            <td className="label">Email Oficial:</td>
            <td colSpan={3}><span className="input-line">{formData.email}</span></td>
          </tr>
        </table>

        {/* RESPONSÁVEL DE MÍDIAS */}
        <div className="section-title">Responsável pelas Mídias Sociais</div>
        <table className="form-grid">
          <tr>
            <td className="label" style={{ width: "18%" }}>Nome do Responsável:</td>
            <td style={{ width: "52%" }}><span className="input-line">{formData.mediaCoordinatorName}</span></td>
            <td className="label" style={{ width: "10%" }}>WhatsApp:</td>
            <td style={{ width: "20%" }}><span className="input-line">{formData.mediaCoordinatorWhatsApp}</span></td>
          </tr>
        </table>

        {/* PERFIL E ATUAÇÃO */}
        <div className="section-title">Atuação Profissional e Redes</div>
        <table className="form-grid">
          <tr>
            <td className="label" style={{ width: "15%" }}>Atuação Profissional:</td>
            <td colSpan={5}><span className="input-line">{formData.professionalBackground}</span></td>
          </tr>
          <tr>
            <td className="label">Áreas de Interesse:</td>
            <td colSpan={5}><span className="input-line">{formData.areasOfInterest}</span></td>
          </tr>
          <tr>
            <td className="label" style={{ width: "8%" }}>Equipes:</td>
            <td style={{ width: "25%" }}><span className="input-line">{formData.teams}</span></td>
            <td className="label" style={{ width: "8%" }}>Família:</td>
            <td style={{ width: "25%" }}><span className="input-line">{formData.family}</span></td>
            <td className="label" style={{ width: "16%" }}>Grupos Organizados:</td>
            <td style={{ width: "18%" }}><span className="input-line">{formData.groups}</span></td>
          </tr>
        </table>

        {/* TRAJETÓRIA E BANDEIRAS */}
        <div className="section-title">Trajetória Breve</div>
        <div className="pauted-lines" style={{ padding: "8px", fontSize: "11px", lineHeight: "25px" }}>{formData.trajectory}</div>

        <div className="section-title">Bandeiras Políticas</div>
        <div className="pauted-lines" style={{ padding: "8px", fontSize: "11px", lineHeight: "25px" }}>{formData.politicalFlags}</div>

        {/* REGISTRO DE CONTATOS CHAVE */}
        <div className="section-title">Contatos e Articuladores Chave da Campanha</div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "32%" }}>Nome (Lado A)</th>
              <th style={{ width: "18%" }}>WhatsApp (Lado A)</th>
              <th style={{ width: "32%" }}>Nome (Lado B)</th>
              <th style={{ width: "18%" }}>WhatsApp (Lado B)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, idx) => {
              const contact = formData.keyContacts[idx] || { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" };
              return (
                <tr key={idx}>
                  <td>{contact.ladoAName}</td>
                  <td>{contact.ladoAWhatsApp}</td>
                  <td>{contact.ladoBName}</td>
                  <td>{contact.ladoBWhatsApp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* MAPEAMENTO E DADOS ELEITORAIS */}
        <div className="section-title">Mapeamento Geográfico e Planejamento Eleitoral</div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Mesorregião / Município de Atuação</th>
              <th style={{ width: "18%" }}>Liderança Local Principal</th>
              <th style={{ width: "18%" }}>Histórico de Votos (Última)</th>
              <th style={{ width: "17%" }}>Meta de Votos (2026)</th>
              <th style={{ width: "17%" }}>Situação / Demanda Crucial</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const activeCities = (formData.mappings || []).filter(m => m.atuacao);
              if (activeCities.length === 0) {
                return (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", fontStyle: "italic", padding: "10px" }}>
                      Nenhum município com atuação mapeada neste relatório.
                    </td>
                  </tr>
                );
              }

              // Group active cities by region
              const grouped: { [region: string]: typeof activeCities } = {};
              activeCities.forEach(m => {
                const regName = m.region || "OUTROS";
                if (!grouped[regName]) grouped[regName] = [];
                grouped[regName].push(m);
              });

              const totalHistoricoPrint = activeCities.reduce((acc, m) => acc + (parseInt(m.historicoVotos, 10) || 0), 0);
              const totalMetaPrint = activeCities.reduce((acc, m) => acc + (parseInt(m.meta2026, 10) || 0), 0);

              return (
                <>
                  {Object.entries(grouped).map(([regionName, cities]) => (
                    <React.Fragment key={regionName}>
                      <tr className="region-header">
                        <td colSpan={5} style={{ fontWeight: "bold", background: "#f1f3f5", textTransform: "uppercase" }}>
                          Regional: {regionName}
                        </td>
                      </tr>
                      {cities.map(mapping => (
                        <tr key={mapping.cityName}>
                          <td style={{ fontWeight: "bold" }}>{mapping.cityName}</td>
                          <td>{mapping.lideranca || "-"}</td>
                          <td>{mapping.historicoVotos ? formatNumber(mapping.historicoVotos) : "-"}</td>
                          <td style={{ fontWeight: "bold", color: "#004488" }}>{mapping.meta2026 ? formatNumber(mapping.meta2026) : "-"}</td>
                          <td>{mapping.situacao || "-"}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  <tr style={{ fontWeight: "bold", background: "#e6f0fa", borderTop: "2px solid #1A1A1B" }}>
                    <td colSpan={2} style={{ textTransform: "uppercase", fontSize: "10px", fontWeight: "bold" }}>
                      META TOTAL ACUMULADA (CIDADES ATIVAS)
                    </td>
                    <td style={{ fontWeight: "bold" }}>{totalHistoricoPrint ? formatNumber(totalHistoricoPrint) : "-"}</td>
                    <td style={{ fontWeight: "black", color: "#004488", fontSize: "12px" }}>{totalMetaPrint ? formatNumber(totalMetaPrint) : "-"}</td>
                    <td></td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
