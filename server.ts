import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, collection } from "firebase/firestore";
import mysql from "mysql2/promise";

dotenv.config();

// MySQL connection pool initialization if configuration is present
let mysqlPool: mysql.Pool | null = null;
if (process.env.DB_USER) {
  console.log("MySQL configuration detected! Connecting to database:", process.env.DB_NAME);
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS || "Shift2026",
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4"
  });
}

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "data.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Initialize Firebase using the configuration file
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId || "(default)");

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure database file exists with initial mock data
const INITIAL_REGIONS = [
  { region: "GRANDE FLORIANÓPOLIS", cities: ["Florianópolis", "São José", "Palhoça", "Biguaçu", "Santo Amaro da Imperatriz"] },
  { region: "VALE DO ITAJAÍ", cities: ["Balneário Camboriú", "Itajaí", "Camboriú", "Ilhota", "Brusque"] },
  { region: "NORTE CATARINENSE", cities: ["Joinville", "Jaraguá do Sul", "Araquari", "Garuva", "São Francisco do Sul"] },
  { region: "SUL CATARINENSE", cities: ["Araranguá", "Turvo", "Ermo", "Praia Grande", "Sombrio"] },
  { region: "OESTE CATARINENSE", cities: ["Chapecó", "Concórdia", "Xanxerê", "Maravilha", "São Miguel do Oeste"] },
  { region: "SERRA CATARINENSE", cities: ["Lages", "Urubici", "São Joaquim", "Urupema", "Bom Retiro"] }
];

const DEFAULT_PUBLICATIONS = [
  {
    id: "pub-1",
    title: "Lançamento da Pré-Candidatura",
    date: "2026-07-01",
    time: "10:00",
    platforms: ["Instagram", "Facebook"],
    format: "Card",
    caption: "Com muita alegria e compromisso com o futuro de Santa Catarina, anuncio o lançamento da nossa pré-candidatura! Conto com o apoio de cada um de vocês nessa jornada de muito trabalho e dedicação pelo nosso povo. 🇧🇷✨ #SantaCatarina #Compromisso",
    status: "Postado" as const,
    fileName: "lancamento_pre_candidatura.png",
    fileSize: "1.5 MB",
    postUrl: "https://instagram.com/p/C7abc123",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "pub-2",
    title: "Bandeira da Saúde: Propostas regionais",
    date: "2026-07-06",
    time: "14:00",
    platforms: ["Instagram", "Facebook", "YouTube"],
    format: "Vídeo",
    caption: "A saúde pública de qualidade é nossa prioridade absoluta. Hoje falo sobre nossos projetos para zerar as filas de exames especializados e cirurgias eletivas em todas as regiões do estado. Assista e compartilhe suas ideias! 🏥💪 #SaudeSC #TrabalhoSério",
    status: "Postado" as const,
    fileName: "video_saude_propostas.mp4",
    fileSize: "18.4 MB",
    postUrl: "https://instagram.com/p/C7xyz456",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "pub-3",
    title: "Entrevista de Rádio - Desenvolvimento Regional",
    date: "2026-07-12",
    time: "08:30",
    platforms: ["YouTube", "WhatsApp"],
    format: "Vídeo",
    caption: "Sintonize amanhã na Rádio Aliança para acompanhar nossa entrevista sobre as necessidades de infraestrutura, pavimentação e fomento ao agronegócio no Oeste catarinense. Estaremos ao vivo a partir das 08:30! 📻🌾 #DesenvolvimentoSC #OesteSC",
    status: "Aprovado" as const,
    fileName: "roteiro_entrevista_radio.pdf",
    fileSize: "320 KB",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "pub-4",
    title: "Apoio às APAEs e Inclusão",
    date: "2026-07-16",
    time: "12:00",
    platforms: ["Instagram", "Facebook", "TikTok"],
    format: "Reels",
    caption: "Nosso mandato sempre esteve e sempre estará ao lado da inclusão social e do suporte integral às APAEs e entidades beneficentes do nosso estado. Garantir dignidade e inclusão para pessoas com deficiência é um dever de todos. 💙🤝 #Inclusao #APAEs #AmorAoProximo",
    status: "Em Produção" as const,
    lastUpdated: new Date().toISOString()
  },
  {
    id: "pub-5",
    title: "Encontro com Lideranças do Vale",
    date: "2026-07-20",
    time: "19:00",
    platforms: ["Instagram", "X"],
    format: "Foto",
    caption: "Hoje realizamos uma reunião produtiva com prefeitos, vereadores e lideranças do Vale do Itajaí. Discutimos novas frentes de investimento e como a nossa federação pode potencializar os convênios municipais. 📈🗺️ #Liderancas #TrabalhoForte #Municipalismo",
    status: "Agendado" as const,
    fileName: "arte_encontro_liderancas.png",
    fileSize: "2.1 MB",
    lastUpdated: new Date().toISOString()
  },
  {
    id: "pub-6",
    title: "Dica de Utilidade Pública: Cadastro Eleitoral",
    date: "2026-07-25",
    time: "09:00",
    platforms: ["Instagram", "Facebook", "WhatsApp"],
    format: "Carrossel",
    caption: "Atenção eleitor! O prazo para regularização do título de eleitor está chegando. Preparamos esse carrossel informativo passo a passo para você não perder a oportunidade de exercer sua cidadania nestas eleições! 🗳️📲 #Eleicoes2026 #Cidadania #UtilidadePublica",
    status: "Enviado" as const,
    fileName: "carrossel_utilidade_cadastro.pdf",
    fileSize: "4.8 MB",
    lastUpdated: new Date().toISOString()
  }
];

const generateBlankMapping = () => {
  const mapping: any[] = [];
  INITIAL_REGIONS.forEach(reg => {
    reg.cities.forEach(city => {
      mapping.push({
        cityId: city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"),
        cityName: city,
        region: reg.region,
        lideranca: "",
        historicoVotos: "",
        meta2026: "",
        situacao: ""
      });
    });
  });
  return mapping;
};

const getSeedCandidates = () => {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      if (fileData.candidates && Array.isArray(fileData.candidates) && fileData.candidates.length > 0) {
        return fileData.candidates;
      }
    } catch (e) {
      console.error("Error reading data.json in getSeedCandidates:", e);
    }
  }
  return [
  {
    id: "cand-1",
    name: "Geovania de Sá",
    number: "23023",
    urnName: "GEOVANIA DE SÁ",
    whatsapp: "(48) 99912-3456",
    instagram: "@geovaniadesa",
    facebook: "GeovaniaDeSaOficial",
    email: "geovania.sa@cidadania23.org.br",
    party: "Cidadania" as const,
    status: "Em Campanha" as const,
    photoUrl: "",
    mediaCoordinatorName: "Thiago Goulart",
    mediaCoordinatorWhatsApp: "(48) 99122-8765",
    professionalBackground: "Assistente Social de carreira, Deputada Federal, ex-secretária municipal de Assistência Social e de Saúde de Criciúma.",
    areasOfInterest: "Assistência Social, Saúde Pública, Defesa dos Direitos da Mulher e Emprego.",
    teams: "Coordenação Sul, Mídias Sociais, Mobilização Criciúma",
    family: "Apoio familiar integral no Sul Catarinense",
    groups: "Entidades filantrópicas, Associações de Bairro, Igrejas, Lideranças de Assistência",
    trajectory: "Com sólida trajetória na área social, Geovania iniciou sua vida pública na gestão local em Criciúma. Eleita deputada, obteve destaque pela destinação recorde de emendas para a saúde catarinense.",
    politicalFlags: "Saúde com dignidade, proteção integral à infância, valorização das entidades filantrópicas e assistência aos municípios.",
    keyContacts: [
      { ladoAName: "Prefeito Clésio Salvaro", ladoAWhatsApp: "(48) 99144-1122", ladoBName: "Vereadora Geovana", ladoBWhatsApp: "(48) 99822-3344" },
      { ladoAName: "Acélio Casagrande", ladoAWhatsApp: "(48) 99933-2211", ladoBName: "Pastor Emerson", ladoBWhatsApp: "(48) 99111-5544" },
      { ladoAName: "Liderança Júlio (Araranguá)", ladoAWhatsApp: "(48) 99655-4433", ladoBName: "Coordenador Alisson", ladoBWhatsApp: "(48) 99201-4455" },
      { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" },
      { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" }
    ],
    publications: DEFAULT_PUBLICATIONS.map(pub => ({ ...pub })),
    mappings: generateBlankMapping().map(m => {
      if (m.cityName === "Florianópolis") {
        return { ...m, lideranca: "Roberto Souza (Suplente)", historicoVotos: "1.250", meta2026: "3.500", situacao: "Demanda por ampliação da rede de assistência na Grande Florianópolis." };
      }
      if (m.cityName === "Araranguá") {
        return { ...m, lideranca: "Júlio César", historicoVotos: "2.800", meta2026: "5.000", situacao: "Visita de campanha agendada; forte apoio das igrejas locais." };
      }
      return m;
    }),
    lastSaved: new Date().toISOString()
  },
  {
    id: "cand-2",
    name: "Marcos Vieira",
    number: "45045",
    urnName: "MARCOS VIEIRA",
    whatsapp: "(48) 99888-4545",
    instagram: "@marcosvieiradeputado",
    facebook: "marcosvieira45",
    email: "deputadomarcosvieira@psdb.org.br",
    party: "PSDB" as const,
    status: "Em Campanha" as const,
    photoUrl: "",
    mediaCoordinatorName: "Juliano de Souza",
    mediaCoordinatorWhatsApp: "(48) 99981-2245",
    professionalBackground: "Bacharel em Direito, Deputado Estadual com larga experiência administrativa, ex-Secretário de Estado da Administração.",
    areasOfInterest: "Infraestrutura Municipal, Orçamento do Estado, Apoio ao Agronegócio, Municipalismo.",
    teams: "Escritório Central Fpolis, Equipe Oeste (Chapecó), Equipe Serra",
    family: "Larga rede familiar e política ativa em SC",
    groups: "Prefeitos e Vice-Prefeitos de SC, Secretarias Municipais de Infraestrutura, Cooperativas Agrícolas",
    trajectory: "Líder histórico do PSDB em Santa Catarina, Marcos Vieira construiu sua reputação no municipalismo, sendo o deputado que mais garantiu recursos diretos para convênios com prefeituras.",
    politicalFlags: "Fortalecimento dos municípios, descentralização do orçamento, pavimentação asfáltica de estradas rurais e crédito ao pequeno produtor.",
    keyContacts: [
      { ladoAName: "Prefeito João Rodrigues (Apoio)", ladoAWhatsApp: "(49) 99981-1122", ladoBName: "Prefeita de Cunha Porã", ladoBWhatsApp: "(49) 99812-4523" },
      { ladoAName: "Vice-Prefeito de São José", ladoAWhatsApp: "(48) 99112-2345", ladoBName: "Presidente Regional PSDB", ladoBWhatsApp: "(48) 99651-1212" },
      { ladoAName: "Secretário de Obras", ladoAWhatsApp: "(48) 99823-1122", ladoBName: "Assessor Regional Oeste", ladoBWhatsApp: "(49) 99932-1244" },
      { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" },
      { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" }
    ],
    publications: DEFAULT_PUBLICATIONS.map(pub => ({ ...pub })),
    mappings: generateBlankMapping().map(m => {
      if (m.cityName === "Chapecó") {
        return { ...m, lideranca: "Coordenador Regional Valdir", historicoVotos: "5.400", meta2026: "8.000", situacao: "Encontro estratégico agendado com sindicatos de produtores rurais." };
      }
      if (m.cityName === "São José") {
        return { ...m, lideranca: "Ademir de Souza", historicoVotos: "3.100", meta2026: "5.000", situacao: "Demanda crucial de asfalto em bairros periféricos de divisa." };
      }
      return m;
    }),
    lastSaved: new Date().toISOString()
  },
  {
    id: "cand-3",
    name: "Dr. Vicente Caropreso",
    number: "45111",
    urnName: "DR. VICENTE CAROPRESO",
    whatsapp: "(47) 99122-1111",
    instagram: "@drvicentecaropreso",
    facebook: "VicenteCaropreso",
    email: "dr.vicente@psdb.org.br",
    party: "PSDB" as const,
    status: "Em Campanha" as const,
    photoUrl: "",
    mediaCoordinatorName: "Daniela Althoff",
    mediaCoordinatorWhatsApp: "(47) 99211-5463",
    professionalBackground: "Médico Neurologista, ex-Secretário de Estado da Saúde de Santa Catarina, Deputado Estadual atuante na saúde pública.",
    areasOfInterest: "Saúde, Direitos das Pessoas com Deficiência, Inclusão de Autistas, Educação Especial.",
    teams: "Escritório Jaraguá do Sul, Equipe de Saúde Norte, Voluntariado APAEs",
    family: "Lideranças da comunidade alemã no Vale do Itapocu",
    groups: "Diretoria das APAEs de Santa Catarina, Associação Catarinense de Medicina, Rede de Autismo",
    trajectory: "Dr. Vicente é reconhecido pelo trabalho incansável nas pautas de saúde pública e acessibilidade, sendo o autor de legislações estaduais pioneiras no suporte ao transtorno do espectro autista.",
    politicalFlags: "Zerar filas do SUS, financiamento integral para as APAEs e AMAs, diagnóstico precoce de neuropatias infantis e hospitais filantrópicos estruturados.",
    keyContacts: [
      { ladoAName: "Presidente Estadual das APAEs", ladoAWhatsApp: "(48) 99111-2244", ladoBName: "Prefeito de Jaraguá do Sul", ladoBWhatsApp: "(47) 99882-1212" },
      { ladoAName: "Dr. Marcelo (CRM-SC)", ladoAWhatsApp: "(48) 99934-5566", ladoBName: "Coordenadora AMA Norte", ladoBWhatsApp: "(47) 99211-3344" },
      { ladoAName: "Líder Comunitário Blumenau", ladoAWhatsApp: "(47) 99611-2233", ladoBName: "Assessor Jurídico Campanha", ladoBWhatsApp: "(47) 99144-8899" },
      { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" },
      { ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" }
    ],
    publications: DEFAULT_PUBLICATIONS.map((pub, idx) => ({ 
      ...pub, 
      status: idx < 2 ? ("Postado" as const) : idx < 4 ? ("Aprovado" as const) : ("Em Produção" as const)
    })),
    mappings: generateBlankMapping().map(m => {
      if (m.cityName === "Jaraguá do Sul") {
        return { ...m, lideranca: "Diretoria Local", historicoVotos: "18.200", meta2026: "25.000", situacao: "Forte base consolidada. Pauta: liberação de recursos para o Hospital São José." };
      }
      if (m.cityName === "Joinville") {
        return { ...m, lideranca: "Dr. Luiz (Médico parceiro)", historicoVotos: "4.200", meta2026: "7.000", situacao: "Demanda de ampliação dos leitos de retaguarda pediátricos." };
      }
      return m;
    }),
    lastSaved: new Date().toISOString()
  }
];
};

const DEFAULT_DEADLINES = [
  { id: "dl-1", title: "Janela Partidária (Desfiliação/Filiação)", date: "2026-04-03", description: "Período para detentores de mandato mudarem de partido sem perda do mandato cargo.", daysRemaining: 0, status: "Concluído" as const, category: "Convenção" as const },
  { id: "dl-2", title: "Fechamento do Cadastro Eleitoral", date: "2026-05-06", description: "Data limite para alistamento eleitoral, transferência de domicílio e regularização do título.", daysRemaining: 0, status: "Concluído" as const, category: "Registro" as const },
  { id: "dl-3", title: "Início das Convenções Partidárias", date: "2026-07-20", description: "Início do período em que partidos e federações realizam reuniões para escolher candidatos.", daysRemaining: 12, status: "Pendente" as const, category: "Convenção" as const },
  { id: "dl-4", title: "Término das Convenções Partidárias", date: "2026-08-05", description: "Prazo final de deliberação sobre coligações, federações e definição dos candidatos oficiais.", daysRemaining: 28, status: "Pendente" as const, category: "Convenção" as const },
  { id: "dl-5", title: "Prazo Limite para Registro de Candidaturas", date: "2026-08-15", description: "Último dia para que os partidos apresentem no TRE o requerimento de registro de candidatos.", daysRemaining: 38, status: "Crítico" as const, category: "Registro" as const },
  { id: "dl-6", title: "Início da Propaganda Eleitoral Geral", date: "2026-08-16", description: "Dia a partir do qual é permitida a propaganda eleitoral pública, na internet e nas ruas.", daysRemaining: 39, status: "Pendente" as const, category: "Propaganda" as const },
  { id: "dl-7", title: "Envio de Relatórios de Contas Parcial", date: "2026-09-15", description: "Apresentação da prestação de contas parcial com discriminação dos recursos recebidos e gastos.", daysRemaining: 69, status: "Pendente" as const, category: "Prestação de Contas" as const },
  { id: "dl-8", title: "Eleições 2026 - Primeiro Turno", date: "2026-10-04", description: "Dia oficial da votação em todo o país em primeiro turno das eleições gerais de 2026.", daysRemaining: 88, status: "Pendente" as const, category: "Outro" as const }
];

const DEFAULT_REPORTS = [
  {
    id: "rep-1",
    title: "Análise Preliminar de Registro - Dr. Vicente Caropreso",
    createdAt: new Date().toISOString(),
    content: "O candidato Dr. Vicente Caropreso possui 75% da documentação entregue e validada. Falta apenas o Comprovante de Escolaridade e a Certidão de Filiação Partidária. A situação jurídica está estável, sem impedimentos decorrentes de antecedentes criminais nas justiças federal e estadual.",
    author: "Assessoria Jurídica Federação",
    candidateId: "cand-3",
    candidateName: "Dr. Vicente Caropreso",
    type: "Jurídico" as const
  }
];

// Seed databases in Firestore if they don't exist
async function seedFirestoreIfNeeded() {
  try {
    const snapshot = await getDocs(collection(firestoreDb, "candidates"));
    if (snapshot.empty) {
      console.log("Firestore is empty. Seeding database with default candidates, deadlines, and reports...");
      
      const seedCandidates = getSeedCandidates();
      for (const candidate of seedCandidates) {
        await setDoc(doc(firestoreDb, "candidates", candidate.id), candidate);
      }
      
      for (const deadline of DEFAULT_DEADLINES) {
        await setDoc(doc(firestoreDb, "deadlines", deadline.id), deadline);
      }
      
      for (const report of DEFAULT_REPORTS) {
        await setDoc(doc(firestoreDb, "reports", report.id), report);
      }
      console.log("Firestore seeding completed successfully!");
    } else {
      console.log("Firestore already contains data. Skipping seeding.");
    }
  } catch (error) {
    console.error("Error during Firestore seeding:", error);
  }
}

// Read database utilities
async function getCandidatesFromFirestore(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(firestoreDb, "candidates"));
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    return list.sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error("Error fetching candidates from Firestore:", error);
    return [];
  }
}

async function getDeadlinesFromFirestore(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(firestoreDb, "deadlines"));
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    return list;
  } catch (error) {
    console.error("Error fetching deadlines from Firestore:", error);
    return [];
  }
}

async function getReportsFromFirestore(): Promise<any[]> {
  try {
    const snapshot = await getDocs(collection(firestoreDb, "reports"));
    const list: any[] = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching reports from Firestore:", error);
    return [];
  }
}

// MySQL Table verification, creation and seeding on startup
async function initMySQLIfNeeded() {
  if (!mysqlPool) return;
  
  console.log("Checking MySQL database availability...");
  let conn;
  try {
    conn = await mysqlPool.getConnection();
  } catch (error: any) {
    console.log("MySQL database is not active or reachable. Using Firestore database for data storage.");
    mysqlPool = null;
    await seedFirestoreIfNeeded();
    return;
  }

  try {
    // 1. candidates table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        number VARCHAR(50),
        urnName VARCHAR(255),
        whatsapp VARCHAR(50),
        instagram VARCHAR(255),
        facebook VARCHAR(255),
        email VARCHAR(255),
        party VARCHAR(50),
        status VARCHAR(50),
        photoUrl LONGTEXT,
        mediaCoordinatorName VARCHAR(255),
        mediaCoordinatorWhatsApp VARCHAR(50),
        professionalBackground TEXT,
        areasOfInterest TEXT,
        teams TEXT,
        family TEXT,
        groups TEXT,
        trajectory TEXT,
        politicalFlags TEXT,
        keyContacts LONGTEXT,
        publications LONGTEXT,
        mappings LONGTEXT,
        lastSaved VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. deadlines table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS deadlines (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255),
        date VARCHAR(50),
        description TEXT,
        daysRemaining INT,
        status VARCHAR(50),
        category VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. reports table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255),
        createdAt VARCHAR(100),
        content TEXT,
        author VARCHAR(255),
        candidateId VARCHAR(50),
        candidateName VARCHAR(255),
        type VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("MySQL tables verified/created successfully!");

    // Check if candidates table is empty, seed if so
    const [rows]: any = await conn.query("SELECT COUNT(*) as count FROM candidates");
    if (rows[0].count === 0) {
      console.log("MySQL database is empty. Seeding with default candidates, deadlines, and reports...");
      
      const seedCandidates = getSeedCandidates();
      for (const candidate of seedCandidates) {
        await conn.query(`
          INSERT INTO candidates (
            id, name, number, urnName, whatsapp, instagram, facebook, email, party, status, photoUrl,
            mediaCoordinatorName, mediaCoordinatorWhatsApp, professionalBackground, areasOfInterest,
            teams, family, groups, trajectory, politicalFlags, keyContacts, publications, mappings, lastSaved
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          candidate.id,
          candidate.name,
          candidate.number,
          candidate.urnName,
          candidate.whatsapp,
          candidate.instagram,
          candidate.facebook,
          candidate.email,
          candidate.party,
          candidate.status,
          candidate.photoUrl || "",
          candidate.mediaCoordinatorName || "",
          candidate.mediaCoordinatorWhatsApp || "",
          candidate.professionalBackground || "",
          candidate.areasOfInterest || "",
          candidate.teams || "",
          candidate.family || "",
          candidate.groups || "",
          candidate.trajectory || "",
          candidate.politicalFlags || "",
          JSON.stringify(candidate.keyContacts || []),
          JSON.stringify(candidate.publications || []),
          JSON.stringify(candidate.mappings || []),
          candidate.lastSaved || new Date().toISOString()
        ]);
      }

      for (const deadline of DEFAULT_DEADLINES) {
        await conn.query(`
          INSERT INTO deadlines (id, title, date, description, daysRemaining, status, category)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          deadline.id,
          deadline.title,
          deadline.date,
          deadline.description,
          deadline.daysRemaining,
          deadline.status,
          deadline.category
        ]);
      }

      for (const report of DEFAULT_REPORTS) {
        await conn.query(`
          INSERT INTO reports (id, title, createdAt, content, author, candidateId, candidateName, type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          report.id,
          report.title,
          report.createdAt,
          report.content,
          report.author,
          report.candidateId,
          report.candidateName,
          report.type
        ]);
      }
      console.log("MySQL seeding completed successfully!");
    } else {
      console.log("MySQL database already contains data. Skipping seeding.");
    }
  } catch (error) {
    console.error("Error checking or seeding MySQL:", error);
  } finally {
    conn.release();
  }
}

// Unified Database CRUD layer (dynamically switches between MySQL and Firestore)
async function getCandidates(): Promise<any[]> {
  let list: any[] = [];
  if (mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query("SELECT * FROM candidates");
      list = rows.map((cand: any) => ({
        ...cand,
        keyContacts: JSON.parse(cand.keyContacts || "[]"),
        publications: JSON.parse(cand.publications || "[]"),
        mappings: JSON.parse(cand.mappings || "[]")
      }));
    } catch (error) {
      console.error("Error reading candidates from MySQL:", error);
      list = [];
    }
  } else {
    list = await getCandidatesFromFirestore();
  }

  // Ensure any candidate named "Charles Purim" or "Charles" is corrected to "Tcharles Purim" / "TCHARLES PURIM"
  list = list.map((cand: any) => {
    let name = cand.name || "";
    let urnName = cand.urnName || "";
    if (name.trim().toLowerCase() === "charles purim" || name.trim().toLowerCase() === "charles") {
      name = "Tcharles Purim";
    }
    if (urnName.trim().toLowerCase() === "charles purim" || urnName.trim().toLowerCase() === "charles") {
      urnName = "TCHARLES PURIM";
    }
    return { ...cand, name, urnName };
  });

  // Sort candidates alphabetically by name (pt-BR)
  return list.sort((a, b) => {
    const nameA = (a.name || a.urnName || "").trim();
    const nameB = (b.name || b.urnName || "").trim();
    return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
  });
}

async function getDeadlines(): Promise<any[]> {
  if (mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query("SELECT * FROM deadlines");
      return rows;
    } catch (error) {
      console.error("Error reading deadlines from MySQL:", error);
      return [];
    }
  } else {
    return getDeadlinesFromFirestore();
  }
}

async function getReports(): Promise<any[]> {
  if (mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query("SELECT * FROM reports ORDER BY createdAt DESC");
      return rows;
    } catch (error) {
      console.error("Error reading reports from MySQL:", error);
      return [];
    }
  } else {
    return getReportsFromFirestore();
  }
}

async function getCandidateById(id: string): Promise<any | null> {
  if (mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query("SELECT * FROM candidates WHERE id = ?", [id]);
      if (rows.length === 0) return null;
      const cand = rows[0];
      return {
        ...cand,
        keyContacts: JSON.parse(cand.keyContacts || "[]"),
        publications: JSON.parse(cand.publications || "[]"),
        mappings: JSON.parse(cand.mappings || "[]")
      };
    } catch (error) {
      console.error("Error fetching candidate by ID from MySQL:", error);
      return null;
    }
  } else {
    const docRef = doc(firestoreDb, "candidates", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data();
  }
}

async function saveCandidate(candidate: any): Promise<void> {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      if (fileData && Array.isArray(fileData.candidates)) {
        const idx = fileData.candidates.findIndex((c: any) => c.id === candidate.id);
        if (idx >= 0) {
          fileData.candidates[idx] = candidate;
        } else {
          fileData.candidates.push(candidate);
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2), "utf8");
      }
    } catch (e) {
      console.error("Error writing candidate to data.json:", e);
    }
  }

  if (mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query("SELECT id FROM candidates WHERE id = ?", [candidate.id]);
      if (rows.length > 0) {
        await mysqlPool.query(`
          UPDATE candidates SET
            name = ?, number = ?, urnName = ?, whatsapp = ?, instagram = ?, facebook = ?, email = ?,
            party = ?, status = ?, photoUrl = ?, mediaCoordinatorName = ?, mediaCoordinatorWhatsApp = ?,
            professionalBackground = ?, areasOfInterest = ?, teams = ?, family = ?, groups = ?,
            trajectory = ?, politicalFlags = ?, keyContacts = ?, publications = ?, mappings = ?, lastSaved = ?
          WHERE id = ?
        `, [
          candidate.name || "",
          candidate.number || "",
          candidate.urnName || "",
          candidate.whatsapp || "",
          candidate.instagram || "",
          candidate.facebook || "",
          candidate.email || "",
          candidate.party || "",
          candidate.status || "",
          candidate.photoUrl || "",
          candidate.mediaCoordinatorName || "",
          candidate.mediaCoordinatorWhatsApp || "",
          candidate.professionalBackground || "",
          candidate.areasOfInterest || "",
          candidate.teams || "",
          candidate.family || "",
          candidate.groups || "",
          candidate.trajectory || "",
          candidate.politicalFlags || "",
          JSON.stringify(candidate.keyContacts || []),
          JSON.stringify(candidate.publications || []),
          JSON.stringify(candidate.mappings || []),
          candidate.lastSaved,
          candidate.id
        ]);
      } else {
        await mysqlPool.query(`
          INSERT INTO candidates (
            id, name, number, urnName, whatsapp, instagram, facebook, email, party, status, photoUrl,
            mediaCoordinatorName, mediaCoordinatorWhatsApp, professionalBackground, areasOfInterest,
            teams, family, groups, trajectory, politicalFlags, keyContacts, publications, mappings, lastSaved
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          candidate.id,
          candidate.name || "",
          candidate.number || "",
          candidate.urnName || "",
          candidate.whatsapp || "",
          candidate.instagram || "",
          candidate.facebook || "",
          candidate.email || "",
          candidate.party || "",
          candidate.status || "",
          candidate.photoUrl || "",
          candidate.mediaCoordinatorName || "",
          candidate.mediaCoordinatorWhatsApp || "",
          candidate.professionalBackground || "",
          candidate.areasOfInterest || "",
          candidate.teams || "",
          candidate.family || "",
          candidate.groups || "",
          candidate.trajectory || "",
          candidate.politicalFlags || "",
          JSON.stringify(candidate.keyContacts || []),
          JSON.stringify(candidate.publications || []),
          JSON.stringify(candidate.mappings || []),
          candidate.lastSaved
        ]);
      }
    } catch (error) {
      console.error("Error saving candidate to MySQL:", error);
      throw error;
    }
  } else {
    await setDoc(doc(firestoreDb, "candidates", candidate.id), candidate);
  }
}

async function deleteCandidate(id: string): Promise<void> {
  if (mysqlPool) {
    try {
      await mysqlPool.query("DELETE FROM candidates WHERE id = ?", [id]);
    } catch (error) {
      console.error("Error deleting candidate from MySQL:", error);
      throw error;
    }
  } else {
    await deleteDoc(doc(firestoreDb, "candidates", id));
  }
}

async function saveDeadline(deadline: any): Promise<void> {
  if (mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query("SELECT id FROM deadlines WHERE id = ?", [deadline.id]);
      if (rows.length > 0) {
        await mysqlPool.query(`
          UPDATE deadlines SET title = ?, date = ?, description = ?, daysRemaining = ?, status = ?, category = ?
          WHERE id = ?
        `, [
          deadline.title,
          deadline.date,
          deadline.description,
          deadline.daysRemaining,
          deadline.status,
          deadline.category,
          deadline.id
        ]);
      } else {
        await mysqlPool.query(`
          INSERT INTO deadlines (id, title, date, description, daysRemaining, status, category)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          deadline.id,
          deadline.title,
          deadline.date,
          deadline.description,
          deadline.daysRemaining,
          deadline.status,
          deadline.category
        ]);
      }
    } catch (error) {
      console.error("Error saving deadline to MySQL:", error);
      throw error;
    }
  } else {
    await setDoc(doc(firestoreDb, "deadlines", deadline.id), deadline);
  }
}

async function saveReport(report: any): Promise<void> {
  if (mysqlPool) {
    try {
      await mysqlPool.query(`
        INSERT INTO reports (id, title, createdAt, content, author, candidateId, candidateName, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          createdAt = VALUES(createdAt),
          content = VALUES(content),
          author = VALUES(author),
          candidateId = VALUES(candidateId),
          candidateName = VALUES(candidateName),
          type = VALUES(type)
      `, [
        report.id,
        report.title,
        report.createdAt,
        report.content,
        report.author,
        report.candidateId,
        report.candidateName,
        report.type
      ]);
    } catch (error) {
      console.error("Error saving report to MySQL:", error);
      throw error;
    }
  } else {
    await setDoc(doc(firestoreDb, "reports", report.id), report);
  }
}


// Calculate dynamic electoral deadlines remaining days relative to 2026-07-08T11:16:28-07:00 (represented by current time)
function updateDaysRemaining(deadlines: any[]) {
  const currentDate = new Date("2026-07-08T11:16:28-07:00");
  return deadlines.map(dl => {
    const targetDate = new Date(dl.date + "T23:59:59");
    const diffTime = targetDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let updatedStatus = dl.status;
    let daysRemaining = diffDays < 0 ? 0 : diffDays;
    
    if (daysRemaining === 0) {
      updatedStatus = "Concluído";
    } else if (daysRemaining <= 15) {
      updatedStatus = "Crítico";
    } else if (daysRemaining <= 30) {
      updatedStatus = "Crítico"; // Or Pendente
    } else {
      updatedStatus = "Pendente";
    }
    
    return {
      ...dl,
      daysRemaining,
      status: dl.status === "Concluído" ? "Concluído" : updatedStatus
    };
  });
}

// Initialize Gemini Client
let geminiAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  geminiAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// MIDDLEWARES
app.use(express.json({ limit: "50mb" })); // Support base64 image and files upload

// API ENDPOINTS

// 1. GET ALL DATA
app.get("/api/dashboard", async (req, res) => {
  try {
    const candidates = await getCandidates();
    const rawDeadlines = await getDeadlines();
    const reports = await getReports();
    const deadlines = updateDaysRemaining(rawDeadlines);
    res.json({ candidates, deadlines, reports });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Erro ao obter dados do painel." });
  }
});

// 2. CANDIDATES
app.get("/api/candidates", async (req, res) => {
  try {
    const candidates = await getCandidates();
    res.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ error: "Erro ao obter candidatos." });
  }
});

// Add or update candidate (Auto-save)
app.post("/api/candidates", async (req, res) => {
  const candidate = req.body;
  
  if (!candidate.id) {
    candidate.id = "cand-" + Date.now();
  }
  
  // Enforce types, structure, defaults if needed
  if (!candidate.keyContacts || candidate.keyContacts.length === 0) {
    candidate.keyContacts = Array(5).fill({ ladoAName: "", ladoAWhatsApp: "", ladoBName: "", ladoBWhatsApp: "" });
  }
  if (!candidate.mappings || candidate.mappings.length === 0) {
    candidate.mappings = generateBlankMapping();
  }
  if (!candidate.publications || candidate.publications.length === 0) {
    candidate.publications = DEFAULT_PUBLICATIONS.map(pub => ({ ...pub }));
  }
  
  candidate.lastSaved = new Date().toISOString();
  
  try {
    const existing = await getCandidateById(candidate.id);
    if (existing) {
      // Preserve any manual file names if the update payload doesn't contain them
      candidate.publications = candidate.publications.map((newPub: any) => {
        const oldPub = (existing.publications || []).find((p: any) => p.id === newPub.id);
        return {
          ...newPub,
          fileName: newPub.fileName || (oldPub ? oldPub.fileName : undefined),
          fileSize: newPub.fileSize || (oldPub ? oldPub.fileSize : undefined),
          status: newPub.status || (oldPub ? oldPub.status : "Rascunho")
        };
      });
    }
    
    await saveCandidate(candidate);
    res.json({ success: true, candidate });
  } catch (error) {
    console.error("Error saving candidate:", error);
    res.status(500).json({ error: "Erro ao salvar candidato." });
  }
});

// Delete candidate
app.delete("/api/candidates/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await deleteCandidate(id);
    res.json({ success: true, message: "Candidato removido com sucesso." });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ error: "Erro ao remover candidato." });
  }
});

// Handle simulated file upload
app.post("/api/candidates/:id/upload", async (req, res) => {
  const { id } = req.params;
  const { docId, pubId, fileName, fileSize, base64 } = req.body;
  const targetId = pubId || docId;
  
  try {
    const candidate = await getCandidateById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }
    
    // Update photoUrl if docId/targetId is 'photo'
    if (targetId === "photo") {
      if (base64) {
        // Save the base64 string directly so it is 100% persistent and survives ephemeral container restarts!
        candidate.photoUrl = base64;
        
        // Also save fallback file to disk
        try {
          const fileBuffer = Buffer.from(base64.split(",")[1], "base64");
          const safeName = `cand_${id}_profile_${path.basename(fileName)}`;
          const filePath = path.join(UPLOADS_DIR, safeName);
          fs.writeFileSync(filePath, fileBuffer);
        } catch (e) {
          console.error("Failed to write profile fallback file:", e);
        }
      } else {
        candidate.photoUrl = "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";
      }
    } else {
      // Update publication file in the schedule
      if (!candidate.publications) {
        candidate.publications = [];
      }
      candidate.publications = candidate.publications.map((p: any) => {
        if (p.id === targetId) {
          // If file buffer is provided, save it
          if (base64) {
            const fileBuffer = Buffer.from(base64.split(",")[1], "base64");
            const safeName = `cand_${id}_pub_${targetId}_${path.basename(fileName)}`;
            const filePath = path.join(UPLOADS_DIR, safeName);
            fs.writeFileSync(filePath, fileBuffer);
          }
          return {
            ...p,
            status: "Enviado",
            fileName: fileName,
            fileSize: fileSize || "Incalculável",
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      });
    }
    
    candidate.lastSaved = new Date().toISOString();
    await saveCandidate(candidate);
    
    res.json({ success: true, candidate });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Erro ao salvar arquivo de upload." });
  }
});

// Update Publication Status manually (Aprovado/Rejeitado/Postado)
const handleStatusUpdate = async (req: any, res: any) => {
  const { id } = req.params;
  const { pubId, docId, status, rejectReason, postUrl } = req.body;
  const targetId = pubId || docId;
  
  try {
    const candidate = await getCandidateById(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }
    
    if (!candidate.publications) {
      candidate.publications = [];
    }
    candidate.publications = candidate.publications.map((p: any) => {
      if (p.id === targetId) {
        return {
          ...p,
          status,
          rejectReason: status === "Rejeitado" ? rejectReason : undefined,
          postUrl: status === "Postado" ? postUrl || p.postUrl : p.postUrl,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });
    
    candidate.lastSaved = new Date().toISOString();
    await saveCandidate(candidate);
    
    res.json({ success: true, candidate });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Erro ao atualizar status do candidato." });
  }
};

app.post("/api/candidates/:id/publication-status", handleStatusUpdate);
app.post("/api/candidates/:id/document-status", handleStatusUpdate);

// Serve uploaded files static route
app.use("/uploads", express.static(UPLOADS_DIR));

// 3. DEADLINES
app.get("/api/deadlines", async (req, res) => {
  try {
    const rawDeadlines = await getDeadlines();
    res.json(updateDaysRemaining(rawDeadlines));
  } catch (error) {
    console.error("Error getting deadlines:", error);
    res.status(500).json({ error: "Erro ao carregar prazos." });
  }
});

app.post("/api/deadlines", async (req, res) => {
  const deadline = req.body;
  if (!deadline.id) {
    deadline.id = "dl-" + Date.now();
  }
  
  try {
    await saveDeadline(deadline);
    res.json({ success: true, deadline });
  } catch (error) {
    console.error("Error saving deadline:", error);
    res.status(500).json({ error: "Erro ao salvar prazo eleitoral." });
  }
});

// 4. AUTOMATED REPORTS (AI GENERATOR)
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await getReports();
    res.json(reports);
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({ error: "Erro ao carregar relatórios." });
  }
});

app.post("/api/reports/generate", async (req, res) => {
  const { candidateId, type } = req.body;
  
  try {
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: "Candidato não encontrado" });
    }
    
    // Prepare status summaries for prompt
    const publications = candidate.publications || [];
    const approvedPubs = publications.filter((p: any) => p.status === "Aprovado" || p.status === "Postado").length;
    const totalPubs = publications.length;
    const pubPercentage = totalPubs > 0 ? Math.round((approvedPubs / totalPubs) * 100) : 0;
    
    // Mapping summary
    const filledMappings = (candidate.mappings || []).filter((m: any) => m.lideranca || m.meta2026 || m.situacao);
    const totalTargetVotes = (candidate.mappings || []).reduce((acc: number, cur: any) => acc + (parseInt(cur.meta2026) || 0), 0);
    const totalHistoricVotes = (candidate.mappings || []).reduce((acc: number, cur: any) => acc + (parseInt(cur.historicoVotos) || 0), 0);
    
    let prompt = `Aja como um analista político estrategista sênior da Federação PSDB-Cidadania em Santa Catarina.
    Gere um relatório estruturado focado no tipo: "${type}" para o candidato(a) abaixo:
    
    - Nome de Urna: ${candidate.urnName} (${candidate.party})
    - Número de Campanha: ${candidate.number}
    - Histórico de Atuação: ${candidate.professionalBackground}
    - Áreas de Interesse: ${candidate.areasOfInterest}
    - Bandeiras Políticas: ${candidate.politicalFlags}
    - Breve Trajetória: ${candidate.trajectory}
    
    --- Planejamento de Mídias e Agenda de Publicações ---
    - Status Geral da Campanha: ${candidate.status}
    - Publicações Aprovadas/Postadas: ${approvedPubs} de ${totalPubs} (${pubPercentage}% concluídos)
    - Conteúdos Pendentes de Produção/Envio: ${publications.filter((p: any) => p.status === "Rascunho" || p.status === "Em Produção" || p.status === "Rejeitado").map((p: any) => p.title).join(", ") || "Nenhum"}
    
    --- Planejamento Geográfico (Mapeamento de Cidades) ---
    - Cidades Mapeadas Ativas: ${filledMappings.length} cidades.
    - Histórico de Votação Anterior Somado nestas Cidades: ${totalHistoricVotes} votos.
    - Meta de Votação Geral Pactuada para 2026: ${totalTargetVotes} votos.
    - Detalhamento de Cidades Principais:
    ${filledMappings.map((m: any) => `  * Município: ${m.cityName} | Liderança Local: ${m.lideranca || "Não informada"} | Histórico: ${m.historicoVotos || "0"} | Meta 2026: ${m.meta2026 || "0"} | Situação Crucial: ${m.situacao || "Nenhuma registrada"}`).join("\n")}
    
    Por favor, escreva um relatório de 3 a 4 parágrafos bem densos, com tom formal, profissional, pragmático e estratégico. 
    Divida em seções com títulos curtos (ex: DIAGNÓSTICO DE MÍDIAS, ALINHAMENTO GEOGRÁFICO, DIRETRIZES DE COMUNICAÇÃO).
    
    Foque em como otimizar o cronograma de publicações para engajar as bases eleitorais nos municípios-chave, alinhar as bandeiras políticas com a linha editorial de comunicação, e onde a coordenação da Federação deve intervir ou apoiar o candidato para impulsionar sua imagem digital.`;

    let reportText = "";
    
    try {
      if (geminiAI) {
        const response = await geminiAI.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: "Você é o Coordenador Geral de Comunicação e Análise Estratégica da Federação PSDB-Cidadania. Escreva em português elegante do Brasil, voltado para decisões de imagem e comunicação partidária."
          }
        });
        reportText = response.text || "Erro ao obter resposta da inteligência artificial.";
      } else {
        // Fallback response if GEMINI_API_KEY is not configured
        reportText = `### PLANEJAMENTO ESTRATÉGICO DE MÍDIAS (${type.toUpperCase()})
        
        **Candidato(a):** ${candidate.urnName} | **Partido:** **${candidate.party}** | **Número:** ${candidate.number}
        
        #### 1. Diagnóstico do Cronograma de Comunicação Digital
        O candidato apresenta um índice de **${pubPercentage}%** de conformidade e engajamento em sua Agenda de Publicações, contando com ${approvedPubs} postagens validadas e postadas de um total de ${totalPubs} pautas programadas. Há necessidade de acelerar a produção de conteúdos voltados às propostas de ${candidate.areasOfInterest || "desenvolvimento estadual"} para suprir os eixos ainda classificados como pendentes ou em produção.
        
        #### 2. Articulação Geográfica e Campanha Multi-Plataforma
        Com base ativa em ${filledMappings.length} municípios mapeados de Santa Catarina e meta global pactuada de **${totalTargetVotes} votos**, a presença digital do candidato precisa ser calibrada de acordo com as especificidades regionais. Municípios do Oeste e Sul demandam postagens específicas valorizando parcerias locais e as bandeiras de atuação prática do candidato (${candidate.politicalFlags}).
        
        #### 3. Diretrizes de Comunicação e Suporte Partidário
        A coordenação estadual de mídias, sob liderança de ${candidate.mediaCoordinatorName || "equipe local de mídias"}, deve prover suporte para as campanhas de impulsionamento georreferenciado e assegurar que as postagens agendadas reflitam as diretrizes de mobilização da Federação. Sugere-se intensificar a produção de formatos interativos (Reels/Vídeos de rua) para humanizar a candidatura perante os eleitores catarinenses.`;
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      reportText = `Erro na geração de IA: ${error.message || error}. Por favor, verifique a chave GEMINI_API_KEY.`;
    }
    
    const newReport = {
      id: "rep-" + Date.now(),
      title: `Relatório ${type} - ${candidate.urnName}`,
      createdAt: new Date().toISOString(),
      content: reportText,
      author: "Analista Inteligência Federação",
      candidateId,
      candidateName: candidate.urnName,
      type
    };
    
    await saveReport(newReport);
    
    res.json({ success: true, report: newReport });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Erro ao gerar relatório." });
  }
});

// DATABASE STATUS AND INTEGRATION ENDPOINTS
// 1. GET /api/database/status
app.get("/api/database/status", async (req, res) => {
  try {
    const usingMySQL = mysqlPool !== null;
    let connected = false;
    let errorMessage = null;
    let host = process.env.DB_HOST || "Não configurado";
    let databaseName = process.env.DB_NAME || "Não configurado";
    let user = process.env.DB_USER || "Não configurado";

    if (mysqlPool) {
      try {
        const conn = await mysqlPool.getConnection();
        connected = true;
        conn.release();
      } catch (err: any) {
        errorMessage = err.message || String(err);
      }
    }

    // Get current counts from active database
    const candidates = await getCandidates();
    const rawDeadlines = await getDeadlines();
    const reports = await getReports();

    res.json({
      success: true,
      usingMySQL,
      connected,
      errorMessage,
      config: {
        host,
        databaseName,
        user,
      },
      stats: {
        candidatesCount: candidates.length,
        deadlinesCount: rawDeadlines.length,
        reportsCount: reports.length,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao obter status do banco." });
  }
});

// 2. GET /api/database/export-sql
app.get("/api/database/export-sql", async (req, res) => {
  try {
    const candidates = await getCandidates();
    const rawDeadlines = await getDeadlines();
    const reports = await getReports();

    let sql = `-- =======================================================\n`;
    sql += `-- BANCO DE DADOS ATUALIZADO: u844537895_candidatos\n`;
    sql += `-- Exportado em: ${new Date().toISOString()}\n`;
    sql += `-- Target Subdomain: candidatos.mastervisionmarketing.com\n`;
    sql += `-- =======================================================\n\n`;

    sql += `CREATE DATABASE IF NOT EXISTS \`u844537895_candidatos\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`u844537895_candidatos\`;\n\n`;

    // 1. Candidates table
    sql += `-- \n`;
    sql += `-- Estrutura para tabela \`candidates\`\n`;
    sql += `-- \n\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`candidates\` (\n`;
    sql += `  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,\n`;
    sql += `  \`name\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`number\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`urnName\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`whatsapp\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`instagram\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`facebook\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`email\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`party\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`status\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`photoUrl\` LONGTEXT DEFAULT NULL,\n`;
    sql += `  \`mediaCoordinatorName\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`mediaCoordinatorWhatsApp\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`professionalBackground\` TEXT DEFAULT NULL,\n`;
    sql += `  \`areasOfInterest\` TEXT DEFAULT NULL,\n`;
    sql += `  \`teams\` TEXT DEFAULT NULL,\n`;
    sql += `  \`family\` TEXT DEFAULT NULL,\n`;
    sql += `  \`groups\` TEXT DEFAULT NULL,\n`;
    sql += `  \`trajectory\` TEXT DEFAULT NULL,\n`;
    sql += `  \`politicalFlags\` TEXT DEFAULT NULL,\n`;
    sql += `  \`keyContacts\` LONGTEXT DEFAULT NULL,\n`;
    sql += `  \`publications\` LONGTEXT DEFAULT NULL,\n`;
    sql += `  \`mappings\` LONGTEXT DEFAULT NULL,\n`;
    sql += `  \`lastSaved\` VARCHAR(100) DEFAULT NULL\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    sql += `-- Despejando dados para a tabela \`candidates\`\n\n`;
    for (const cand of candidates) {
      const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        str = str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `'${str}'`;
      };

      sql += `INSERT INTO \`candidates\` (\n`;
      sql += `  \`id\`, \`name\`, \`number\`, \`urnName\`, \`whatsapp\`, \`instagram\`, \`facebook\`, \`email\`, \`party\`, \`status\`, \`photoUrl\`,\n`;
      sql += `  \`mediaCoordinatorName\`, \`mediaCoordinatorWhatsApp\`, \`professionalBackground\`, \`areasOfInterest\`,\n`;
      sql += `  \`teams\`, \`family\`, \`groups\`, \`trajectory\`, \`politicalFlags\`, \`keyContacts\`, \`publications\`, \`mappings\`, \`lastSaved\`\n`;
      sql += `) VALUES (\n`;
      sql += `  ${escape(cand.id)}, ${escape(cand.name)}, ${escape(cand.number)}, ${escape(cand.urnName)}, ${escape(cand.whatsapp)}, ${escape(cand.instagram)}, ${escape(cand.facebook)}, ${escape(cand.email)}, ${escape(cand.party)}, ${escape(cand.status)}, ${escape(cand.photoUrl)},\n`;
      sql += `  ${escape(cand.mediaCoordinatorName)}, ${escape(cand.mediaCoordinatorWhatsApp)}, ${escape(cand.professionalBackground)}, ${escape(cand.areasOfInterest)},\n`;
      sql += `  ${escape(cand.teams)}, ${escape(cand.family)}, ${escape(cand.groups)}, ${escape(cand.trajectory)}, ${escape(cand.politicalFlags)}, ${escape(cand.keyContacts)}, ${escape(cand.publications)}, ${escape(cand.mappings)}, ${escape(cand.lastSaved)}\n`;
      sql += `) ON DUPLICATE KEY UPDATE\n`;
      sql += `  \`name\` = VALUES(\`name\`), \`number\` = VALUES(\`number\`), \`urnName\` = VALUES(\`urnName\`), \`whatsapp\` = VALUES(\`whatsapp\`), \`instagram\` = VALUES(\`instagram\`), \`facebook\` = VALUES(\`facebook\`), \`email\` = VALUES(\`email\`), \`party\` = VALUES(\`party\`), \`status\` = VALUES(\`status\`), \`photoUrl\` = VALUES(\`photoUrl\`), \`mediaCoordinatorName\` = VALUES(\`mediaCoordinatorName\`), \`mediaCoordinatorWhatsApp\` = VALUES(\`mediaCoordinatorWhatsApp\`), \`professionalBackground\` = VALUES(\`professionalBackground\`), \`areasOfInterest\` = VALUES(\`areasOfInterest\`), \`teams\` = VALUES(\`teams\`), \`family\` = VALUES(\`family\`), \`groups\` = VALUES(\`groups\`), \`trajectory\` = VALUES(\`trajectory\`), \`politicalFlags\` = VALUES(\`politicalFlags\`), \`keyContacts\` = VALUES(\`keyContacts\`), \`publications\` = VALUES(\`publications\`), \`mappings\` = VALUES(\`mappings\`), \`lastSaved\` = VALUES(\`lastSaved\`);\n\n`;
    }

    // 2. Deadlines table
    sql += `-- \n`;
    sql += `-- Estrutura para tabela \`deadlines\`\n`;
    sql += `-- \n\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`deadlines\` (\n`;
    sql += `  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,\n`;
    sql += `  \`title\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`date\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`description\` TEXT DEFAULT NULL,\n`;
    sql += `  \`daysRemaining\` INT DEFAULT NULL,\n`;
    sql += `  \`status\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`category\` VARCHAR(50) DEFAULT NULL\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    sql += `-- Despejando dados para a tabela \`deadlines\`\n\n`;
    for (const dl of rawDeadlines) {
      const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        let str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `'${str}'`;
      };
      sql += `INSERT INTO \`deadlines\` (\`id\`, \`title\`, \`date\`, \`description\`, \`daysRemaining\`, \`status\`, \`category\`)\n`;
      sql += `VALUES (${escape(dl.id)}, ${escape(dl.title)}, ${escape(dl.date)}, ${escape(dl.description)}, ${dl.daysRemaining || 0}, ${escape(dl.status)}, ${escape(dl.category)})\n`;
      sql += `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`date\` = VALUES(\`date\`), \`description\` = VALUES(\`description\`), \`daysRemaining\` = VALUES(\`daysRemaining\`), \`status\` = VALUES(\`status\`), \`category\` = VALUES(\`category\`);\n\n`;
    }

    // 3. Reports table
    sql += `-- \n`;
    sql += `-- Estrutura para tabela \`reports\`\n`;
    sql += `-- \n\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`reports\` (\n`;
    sql += `  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,\n`;
    sql += `  \`title\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`createdAt\` VARCHAR(100) DEFAULT NULL,\n`;
    sql += `  \`content\` TEXT DEFAULT NULL,\n`;
    sql += `  \`author\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`candidateId\` VARCHAR(50) DEFAULT NULL,\n`;
    sql += `  \`candidateName\` VARCHAR(255) DEFAULT NULL,\n`;
    sql += `  \`type\` VARCHAR(50) DEFAULT NULL\n`;
    sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    sql += `-- Despejando dados para a tabela \`reports\`\n\n`;
    for (const rep of reports) {
      const escape = (val: any) => {
        if (val === null || val === undefined) return 'NULL';
        let str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `'${str}'`;
      };
      sql += `INSERT INTO \`reports\` (\`id\`, \`title\`, \`createdAt\`, \`content\`, \`author\`, \`candidateId\`, \`candidateName\`, \`type\`)\n`;
      sql += `VALUES (${escape(rep.id)}, ${escape(rep.title)}, ${escape(rep.createdAt)}, ${escape(rep.content)}, ${escape(rep.author)}, ${escape(rep.candidateId)}, ${escape(rep.candidateName)}, ${escape(rep.type)})\n`;
      sql += `ON DUPLICATE KEY UPDATE \`title\` = VALUES(\`title\`), \`createdAt\` = VALUES(\`createdAt\`), \`content\` = VALUES(\`content\`), \`author\` = VALUES(\`author\`), \`candidateId\` = VALUES(\`candidateId\`), \`candidateName\` = VALUES(\`candidateName\`), \`type\` = VALUES(\`type\`);\n\n`;
    }

    // Also write this updated sql string to workspace root `database.sql`
    try {
      fs.writeFileSync(path.join(process.cwd(), "database.sql"), sql, "utf8");
      console.log("Updated database.sql file in workspace root with latest data.");
    } catch (fsErr) {
      console.error("Failed to write updated database.sql to disk:", fsErr);
    }

    res.setHeader("Content-Disposition", "attachment; filename=database.sql");
    res.setHeader("Content-Type", "application/sql");
    res.send(sql);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao exportar SQL." });
  }
});

// 3. POST /api/database/sync
app.post("/api/database/sync", async (req, res) => {
  const { host, user, password, database, port } = req.body;
  
  let targetPool: mysql.Pool | null = null;
  let isCustom = false;
  
  try {
    if (host && user && password && database) {
      console.log("Using custom submitted MySQL credentials for synchronization...");
      isCustom = true;
      targetPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port: parseInt(port || "3306", 10),
        waitForConnections: true,
        connectionLimit: 3,
        queueLimit: 0,
        charset: "utf8mb4"
      });
    } else if (mysqlPool) {
      console.log("Using system-configured MySQL pool for synchronization...");
      targetPool = mysqlPool;
    } else {
      return res.status(400).json({ error: "Credenciais de MySQL não configuradas e nenhum parâmetro fornecido." });
    }
    
    // Test connection
    const conn = await targetPool.getConnection();
    console.log("Sync Target Connected successfully!");
    
    // Verify / create tables on target
    await conn.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        number VARCHAR(50),
        urnName VARCHAR(255),
        whatsapp VARCHAR(50),
        instagram VARCHAR(255),
        facebook VARCHAR(255),
        email VARCHAR(255),
        party VARCHAR(50),
        status VARCHAR(50),
        photoUrl LONGTEXT,
        mediaCoordinatorName VARCHAR(255),
        mediaCoordinatorWhatsApp VARCHAR(50),
        professionalBackground TEXT,
        areasOfInterest TEXT,
        teams TEXT,
        family TEXT,
        groups TEXT,
        trajectory TEXT,
        politicalFlags TEXT,
        keyContacts LONGTEXT,
        publications LONGTEXT,
        mappings LONGTEXT,
        lastSaved VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS deadlines (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255),
        date VARCHAR(50),
        description TEXT,
        daysRemaining INT,
        status VARCHAR(50),
        category VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255),
        createdAt VARCHAR(100),
        content TEXT,
        author VARCHAR(255),
        candidateId VARCHAR(50),
        candidateName VARCHAR(255),
        type VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Fetch current source data
    const candidates = await getCandidates();
    const rawDeadlines = await getDeadlines();
    const reports = await getReports();

    // Synchronize Candidates
    for (const cand of candidates) {
      await conn.query(`
        INSERT INTO candidates (
          id, name, number, urnName, whatsapp, instagram, facebook, email, party, status, photoUrl,
          mediaCoordinatorName, mediaCoordinatorWhatsApp, professionalBackground, areasOfInterest,
          teams, family, groups, trajectory, politicalFlags, keyContacts, publications, mappings, lastSaved
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name), number = VALUES(number), urnName = VALUES(urnName), whatsapp = VALUES(whatsapp),
          instagram = VALUES(instagram), facebook = VALUES(facebook), email = VALUES(email), party = VALUES(party),
          status = VALUES(status), photoUrl = VALUES(photoUrl), mediaCoordinatorName = VALUES(mediaCoordinatorName),
          mediaCoordinatorWhatsApp = VALUES(mediaCoordinatorWhatsApp), professionalBackground = VALUES(professionalBackground),
          areasOfInterest = VALUES(areasOfInterest), teams = VALUES(teams), family = VALUES(family), groups = VALUES(groups),
          trajectory = VALUES(trajectory), politicalFlags = VALUES(politicalFlags), keyContacts = VALUES(keyContacts),
          publications = VALUES(publications), mappings = VALUES(mappings), lastSaved = VALUES(lastSaved)
      `, [
        cand.id, cand.name || "", cand.number || "", cand.urnName || "", cand.whatsapp || "",
        cand.instagram || "", cand.facebook || "", cand.email || "", cand.party || "", cand.status || "",
        cand.photoUrl || "", cand.mediaCoordinatorName || "", cand.mediaCoordinatorWhatsApp || "",
        cand.professionalBackground || "", cand.areasOfInterest || "", cand.teams || "", cand.family || "",
        cand.groups || "", cand.trajectory || "", cand.politicalFlags || "",
        JSON.stringify(cand.keyContacts || []), JSON.stringify(cand.publications || []), JSON.stringify(cand.mappings || []),
        cand.lastSaved || new Date().toISOString()
      ]);
    }

    // Synchronize Deadlines
    for (const dl of rawDeadlines) {
      await conn.query(`
        INSERT INTO deadlines (id, title, date, description, daysRemaining, status, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title), date = VALUES(date), description = VALUES(description),
          daysRemaining = VALUES(daysRemaining), status = VALUES(status), category = VALUES(category)
      `, [
        dl.id, dl.title, dl.date, dl.description, dl.daysRemaining || 0, dl.status, dl.category
      ]);
    }

    // Synchronize Reports
    for (const rep of reports) {
      await conn.query(`
        INSERT INTO reports (id, title, createdAt, content, author, candidateId, candidateName, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title), createdAt = VALUES(createdAt), content = VALUES(content),
          author = VALUES(author), candidateId = VALUES(candidateId), candidateName = VALUES(candidateName),
          type = VALUES(type)
      `, [
        rep.id, rep.title, rep.createdAt, rep.content, rep.author, rep.candidateId, rep.candidateName, rep.type
      ]);
    }

    conn.release();

    if (isCustom && targetPool) {
      // Close custom temporary pool
      await targetPool.end();
    }

    res.json({
      success: true,
      message: `Sincronização concluída com sucesso! Sincronizados: ${candidates.length} candidatos, ${rawDeadlines.length} prazos e ${reports.length} relatórios.`,
    });

  } catch (err: any) {
    console.error("Sync error:", err);
    if (isCustom && targetPool) {
      try { await targetPool.end(); } catch (e) {}
    }
    res.status(500).json({
      error: `Falha na sincronização direta: ${err.message || String(err)}. Certifique-se de que o host do banco de dados permite conexões remotas do IP do servidor da aplicação.`
    });
  }
});

function splitSqlStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let currentStatement = "";
  let inString = false;
  let stringChar = "";
  let inComment = false;
  let inLineComment = false;

  for (let i = 0; i < sqlText.length; i++) {
    const char = sqlText[i];
    const nextChar = sqlText[i + 1] || "";

    if (!inString && !inComment && ((char === '-' && nextChar === '-') || char === '#')) {
      inLineComment = true;
      if (char === '-') i++;
      continue;
    }
    if (inLineComment && (char === '\n' || char === '\r')) {
      inLineComment = false;
      continue;
    }
    if (inLineComment) {
      continue;
    }

    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inComment = true;
      i++;
      continue;
    }
    if (inComment && char === '*' && nextChar === '/') {
      inComment = false;
      i++;
      continue;
    }
    if (inComment) {
      continue;
    }

    if ((char === "'" || char === '"' || char === '`') && sqlText[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (stringChar === char) {
        inString = false;
      }
    }

    currentStatement += char;

    if (char === ';' && !inString) {
      const trimmed = currentStatement.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      currentStatement = "";
    }
  }

  const trimmed = currentStatement.trim();
  if (trimmed) {
    statements.push(trimmed);
  }

  return statements;
}

// 4. POST /api/database/import-sql
app.post("/api/database/import-sql", async (req, res) => {
  const { sql, host, port, database, user, password } = req.body;

  if (!sql) {
    return res.status(400).json({ success: false, error: "Nenhum comando SQL fornecido." });
  }

  let importPool: mysql.Pool | null = null;
  try {
    importPool = mysql.createPool({
      host: host || "localhost",
      port: parseInt(port || "3306", 10),
      database: database || "u844537895_candidatos",
      user: user || "u844537895_candidatos",
      password: password || "Shift2026",
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      multipleStatements: true
    });

    const conn = await importPool.getConnection();
    const statements = splitSqlStatements(sql);
    let executed = 0;
    let failed = 0;
    const errors: string[] = [];

    await conn.query("SET FOREIGN_KEY_CHECKS=0");

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed) continue;
      try {
        await conn.query(trimmed);
        executed++;
      } catch (err: any) {
        failed++;
        errors.push(`Erro no comando [${trimmed.substring(0, 80)}...]: ${err.message}`);
      }
    }

    await conn.query("SET FOREIGN_KEY_CHECKS=1");
    conn.release();

    if (failed === 0) {
      res.json({
        success: true,
        message: `Importação do SQL concluída com sucesso! Foram executadas ${executed} instruções com êxito e 0 falhas no banco de dados.`
      });
    } else {
      res.json({
        success: true,
        message: `Importação concluída parcialmente. Executados com sucesso: ${executed}. Falhas: ${failed}.`,
        warnings: errors.slice(0, 5)
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: `Falha ao tentar conectar ou importar SQL: ${error.message || error}`
    });
  } finally {
    if (importPool) {
      try {
        await importPool.end();
      } catch (e) {}
    }
  }
});

// Build / Hot Module Replacement & SPA Static setup
async function startServer() {
  // Initialize MySQL or seed Firestore if empty
  if (mysqlPool) {
    await initMySQLIfNeeded();
  } else {
    await seedFirestoreIfNeeded();
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.PORT) {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port/socket ${process.env.PORT}`);
    });
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();
