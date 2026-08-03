export type PartyType = "PSDB" | "Cidadania";

export type CampaignStatusType = 
  | "Pré-Campanha"
  | "Aprovado Convenção"
  | "Registro Concluído"
  | "Em Campanha"
  | "Suspenso";

export type PublicationStatusType = 
  | "Rascunho" 
  | "Em Produção" 
  | "Enviado" 
  | "Aprovado" 
  | "Rejeitado" 
  | "Agendado" 
  | "Postado";

export interface CandidatePublication {
  id: string;
  title: string;
  date: string;
  time?: string;
  platforms: string[];
  format: string;
  caption: string;
  status: PublicationStatusType;
  fileName?: string;
  fileSize?: string;
  rejectReason?: string;
  postUrl?: string;
  lastUpdated: string;
  postType?: "Reels" | "Feed" | "Dark Post" | string;
  area?: string;
  cities?: string[];
}

export interface KeyContact {
  ladoAName: string;
  ladoAWhatsApp: string;
  ladoBName: string;
  ladoBWhatsApp: string;
}

export interface CityMapping {
  cityId: string;
  cityName: string;
  region: string;
  lideranca: string;
  historicoVotos: string;
  meta2026: string;
  situacao: string;
  atuacao?: boolean;
  perspectivaBom?: string;
  perspectivaIdeal?: string;
  perspectivaOtimo?: string;
}

export type CandidateRoleType = 
  | "Candidato(a) a Deputado(a) Estadual"
  | "Candidato(a) a Deputado(a) Federal";

export interface Candidate {
  id: string;
  name: string;
  number: string;
  urnName: string;
  role?: CandidateRoleType | string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  email: string;
  party: PartyType;
  status: CampaignStatusType;
  photoUrl?: string;
  
  // Media coordinator
  mediaCoordinatorName: string;
  mediaCoordinatorWhatsApp: string;
  
  // Profile and background
  professionalBackground: string;
  areasOfInterest: string;
  teams: string;
  family: string;
  groups: string;
  
  // Text areas
  trajectory: string;
  politicalFlags: string;
  
  // Contacts
  keyContacts: KeyContact[]; // Fixed to 5 items
  
  // Geographic Mapping
  mappings: CityMapping[];
  
  // Agenda de Publicações
  publications: CandidatePublication[];
  
  lastSaved?: string;
}

export interface ElectoralDeadline {
  id: string;
  title: string;
  date: string; // ISO string or simple YYYY-MM-DD
  description: string;
  daysRemaining: number;
  status: "Pendente" | "Concluído" | "Atrasado" | "Crítico";
  category: "Convenção" | "Registro" | "Prestação de Contas" | "Propaganda" | "Outro";
}

export interface PartyReport {
  id: string;
  title: string;
  createdAt: string;
  content: string;
  author: string;
  candidateId?: string;
  candidateName?: string;
  type: "Desempenho" | "Jurídico" | "Geral" | "Estratégico";
}
