import { Candidate, CityMapping } from "../types";
import { SANTA_CATARINA_REGIONS } from "../data/regionsData";

export interface ParsedCityRegionalData {
  cityName?: string;
  historicoVotos?: string;
  bom?: string;
  ideal?: string;
  otimo?: string;
}

// Complete pre-extracted dataset from Deputado Marcos Vieira's Regional Mapping PDF (Santa Catarina)
export const MARCOS_VIEIRA_PDF_DATA: Record<string, ParsedCityRegionalData> = {
  // DIONÍSIO CERQUEIRA
  "Anchieta": { historicoVotos: "269", bom: "300", ideal: "350", otimo: "400" },
  "Dionísio Cerqueira": { historicoVotos: "198", bom: "250", ideal: "300", otimo: "350" },
  "Guarujá do Sul": { historicoVotos: "109", bom: "100", ideal: "150", otimo: "200" },
  "Palma Sola": { historicoVotos: "61", bom: "150", ideal: "200", otimo: "250" },
  "Princesa": { historicoVotos: "83", bom: "150", ideal: "200", otimo: "250" },
  "São José do Cedro": { historicoVotos: "117", bom: "100", ideal: "200", otimo: "250" },

  // SÃO MIGUEL DO OESTE
  "Bandeirante": { historicoVotos: "59", bom: "50", ideal: "100", otimo: "150" },
  "Barra Bonita": { historicoVotos: "45", bom: "50", ideal: "100", otimo: "150" },
  "Belmonte": { historicoVotos: "205", bom: "200", ideal: "250", otimo: "300" },
  "Descanso": { historicoVotos: "277", bom: "150", ideal: "200", otimo: "250" },
  "Guaraciaba": { historicoVotos: "170", bom: "50", ideal: "100", otimo: "150" },
  "Paraíso": { historicoVotos: "15", bom: "50", ideal: "100", otimo: "150" },
  "São Miguel do Oeste": { historicoVotos: "228", bom: "300", ideal: "350", otimo: "400" },

  // ITAPIRANGA
  "Iporã do Oeste": { historicoVotos: "393", bom: "700", ideal: "1000", otimo: "1200" },
  "Itapiranga": { historicoVotos: "123", bom: "50", ideal: "100", otimo: "150" },
  "Santa Helena": { historicoVotos: "53", bom: "100", ideal: "150", otimo: "200" },
  "São João do Oeste": { historicoVotos: "164", bom: "200", ideal: "250", otimo: "300" },
  "Tunápolis": { historicoVotos: "71", bom: "50", ideal: "100", otimo: "150" },

  // PALMITOS
  "Águas de Chapecó": { historicoVotos: "340", bom: "50", ideal: "100", otimo: "150" },
  "Caibi": { historicoVotos: "216", bom: "150", ideal: "200", otimo: "250" },
  "Cunhataí": { historicoVotos: "22", bom: "50", ideal: "100", otimo: "150" },
  "Mondaí": { historicoVotos: "438", bom: "100", ideal: "150", otimo: "200" },
  "Palmitos": { historicoVotos: "139", bom: "50", ideal: "100", otimo: "150" },
  "Riqueza": { historicoVotos: "47", bom: "50", ideal: "100", otimo: "150" },
  "São Carlos": { historicoVotos: "118", bom: "100", ideal: "150", otimo: "200" },

  // MARAVILHA
  "Bom Jesus do Oeste": { historicoVotos: "138", bom: "100", ideal: "150", otimo: "200" },
  "Cunha Porã": { historicoVotos: "845", bom: "800", ideal: "1000", otimo: "1200" },
  "Flor do Sertão": { historicoVotos: "88", bom: "50", ideal: "100", otimo: "150" },
  "Iraceminha": { historicoVotos: "104", bom: "50", ideal: "100", otimo: "150" },
  "Maravilha": { historicoVotos: "1703", bom: "2500", ideal: "3000", otimo: "3500" },
  "Romelândia": { historicoVotos: "1130", bom: "1000", ideal: "1200", otimo: "1500" },
  "Santa Terezinha do Progresso": { historicoVotos: "91", bom: "100", ideal: "150", otimo: "200" },
  "São Miguel da Boa Vista": { historicoVotos: "219", bom: "100", ideal: "150", otimo: "200" },
  "Tigrinhos": { historicoVotos: "109", bom: "100", ideal: "150", otimo: "200" },

  // PINHALZINHO
  "Águas Frias": { historicoVotos: "132", bom: "100", ideal: "150", otimo: "200" },
  "Modelo": { historicoVotos: "227", bom: "200", ideal: "250", otimo: "300" },
  "Nova Erechim": { historicoVotos: "49", bom: "100", ideal: "150", otimo: "200" },
  "Pinhalzinho": { historicoVotos: "206", bom: "500", ideal: "800", otimo: "1000" },
  "Saltinho": { historicoVotos: "244", bom: "150", ideal: "200", otimo: "250" },
  "Saudades": { historicoVotos: "591", bom: "500", ideal: "700", otimo: "1000" },
  "Serra Alta": { historicoVotos: "348", bom: "250", ideal: "300", otimo: "350" },
  "Sul Brasil": { historicoVotos: "265", bom: "250", ideal: "300", otimo: "350" },

  // SÃO LOURENÇO DO OESTE
  "Campo Erê": { historicoVotos: "167", bom: "200", ideal: "300", otimo: "350" },
  "Coronel Martins": { historicoVotos: "46", bom: "50", ideal: "100", otimo: "150" },
  "Galvão": { historicoVotos: "30", bom: "50", ideal: "100", otimo: "150" },
  "Jupiá": { historicoVotos: "55", bom: "50", ideal: "100", otimo: "150" },
  "Novo Horizonte": { historicoVotos: "227", bom: "150", ideal: "200", otimo: "250" },
  "São Bernardino": { historicoVotos: "316", bom: "250", ideal: "300", otimo: "350" },
  "São Lourenço do Oeste": { historicoVotos: "181", bom: "150", ideal: "200", otimo: "250" },

  // QUILOMBO
  "Formosa do Sul": { historicoVotos: "32", bom: "30", ideal: "50", otimo: "100" },
  "Irati": { historicoVotos: "140", bom: "50", ideal: "100", otimo: "150" },
  "Jardinópolis": { historicoVotos: "23", bom: "50", ideal: "100", otimo: "150" },
  "Quilombo": { historicoVotos: "25", bom: "50", ideal: "100", otimo: "150" },
  "Santiago do Sul": { historicoVotos: "98", bom: "50", ideal: "100", otimo: "150" },
  "União do Oeste": { historicoVotos: "88", bom: "30", ideal: "50", otimo: "100" },

  // CHAPECÓ
  "Caxambu do Sul": { historicoVotos: "24", bom: "30", ideal: "50", otimo: "100" },
  "Chapecó": { historicoVotos: "399", bom: "250", ideal: "300", otimo: "350" },
  "Coronel Freitas": { historicoVotos: "14", bom: "30", ideal: "50", otimo: "100" },
  "Guatambu": { historicoVotos: "245", bom: "200", ideal: "250", otimo: "300" },
  "Nova Itaberaba": { historicoVotos: "94", bom: "50", ideal: "100", otimo: "150" },
  "Planalto Alegre": { historicoVotos: "5", bom: "30", ideal: "50", otimo: "100" },

  // XAXIM
  "Cordilheira Alta": { historicoVotos: "24", bom: "30", ideal: "50", otimo: "100" },
  "Entre Rios": { historicoVotos: "485", bom: "350", ideal: "400", otimo: "450" },
  "Lajeado Grande": { historicoVotos: "38", bom: "50", ideal: "100", otimo: "150" },
  "Marema": { historicoVotos: "55", bom: "50", ideal: "100", otimo: "150" },
  "Xaxim": { historicoVotos: "213", bom: "200", ideal: "300", otimo: "400" },

  // XANXERÊ
  "Abelardo Luz": { historicoVotos: "399", bom: "500", ideal: "800", otimo: "1000" },
  "Bom Jesus": { historicoVotos: "11", bom: "30", ideal: "50", otimo: "100" },
  "Faxinal dos Guedes": { historicoVotos: "285", bom: "150", ideal: "200", otimo: "250" },
  "Ipuaçu": { historicoVotos: "94", bom: "100", ideal: "150", otimo: "200" },
  "Ouro Verde": { historicoVotos: "105", bom: "100", ideal: "150", otimo: "200" },
  "Passos Maia": { historicoVotos: "111", bom: "50", ideal: "70", otimo: "100" },
  "Ponte Serrada": { historicoVotos: "1013", bom: "1000", ideal: "1200", otimo: "1500" },
  "São Domingos": { historicoVotos: "21", bom: "300", ideal: "350", otimo: "400" },
  "Vargeão": { historicoVotos: "132", bom: "100", ideal: "150", otimo: "200" },
  "Xanxerê": { historicoVotos: "989", bom: "900", ideal: "1200", otimo: "1500" },

  // SEARA
  "Arabutã": { historicoVotos: "233", bom: "300", ideal: "350", otimo: "400" },
  "Arvoredo": { historicoVotos: "107", bom: "100", ideal: "150", otimo: "200" },
  "Ipumirim": { historicoVotos: "209", bom: "150", ideal: "200", otimo: "250" },
  "Itá": { historicoVotos: "198", bom: "150", ideal: "200", otimo: "250" },
  "Lindóia do Sul": { historicoVotos: "49", bom: "100", ideal: "150", otimo: "200" },
  "Paial": { historicoVotos: "147", bom: "100", ideal: "150", otimo: "200" },
  "Seara": { historicoVotos: "323", bom: "300", ideal: "500", otimo: "700" },
  "Xavantina": { historicoVotos: "117", bom: "50", ideal: "100", otimo: "150" },

  // CONCÓRDIA
  "Alto Bela Vista": { historicoVotos: "55", bom: "50", ideal: "70", otimo: "100" },
  "Concórdia": { historicoVotos: "1802", bom: "500", ideal: "700", otimo: "1000" },
  "Irani": { historicoVotos: "561", bom: "500", ideal: "700", otimo: "1000" },
  "Jaborá": { historicoVotos: "217", bom: "100", ideal: "150", otimo: "200" },
  "Peritiba": { historicoVotos: "106", bom: "100", ideal: "150", otimo: "200" },
  "Presidente Castello Branco": { historicoVotos: "264", bom: "150", ideal: "200", otimo: "250" },

  // JOAÇABA
  "Água Doce": { historicoVotos: "63", bom: "350", ideal: "400", otimo: "450" },
  "Catanduvas": { historicoVotos: "299", bom: "200", ideal: "250", otimo: "300" },
  "Erval Velho": { historicoVotos: "57", bom: "50", ideal: "100", otimo: "150" },
  "Herval d'Oeste": { historicoVotos: "580", bom: "800", ideal: "1000", otimo: "1200" },
  "Ibicaré": { historicoVotos: "93", bom: "200", ideal: "250", otimo: "300" },
  "Joaçaba": { historicoVotos: "405", bom: "500", ideal: "700", otimo: "1000" },
  "Luzerna": { historicoVotos: "34", bom: "30", ideal: "100", otimo: "150" },
  "Treze Tílias": { historicoVotos: "12", bom: "50", ideal: "100", otimo: "150" },
  "Vargem Bonita": { historicoVotos: "379", bom: "300", ideal: "400", otimo: "500" },

  // CAPINZAL
  "Capinzal": { historicoVotos: "430", bom: "300", ideal: "400", otimo: "500" },
  "Ipira": { historicoVotos: "27", bom: "50", ideal: "100", otimo: "150" },
  "Lacerdópolis": { historicoVotos: "40", bom: "30", ideal: "50", otimo: "70" },
  "Ouro": { historicoVotos: "631", bom: "300", ideal: "350", otimo: "400" },
  "Piratuba": { historicoVotos: "200", bom: "100", ideal: "150", otimo: "200" },
  "Zortéa": { historicoVotos: "30", bom: "30", ideal: "50", otimo: "70" },

  // VIDEIRA
  "Arroio Trinta": { historicoVotos: "197", bom: "150", ideal: "200", otimo: "250" },
  "Fraiburgo": { historicoVotos: "62", bom: "30", ideal: "50", otimo: "70" },
  "Iomerê": { historicoVotos: "38", bom: "30", ideal: "50", otimo: "70" },
  "Pinheiro Preto": { historicoVotos: "48", bom: "50", ideal: "70", otimo: "100" },
  "Salto Veloso": { historicoVotos: "82", bom: "150", ideal: "200", otimo: "250" },
  "Tangará": { historicoVotos: "13", bom: "50", ideal: "100", otimo: "150" },
  "Videira": { historicoVotos: "57", bom: "30", ideal: "50", otimo: "70" },

  // CAÇADOR
  "Caçador": { historicoVotos: "25", bom: "150", ideal: "200", otimo: "250" },
  "Calmon": { historicoVotos: "4", bom: "30", ideal: "50", otimo: "70" },
  "Lebon Régis": { historicoVotos: "146", bom: "100", ideal: "150", otimo: "200" },
  "Macieira": { historicoVotos: "46", bom: "50", ideal: "100", otimo: "150" },
  "Matos Costa": { historicoVotos: "0", bom: "20", ideal: "30", otimo: "50" },
  "Rio das Antas": { historicoVotos: "1", bom: "50", ideal: "100", otimo: "150" },
  "Timbó Grande": { historicoVotos: "104", bom: "150", ideal: "200", otimo: "300" },

  // CURITIBANOS
  "Curitibanos": { historicoVotos: "115", bom: "150", ideal: "200", otimo: "250" },
  "Frei Rogério": { historicoVotos: "65", bom: "30", ideal: "50", otimo: "70" },
  "Ponte Alta do Norte": { historicoVotos: "172", bom: "150", ideal: "200", otimo: "300" },
  "Santa Cecília": { historicoVotos: "186", bom: "200", ideal: "200", otimo: "300" },
  "São Cristóvão do Sul": { historicoVotos: "476", bom: "250", ideal: "300", otimo: "400" },

  // ANITA GARIBALDI
  "Celso Ramos": { historicoVotos: "204", bom: "200", ideal: "250", otimo: "300" },

  // LAGES
  "Ponte Alta": { historicoVotos: "198", bom: "200", ideal: "250", otimo: "300" },

  // SÃO JOAQUIM
  "Bom Jardim da Serra": { historicoVotos: "224", bom: "150", ideal: "200", otimo: "250" },
  "Bom Retiro": { historicoVotos: "652", bom: "500", ideal: "700", otimo: "800" },
  "Rio Rufino": { historicoVotos: "199", bom: "150", ideal: "200", otimo: "300" },
  "Urubici": { historicoVotos: "256", bom: "150", ideal: "200", otimo: "250" },

  // ITUPORANGA
  "Alfredo Wagner": { historicoVotos: "585", bom: "400", ideal: "450", otimo: "500" },
  "Chapadão do Lageado": { historicoVotos: "50", bom: "50", ideal: "70", otimo: "100" },
  "Imbuia": { historicoVotos: "6", bom: "100", ideal: "150", otimo: "200" },
  "Ituporanga": { historicoVotos: "609", bom: "500", ideal: "700", otimo: "1000" },
  "Leoberto Leal": { historicoVotos: "132", bom: "100", ideal: "150", otimo: "200" },
  "Petrolândia": { historicoVotos: "17", bom: "20", ideal: "50", otimo: "70" },
  "Vidal Ramos": { historicoVotos: "13", bom: "50", ideal: "70", otimo: "100" },

  // TIMBÓ
  "Indaial": { historicoVotos: "240", bom: "200", ideal: "250", otimo: "300" },

  // BLUMENAU
  "Pomerode": { historicoVotos: "56", bom: "500", ideal: "700", otimo: "1000" },

  // CANOINHAS
  "Porto União": { historicoVotos: "293", bom: "250", ideal: "300", otimo: "350" },

  // SOMBRIO
  "Passo de Torres": { historicoVotos: "220", bom: "500", ideal: "700", otimo: "1000" },

  // TUBARÃO
  "Capivari de Baixo": { historicoVotos: "135", bom: "150", ideal: "200", otimo: "250" },
  "Tubarão": { historicoVotos: "210", bom: "200", ideal: "250", otimo: "300" },

  // LAGUNA
  "Imaruí": { historicoVotos: "88", bom: "250", ideal: "300", otimo: "350" },
  "Laguna": { historicoVotos: "765", bom: "500", ideal: "700", otimo: "1000" },
  "Pescaria Brava": { historicoVotos: "14", bom: "100", ideal: "150", otimo: "200" },

  // SANTO AMARO
  "Águas Mornas": { historicoVotos: "382", bom: "350", ideal: "400", otimo: "500" },
  "Rancho Queimado": { historicoVotos: "68", bom: "250", ideal: "500", otimo: "700" },
  "Santo Amaro da Imperatriz": { historicoVotos: "1596", bom: "1000", ideal: "1200", otimo: "1500" },

  // FLORIANÓPOLIS
  "Antônio Carlos": { historicoVotos: "471", bom: "300", ideal: "350", otimo: "400" },
  "Biguaçu": { historicoVotos: "261", bom: "300", ideal: "350", otimo: "400" },
  "Florianópolis": { historicoVotos: "2273", bom: "3500", ideal: "4000", otimo: "4500" },
  "Governador Celso Ramos": { historicoVotos: "151", bom: "", ideal: "", otimo: "700" },
  "Palhoça": { historicoVotos: "376", bom: "500", ideal: "600", otimo: "700" },
  "São José": { historicoVotos: "939", bom: "500", ideal: "600", otimo: "600" }
};

/**
  Normalizes city names for comparison (strips accents, lowercases, handles common abbreviations)
 */
export function normalizeCityKey(name: string): string {
  if (!name) return "";
  let norm = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  norm = norm.replace(/\bsta\.?\b/g, "santa");
  norm = norm.replace(/\bsto\.?\b/g, "santo");
  norm = norm.replace(/\bs\.?\b/g, "sao");
  norm = norm.replace(/\bpr\.?\b/g, "presidente");
  norm = norm.replace(/\balt\.?\b/g, "alto");
  norm = norm.replace(/\bbaln\.?\b/g, "balneario");
  norm = norm.replace(/\bfco\.?\b/g, "francisco");
  return norm;
}

/**
 * Apply a data map of municipal mapping records to a candidate's mappings list following rule:
 * - Meta 2026 = Ideal value
 * - Bom = Bom value
 * - Ideal = Ideal value
 * - Ótimo = Ótimo value
 */
export function applyMappingDataToCandidate(
  candidate: Candidate,
  parsedMap: Record<string, ParsedCityRegionalData>
): { candidate: Candidate; updatedCount: number } {
  // Build lookup index from normalized city key to data
  const normalizedMap: Record<string, ParsedCityRegionalData> = {};
  Object.entries(parsedMap).forEach(([cityName, data]) => {
    normalizedMap[normalizeCityKey(cityName)] = data;
  });

  let updatedCount = 0;

  // Build full list of all SC cities from SANTA_CATARINA_REGIONS to ensure no city is missing
  const allScCities: { name: string; region: string }[] = [];
  SANTA_CATARINA_REGIONS.forEach(reg => {
    reg.cities.forEach(city => {
      allScCities.push({ name: city.name, region: reg.region });
    });
  });

  const existingMappings = candidate.mappings || [];
  const updatedMappings: CityMapping[] = allScCities.map((scCity, idx) => {
    const cityKey = normalizeCityKey(scCity.name);
    const incomingData = normalizedMap[cityKey];

    const existing = existingMappings.find(
      m => normalizeCityKey(m.cityName) === cityKey || m.cityId === `sc-${idx + 1}`
    ) || {
      cityId: `sc-${idx + 1}`,
      cityName: scCity.name,
      region: scCity.region,
      lideranca: "",
      historicoVotos: "",
      meta2026: "",
      situacao: "",
      atuacao: false
    };

    if (incomingData) {
      updatedCount++;
      const bomVal = incomingData.bom !== undefined ? incomingData.bom : (existing.perspectivaBom || "");
      const idealVal = incomingData.ideal !== undefined ? incomingData.ideal : (existing.perspectivaIdeal || "");
      const otimoVal = incomingData.otimo !== undefined ? incomingData.otimo : (existing.perspectivaOtimo || "");
      const histVal = incomingData.historicoVotos !== undefined ? incomingData.historicoVotos : (existing.historicoVotos || "");

      // Rule: Meta 2026 is filled with "Ideal" value
      const metaVal = idealVal || existing.meta2026 || "";

      const parseNum = (v: any) => {
        if (!v) return 0;
        const cleaned = String(v).replace(/\D/g, "");
        return parseInt(cleaned, 10) || 0;
      };

      const hasActivity = !!(
        parseNum(idealVal) > 0 ||
        parseNum(bomVal) > 0 ||
        parseNum(otimoVal) > 0 ||
        parseNum(histVal) > 0 ||
        parseNum(metaVal) > 0
      );

      return {
        ...existing,
        cityName: scCity.name,
        region: scCity.region,
        historicoVotos: histVal,
        perspectivaBom: bomVal,
        perspectivaIdeal: idealVal,
        perspectivaOtimo: otimoVal,
        meta2026: metaVal, // RULE: Meta 2026 filled with "Ideal"
        atuacao: hasActivity ? true : existing.atuacao
      };
    }

    return existing;
  });

  return {
    candidate: {
      ...candidate,
      mappings: updatedMappings,
      lastSaved: new Date().toISOString()
    },
    updatedCount
  };
}

/**
 * Parses raw text extracted from a PDF or pasted into text area to identify SC cities and values
 */
export function parseRegionalTextData(text: string): Record<string, ParsedCityRegionalData> {
  const result: Record<string, ParsedCityRegionalData> = {};
  if (!text) return result;

  const lines = text.split("\n");

  // Create list of all SC city names for matching
  const allCitiesList: string[] = [];
  SANTA_CATARINA_REGIONS.forEach(reg => {
    reg.cities.forEach(c => allCitiesList.push(c.name));
  });

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Find if any city name is in this line
    for (const city of allCitiesList) {
      const cityNorm = normalizeCityKey(city);
      const lineNorm = normalizeCityKey(trimmed);

      if (lineNorm.includes(cityNorm)) {
        // Extract numbers from the line
        const numbers = trimmed.match(/\b\d+[\d.,]*\b/g);
        if (numbers && numbers.length >= 3) {
          // Typically the last 3 numbers in rows with perspective are [Bom, Ideal, Ótimo]
          const cleanNumbers = numbers.map(n => n.replace(/\./g, "").replace(",", "."));
          
          let bom = "";
          let ideal = "";
          let otimo = "";
          let hist = "";

          if (cleanNumbers.length >= 4) {
            hist = Math.round(parseFloat(cleanNumbers[cleanNumbers.length - 4])).toString();
            bom = Math.round(parseFloat(cleanNumbers[cleanNumbers.length - 3])).toString();
            ideal = Math.round(parseFloat(cleanNumbers[cleanNumbers.length - 2])).toString();
            otimo = Math.round(parseFloat(cleanNumbers[cleanNumbers.length - 1])).toString();
          } else if (cleanNumbers.length === 3) {
            bom = Math.round(parseFloat(cleanNumbers[0])).toString();
            ideal = Math.round(parseFloat(cleanNumbers[1])).toString();
            otimo = Math.round(parseFloat(cleanNumbers[2])).toString();
          }

          result[city] = {
            cityName: city,
            historicoVotos: hist,
            bom,
            ideal,
            otimo
          };
        }
        break;
      }
    }
  });

  return result;
}

/**
 * Reads a PDF file using pdfjs-dist and extracts its text
 */
export async function readTextFromPdfFile(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const version = pdfjsLib.version || "6.2.108";
  
  // Try setting workerSrc with matching version
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }

  const parsePdf = async () => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true
    });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  try {
    return await parsePdf();
  } catch (err) {
    console.warn("Primary worker failed, trying .min.js fallback worker...", err);
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`;
      return await parsePdf();
    } catch (fallbackErr1) {
      console.warn("Secondary worker failed, trying unpkg fallback...", fallbackErr1);
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
        return await parsePdf();
      } catch (fallbackErr2) {
        console.error("Failed to parse PDF with all worker setups:", fallbackErr2);
        throw fallbackErr2;
      }
    }
  }
}
