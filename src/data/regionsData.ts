export interface CityStats {
  name: string;
  habitantes: number;
  eleitores: number;
  filiados: number;
}

export interface RegionalData {
  region: string;
  cities: CityStats[];
}

export const SANTA_CATARINA_REGIONS: RegionalData[] = [
  {
    region: "DIONÍSIO CERQUEIRA",
    cities: [
      { name: "Anchieta", habitantes: 5984, eleitores: 5065, filiados: 144 },
      { name: "Dionísio Cerqueira", habitantes: 15294, eleitores: 12156, filiados: 154 },
      { name: "Guarujá do Sul", habitantes: 4899, eleitores: 4023, filiados: 52 },
      { name: "Palma Sola", habitantes: 7709, eleitores: 5263, filiados: 68 },
      { name: "Princesa", habitantes: 3054, eleitores: 2560, filiados: 60 },
      { name: "São José do Cedro", habitantes: 14491, eleitores: 10952, filiados: 72 }
    ]
  },
  {
    region: "SÃO MIGUEL DO OESTE",
    cities: [
      { name: "Bandeirante", habitantes: 3243, eleitores: 2915, filiados: 15 },
      { name: "Barra Bonita", habitantes: 1662, eleitores: 1801, filiados: 88 },
      { name: "Belmonte", habitantes: 2709, eleitores: 2398, filiados: 55 },
      { name: "Descanso", habitantes: 8660, eleitores: 7188, filiados: 84 },
      { name: "Guaraciaba", habitantes: 11040, eleitores: 8735, filiados: 85 },
      { name: "Paraíso", habitantes: 4376, eleitores: 3725, filiados: 85 },
      { name: "São Miguel do Oeste", habitantes: 46969, eleitores: 32001, filiados: 406 }
    ]
  },
  {
    region: "ITAPIRANGA",
    cities: [
      { name: "Iporã do Oeste", habitantes: 9672, eleitores: 7521, filiados: 31 },
      { name: "Itapiranga", habitantes: 17149, eleitores: 12368, filiados: 50 },
      { name: "Santa Helena", habitantes: 2473, eleitores: 2244, filiados: 75 },
      { name: "São João do Oeste", habitantes: 6446, eleitores: 5029, filiados: 94 },
      { name: "Tunápolis", habitantes: 5054, eleitores: 3974, filiados: 35 }
    ]
  },
  {
    region: "PALMITOS",
    cities: [
      { name: "Águas de Chapecó", habitantes: 6128, eleitores: 4757, filiados: 77 },
      { name: "Caibi", habitantes: 6431, eleitores: 5293, filiados: 80 },
      { name: "Cunhataí", habitantes: 2018, eleitores: 1854, filiados: 31 },
      { name: "Mondaí", habitantes: 10216, eleitores: 7344, filiados: 151 },
      { name: "Palmitos", habitantes: 15812, eleitores: 12293, filiados: 114 },
      { name: "Riqueza", habitantes: 4835, eleitores: 3977, filiados: 79 },
      { name: "São Carlos", habitantes: 10460, eleitores: 8199, filiados: 101 }
    ]
  },
  {
    region: "MARAVILHA",
    cities: [
      { name: "Bom Jesus do Oeste", habitantes: 2234, eleitores: 1882, filiados: 59 },
      { name: "Cunha Porã", habitantes: 11208, eleitores: 8757, filiados: 166 },
      { name: "Flor do Sertão", habitantes: 1850, eleitores: 1731, filiados: 100 },
      { name: "Iraceminha", habitantes: 4005, eleitores: 3718, filiados: 40 },
      { name: "Maravilha", habitantes: 30155, eleitores: 19942, filiados: 345 },
      { name: "Romelândia", habitantes: 4757, eleitores: 4172, filiados: 375 },
      { name: "Santa Terezinha do Progresso", habitantes: 2562, eleitores: 2497, filiados: 68 },
      { name: "São Miguel da Boa Vista", habitantes: 1788, eleitores: 1752, filiados: 132 },
      { name: "Tigrinhos", habitantes: 2480, eleitores: 2055, filiados: 67 }
    ]
  },
  {
    region: "PINHALZINHO",
    cities: [
      { name: "Modelo", habitantes: 4156, eleitores: 3478, filiados: 108 },
      { name: "Nova Erechim", habitantes: 5408, eleitores: 4047, filiados: 92 },
      { name: "Pinhalzinho", habitantes: 23379, eleitores: 15468, filiados: 267 },
      { name: "Saltinho", habitantes: 3633, eleitores: 3297, filiados: 113 },
      { name: "Saudades", habitantes: 10680, eleitores: 7593, filiados: 254 },
      { name: "Serra Alta", habitantes: 3367, eleitores: 2794, filiados: 150 },
      { name: "Sul Brasil", habitantes: 2894, eleitores: 2391, filiados: 121 },
      { name: "Águas Frias", habitantes: 2963, eleitores: 2534, filiados: 72 }
    ]
  },
  {
    region: "SÃO LOURENÇO DO OESTE",
    cities: [
      { name: "Campo Erê", habitantes: 9838, eleitores: 7524, filiados: 128 },
      { name: "Coronel Martins", habitantes: 2028, eleitores: 2081, filiados: 13 },
      { name: "Galvão", habitantes: 3200, eleitores: 2821, filiados: 53 },
      { name: "Jupiá", habitantes: 2675, eleitores: 2267, filiados: 39 },
      { name: "Novo Horizonte", habitantes: 2670, eleitores: 2608, filiados: 95 },
      { name: "São Bernardino", habitantes: 2719, eleitores: 2594, filiados: 315 },
      { name: "São Lourenço do Oeste", habitantes: 25770, eleitores: 19222, filiados: 561 }
    ]
  },
  {
    region: "QUILOMBO",
    cities: [
      { name: "Formosa do Sul", habitantes: 2743, eleitores: 2664, filiados: 34 },
      { name: "Irati", habitantes: 2100, eleitores: 2087, filiados: 50 },
      { name: "Jardinópolis", habitantes: 1808, eleitores: 1723, filiados: 34 },
      { name: "Quilombo", habitantes: 11359, eleitores: 8184, filiados: 88 },
      { name: "Santiago do Sul", habitantes: 1714, eleitores: 1540, filiados: 67 },
      { name: "União do Oeste", habitantes: 2801, eleitores: 2471, filiados: 49 }
    ]
  },
  {
    region: "CHAPECÓ",
    cities: [
      { name: "Caxambu do Sul", habitantes: 4732, eleitores: 4485, filiados: 28 },
      { name: "Chapecó", habitantes: 275959, eleitores: 161252, filiados: 1764 },
      { name: "Coronel Freitas", habitantes: 10583, eleitores: 8147, filiados: 48 },
      { name: "Guatambu", habitantes: 9267, eleitores: 6138, filiados: 102 },
      { name: "Nova Itaberaba", habitantes: 4648, eleitores: 3898, filiados: 22 },
      { name: "Planalto Alegre", habitantes: 3053, eleitores: 2937, filiados: 19 }
    ]
  },
  {
    region: "XAXIM",
    cities: [
      { name: "Cordilheira Alta", habitantes: 5099, eleitores: 4103, filiados: 84 },
      { name: "Entre Rios", habitantes: 3525, eleitores: 3093, filiados: 383 },
      { name: "Lajeado Grande", habitantes: 1771, eleitores: 1599, filiados: 15 },
      { name: "Marema", habitantes: 2219, eleitores: 2257, filiados: 31 },
      { name: "Xaxim", habitantes: 33902, eleitores: 23032, filiados: 143 }
    ]
  },
  {
    region: "XANXERÊ",
    cities: [
      { name: "Abelardo Luz", habitantes: 17736, eleitores: 12813, filiados: 116 },
      { name: "Bom Jesus", habitantes: 2872, eleitores: 2569, filiados: 62 },
      { name: "Faxinal dos Guedes", habitantes: 11486, eleitores: 8685, filiados: 114 },
      { name: "Ipuaçu", habitantes: 8046, eleitores: 5781, filiados: 67 },
      { name: "Ouro Verde", habitantes: 2203, eleitores: 2069, filiados: 100 },
      { name: "Passos Maia", habitantes: 4032, eleitores: 3473, filiados: 71 },
      { name: "Ponte Serrada", habitantes: 10764, eleitores: 8204, filiados: 141 },
      { name: "São Domingos", habitantes: 9356, eleitores: 7376, filiados: 103 },
      { name: "Vargeão", habitantes: 3716, eleitores: 3024, filiados: 72 },
      { name: "Xanxerê", habitantes: 54194, eleitores: 34349, filiados: 465 }
    ]
  },
  {
    region: "SEARA",
    cities: [
      { name: "Arabutã", habitantes: 4487, eleitores: 3847, filiados: 76 },
      { name: "Arvoredo", habitantes: 2600, eleitores: 2617, filiados: 66 },
      { name: "Ipumirim", habitantes: 8065, eleitores: 6128, filiados: 108 },
      { name: "Itá", habitantes: 7310, eleitores: 5857, filiados: 197 },
      { name: "Lindóia do Sul", habitantes: 4611, eleitores: 3882, filiados: 41 },
      { name: "Paial", habitantes: 1992, eleitores: 2013, filiados: 58 },
      { name: "Seara", habitantes: 19241, eleitores: 13922, filiados: 107 },
      { name: "Xavantina", habitantes: 3627, eleitores: 3385, filiados: 102 }
    ]
  },
  {
    region: "CONCÓRDIA",
    cities: [
      { name: "Alto Bela Vista", habitantes: 1860, eleitores: 1784, filiados: 63 },
      { name: "Concórdia", habitantes: 85982, eleitores: 60225, filiados: 759 },
      { name: "Irani", habitantes: 10497, eleitores: 7745, filiados: 215 },
      { name: "Jaborá", habitantes: 4435, eleitores: 3875, filiados: 82 },
      { name: "Peritiba", habitantes: 3039, eleitores: 2841, filiados: 92 },
      { name: "Presidente Castello Branco", habitantes: 1711, eleitores: 1655, filiados: 76 }
    ]
  },
  {
    region: "JOAÇABA",
    cities: [
      { name: "Água Doce", habitantes: 6625, eleitores: 5613, filiados: 80 },
      { name: "Catanduvas", habitantes: 10938, eleitores: 8053, filiados: 141 },
      { name: "Erval Velho", habitantes: 5081, eleitores: 3836, filiados: 83 },
      { name: "Herval d'Oeste", habitantes: 22173, eleitores: 17014, filiados: 415 },
      { name: "Ibicaré", habitantes: 3304, eleitores: 3040, filiados: 162 },
      { name: "Joaçaba", habitantes: 31509, eleitores: 22570, filiados: 243 },
      { name: "Luzerna", habitantes: 5931, eleitores: 4839, filiados: 103 },
      { name: "Treze Tílias", habitantes: 9308, eleitores: 6193, filiados: 112 },
      { name: "Vargem Bonita", habitantes: 4615, eleitores: 3995, filiados: 308 }
    ]
  },
  {
    region: "CAPINZAL",
    cities: [
      { name: "Capinzal", habitantes: 24176, eleitores: 17114, filiados: 334 },
      { name: "Ipira", habitantes: 4635, eleitores: 3889, filiados: 106 },
      { name: "Lacerdópolis", habitantes: 2296, eleitores: 1962, filiados: 51 },
      { name: "Ouro", habitantes: 7091, eleitores: 5786, filiados: 124 },
      { name: "Piratuba", habitantes: 6053, eleitores: 5280, filiados: 134 },
      { name: "Zortéa", habitantes: 4170, eleitores: 3131, filiados: 46 }
    ]
  },
  {
    region: "VIDEIRA",
    cities: [
      { name: "Arroio Trinta", habitantes: 3628, eleitores: 3113, filiados: 164 },
      { name: "Fraiburgo", habitantes: 34148, eleitores: 26426, filiados: 406 },
      { name: "Iomerê", habitantes: 2953, eleitores: 2864, filiados: 49 },
      { name: "Pinheiro Preto", habitantes: 3598, eleitores: 3060, filiados: 59 },
      { name: "Salto Veloso", habitantes: 4486, eleitores: 3475, filiados: 61 },
      { name: "Tangará", habitantes: 8189, eleitores: 6736, filiados: 155 },
      { name: "Videira", habitantes: 58299, eleitores: 39255, filiados: 353 }
    ]
  },
  {
    region: "CAÇADOR",
    cities: [
      { name: "Caçador", habitantes: 75998, eleitores: 54065, filiados: 794 },
      { name: "Calmon", habitantes: 3513, eleitores: 3211, filiados: 100 },
      { name: "Lebon Régis", habitantes: 11605, eleitores: 8729, filiados: 232 },
      { name: "Macieira", habitantes: 1800, eleitores: 2419, filiados: 105 },
      { name: "Matos Costa", habitantes: 2795, eleitores: 2447, filiados: 38 },
      { name: "Rio das Antas", habitantes: 6386, eleitores: 5316, filiados: 183 },
      { name: "Timbó Grande", habitantes: 7503, eleitores: 6076, filiados: 285 }
    ]
  },
  {
    region: "CAMPOS NOVOS",
    cities: [
      { name: "Brunópolis", habitantes: 2466, eleitores: 2894, filiados: 23 },
      { name: "Campos Novos", habitantes: 38656, eleitores: 27111, filiados: 396 },
      { name: "Ibiam", habitantes: 2055, eleitores: 1980, filiados: 58 },
      { name: "Monte Carlo", habitantes: 9235, eleitores: 7062, filiados: 367 },
      { name: "Vargem", habitantes: 2632, eleitores: 2637, filiados: 98 }
    ]
  },
  {
    region: "CURITIBANOS",
    cities: [
      { name: "Curitibanos", habitantes: 41512, eleitores: 31598, filiados: 341 },
      { name: "Frei Rogério", habitantes: 2442, eleitores: 2228, filiados: 33 },
      { name: "Ponte Alta do Norte", habitantes: 3249, eleitores: 2748, filiados: 192 },
      { name: "Santa Cecília", habitantes: 15764, eleitores: 12272, filiados: 172 },
      { name: "São Cristóvão do Sul", habitantes: 6389, eleitores: 3617, filiados: 264 }
    ]
  },
  {
    region: "ANITA GARIBALDI",
    cities: [
      { name: "Abdon Batista", habitantes: 2633, eleitores: 2656, filiados: 161 },
      { name: "Anita Garibaldi", habitantes: 8367, eleitores: 6925, filiados: 179 },
      { name: "Campo Belo do Sul", habitantes: 7342, eleitores: 6075, filiados: 121 },
      { name: "Cerro Negro", habitantes: 3326, eleitores: 3221, filiados: 15 },
      { name: "Celso Ramos", habitantes: 2860, eleitores: 2758, filiados: 164 }
    ]
  },
  {
    region: "LAGES",
    cities: [
      { name: "Bocaina do Sul", habitantes: 3618, eleitores: 3149, filiados: 321 },
      { name: "Capão Alto", habitantes: 2647, eleitores: 3158, filiados: 64 },
      { name: "Correia Pinto", habitantes: 16163, eleitores: 12221, filiados: 401 },
      { name: "Lages", habitantes: 171609, eleitores: 126235, filiados: 1103 },
      { name: "Otacílio Costa", habitantes: 17780, eleitores: 12720, filiados: 275 },
      { name: "Painel", habitantes: 2228, eleitores: 2595, filiados: 111 },
      { name: "Palmeira", habitantes: 2640, eleitores: 3214, filiados: 62 },
      { name: "Ponte Alta", habitantes: 4430, eleitores: 4071, filiados: 50 },
      { name: "São José do Cerrito", habitantes: 8755, eleitores: 7612, filiados: 356 }
    ]
  },
  {
    region: "SÃO JOAQUIM",
    cities: [
      { name: "Bom Jardim da Serra", habitantes: 4028, eleitores: 4004, filiados: 111 },
      { name: "Bom Retiro", habitantes: 8468, eleitores: 6591, filiados: 101 },
      { name: "Rio Rufino", habitantes: 2432, eleitores: 2444, filiados: 101 },
      { name: "São Joaquim", habitantes: 26852, eleitores: 19585, filiados: 135 },
      { name: "Urubici", habitantes: 11048, eleitores: 7861, filiados: 136 },
      { name: "Urupema", habitantes: 2735, eleitores: 2549, filiados: 38 }
    ]
  },
  {
    region: "ITUPORANGA",
    cities: [
      { name: "Alfredo Wagner", habitantes: 10862, eleitores: 8052, filiados: 182 },
      { name: "Aurora", habitantes: 7127, eleitores: 5521, filiados: 36 },
      { name: "Chapadão Lageado", habitantes: 3036, eleitores: 2690, filiados: 76 },
      { name: "Imbuia", habitantes: 6139, eleitores: 5160, filiados: 113 },
      { name: "Ituporanga", habitantes: 28042, eleitores: 19662, filiados: 511 },
      { name: "Leoberto Leal", habitantes: 3381, eleitores: 3284, filiados: 93 },
      { name: "Petrolândia", habitantes: 6942, eleitores: 5385, filiados: 94 },
      { name: "Vidal Ramos", habitantes: 6275, eleitores: 5329, filiados: 40 }
    ]
  },
  {
    region: "RIO DO SUL",
    cities: [
      { name: "Agrolândia", habitantes: 11491, eleitores: 8143, filiados: 607 },
      { name: "Agronômica", habitantes: 6394, eleitores: 4479, filiados: 116 },
      { name: "Atalanta", habitantes: 3270, eleitores: 2960, filiados: 150 },
      { name: "Braço do Trombudo", habitantes: 4203, eleitores: 3306, filiados: 57 },
      { name: "Laurentino", habitantes: 8427, eleitores: 5982, filiados: 150 },
      { name: "Rio do Oeste", habitantes: 8008, eleitores: 6154, filiados: 89 },
      { name: "Rio do Sul", habitantes: 76390, eleitores: 51474, filiados: 378 },
      { name: "Trombudo Central", habitantes: 7532, eleitores: 5478, filiados: 79 }
    ]
  },
  {
    region: "TAIÓ",
    cities: [
      { name: "Mirim Doce", habitantes: 2554, eleitores: 2299, filiados: 49 },
      { name: "Pouso Redondo", habitantes: 17836, eleitores: 12292, filiados: 178 },
      { name: "Rio do Campo", habitantes: 6613, eleitores: 5320, filiados: 341 },
      { name: "Salete", habitantes: 7643, eleitores: 6301, filiados: 149 },
      { name: "Santa Terezinha", habitantes: 8077, eleitores: 6712, filiados: 69 },
      { name: "Taió", habitantes: 18808, eleitores: 14805, filiados: 306 }
    ]
  },
  {
    region: "IBIRAMA",
    cities: [
      { name: "Vitor Meireles", habitantes: 5492, eleitores: 4457, filiados: 104 },
      { name: "Apiúna", habitantes: 10020, eleitores: 8475, filiados: 140 },
      { name: "Dona Emma", habitantes: 4388, eleitores: 3480, filiados: 76 },
      { name: "Ibirama", habitantes: 20663, eleitores: 15511, filiados: 116 },
      { name: "José Boiteux", habitantes: 6307, eleitores: 4429, filiados: 181 },
      { name: "Lontras", habitantes: 13586, eleitores: 9405, filiados: 204 },
      { name: "Presidente Getúlio", habitantes: 21293, eleitores: 14153, filiados: 139 },
      { name: "Presidente Nereu", habitantes: 2345, eleitores: 2278, filiados: 30 },
      { name: "Witmarsum", habitantes: 4451, eleitores: 3498, filiados: 232 }
    ]
  },
  {
    region: "TIMBÓ",
    cities: [
      { name: "Ascurra", habitantes: 8635, eleitores: 6689, filiados: 119 },
      { name: "Benedito Novo", habitantes: 10738, eleitores: 8389, filiados: 131 },
      { name: "Doutor Pedrinho", habitantes: 3719, eleitores: 3076, filiados: 36 },
      { name: "Indaial", habitantes: 7633, eleitores: 50363, filiados: 1106 },
      { name: "Rio dos Cedros", habitantes: 11163, eleitores: 8744, filiados: 51 },
      { name: "Rodeio", habitantes: 13321, eleitores: 9222, filiados: 165 },
      { name: "Timbó", habitantes: 48903, eleitores: 35363, filiados: 292 }
    ]
  },
  {
    region: "BLUMENAU",
    cities: [
      { name: "Blumenau", habitantes: 380597, eleitores: 265491, filiados: 2269 },
      { name: "Gaspar", habitantes: 76982, eleitores: 51156, filiados: 397 },
      { name: "Ilhota", habitantes: 18197, eleitores: 12179, filiados: 163 },
      { name: "Luiz Alves", habitantes: 12126, eleitores: 9907, filiados: 326 },
      { name: "Pomerode", habitantes: 36392, eleitores: 26798, filiados: 402 }
    ]
  },
  {
    region: "BRUSQUE",
    cities: [
      { name: "Botuverá", habitantes: 5623, eleitores: 4698, filiados: 132 },
      { name: "Brusque", habitantes: 151949, eleitores: 98652, filiados: 938 },
      { name: "Guabiruba", habitantes: 26082, eleitores: 16682, filiados: 132 },
      { name: "Nova Trento", habitantes: 14252, eleitores: 11253, filiados: 207 }
    ]
  },
  {
    region: "BALNEÁRIO CAMBORIÚ",
    cities: [
      { name: "Balneário Camboriú", habitantes: 148758, eleitores: 106783, filiados: 2523 },
      { name: "Bombinhas", habitantes: 27732, eleitores: 18655, filiados: 200 },
      { name: "Camboriú", habitantes: 113525, eleitores: 60580, filiados: 1492 },
      { name: "Itapema", habitantes: 83330, eleitores: 55072, filiados: 827 },
      { name: "Porto Belo", habitantes: 30590, eleitores: 19124, filiados: 257 }
    ]
  },
  {
    region: "ITAJAÍ",
    cities: [
      { name: "Balneário Piçarras", habitantes: 29725, eleitores: 21163, filiados: 533 },
      { name: "Itajaí", habitantes: 287289, eleitores: 174571, filiados: 2604 },
      { name: "Navegantes", habitantes: 93619, eleitores: 60845, filiados: 1208 },
      { name: "Penha", habitantes: 36124, eleitores: 24910, filiados: 879 }
    ]
  },
  {
    region: "JOINVILLE",
    cities: [
      { name: "Araquari", habitantes: 50178, eleitores: 26525, filiados: 620 },
      { name: "Balneário Barra do Sul", habitantes: 16360, eleitores: 11019, filiados: 350 },
      { name: "Barra Velha", habitantes: 50730, eleitores: 27378, filiados: 348 },
      { name: "Garuva", habitantes: 19554, eleitores: 12262, filiados: 199 },
      { name: "Itapoá", habitantes: 34546, eleitores: 20166, filiados: 385 },
      { name: "Joinville", habitantes: 654888, eleitores: 434821, filiados: 7626 },
      { name: "São Francisco do Sul", habitantes: 55784, eleitores: 42083, filiados: 631 },
      { name: "São João do Itaperiú", habitantes: 4732, eleitores: 4195, filiados: 99 }
    ]
  },
  {
    region: "JARAGUÁ DO SUL",
    cities: [
      { name: "Corupá", habitantes: 15781, eleitores: 11858, filiados: 294 },
      { name: "Guaramirim", habitantes: 49941, eleitores: 33478, filiados: 296 },
      { name: "Jaraguá do Sul", habitantes: 195753, eleitores: 126025, filiados: 1441 },
      { name: "Massaranduba", habitantes: 17897, eleitores: 13312, filiados: 294 },
      { name: "Schroeder", habitantes: 21273, eleitores: 13705, filiados: 218 }
    ]
  },
  {
    region: "SÃO BENTO DO SUL",
    cities: [
      { name: "Campo Alegre", habitantes: 12815, eleitores: 10144, filiados: 224 },
      { name: "Rio Negrinho", habitantes: 40168, eleitores: 32729, filiados: 327 },
      { name: "São Bento do Sul", habitantes: 86851, eleitores: 64230, filiados: 1147 }
    ]
  },
  {
    region: "MAFRA",
    cities: [
      { name: "Itaiópolis", habitantes: 22741, eleitores: 16504, filiados: 222 },
      { name: "Mafra", habitantes: 57023, eleitores: 42233, filiados: 627 },
      { name: "Monte Castelo", habitantes: 7787, eleitores: 6966, filiados: 318 },
      { name: "Papanduva", habitantes: 19667, eleitores: 14757, filiados: 235 }
    ]
  },
  {
    region: "CANOINHAS",
    cities: [
      { name: "Bela Vista do Toldo", habitantes: 5950, eleitores: 5273, filiados: 253 },
      { name: "Canoinhas", habitantes: 56721, eleitores: 43432, filiados: 415 },
      { name: "Irineópolis", habitantes: 10437, eleitores: 8408, filiados: 428 },
      { name: "Major Vieira", habitantes: 7545, eleitores: 6069, filiados: 108 },
      { name: "Porto União", habitantes: 33727, eleitores: 26200, filiados: 551 },
      { name: "Três Barras", habitantes: 20373, eleitores: 15372, filiados: 249 }
    ]
  },
  {
    region: "SOMBRIO",
    cities: [
      { name: "Balneário Gaivota", habitantes: 17306, eleitores: 12233, filiados: 434 },
      { name: "Passo de Torres", habitantes: 14284, eleitores: 8808, filiados: 268 },
      { name: "Praia Grande", habitantes: 8602, eleitores: 6549, filiados: 324 },
      { name: "Santa Rosa do Sul", habitantes: 10288, eleitores: 7709, filiados: 87 },
      { name: "São João do Sul", habitantes: 9126, eleitores: 7315, filiados: 113 },
      { name: "Sombrio", habitantes: 31397, eleitores: 21502, filiados: 244 }
    ]
  },
  {
    region: "ARARANGUÁ",
    cities: [
      { name: "Araranguá", habitantes: 75597, eleitores: 54616, filiados: 907 },
      { name: "Balneário Arroio do Silva", habitantes: 17215, eleitores: 12478, filiados: 293 },
      { name: "Ermo", habitantes: 2349, eleitores: 2672, filiados: 100 },
      { name: "Jacinto Machado", habitantes: 10813, eleitores: 9205, filiados: 194 },
      { name: "Maracajá", habitantes: 8213, eleitores: 6423, filiados: 139 },
      { name: "Meleiro", habitantes: 7127, eleitores: 5857, filiados: 400 },
      { name: "Morro Grande", habitantes: 3085, eleitores: 2687, filiados: 95 },
      { name: "Timbé do Sul", habitantes: 5495, eleitores: 4545, filiados: 146 },
      { name: "Turvo", habitantes: 13492, eleitores: 10270, filiados: 235 }
    ]
  },
  {
    region: "CRICIÚMA",
    cities: [
      { name: "Balneário Rincão", habitantes: 17226, eleitores: 13177, filiados: 393 },
      { name: "Cocal do Sul", habitantes: 17912, eleitores: 14899, filiados: 631 },
      { name: "Criciúma", habitantes: 225281, eleitores: 154638, filiados: 4569 },
      { name: "Forquilhinha", habitantes: 33929, eleitores: 22154, filiados: 812 },
      { name: "Içara", habitantes: 62455, eleitores: 43639, filiados: 1047 },
      { name: "Lauro Müller", habitantes: 14622, eleitores: 12534, filiados: 268 },
      { name: "Morro da Fumaça", habitantes: 19265, eleitores: 14012, filiados: 399 },
      { name: "Nova Veneza", habitantes: 13968, eleitores: 12586, filiados: 891 },
      { name: "Orleans", habitantes: 24474, eleitores: 19509, filiados: 427 },
      { name: "Siderópolis", habitantes: 14087, eleitores: 12175, filiados: 407 },
      { name: "Treviso", habitantes: 3895, eleitores: 3985, filiados: 243 },
      { name: "Urussanga", habitantes: 21395, eleitores: 17722, filiados: 304 }
    ]
  },
  {
    region: "TUBARÃO",
    cities: [
      { name: "Capivari Baixo", habitantes: 24799, eleitores: 18515, filiados: 243 },
      { name: "Gravatal", habitantes: 12989, eleitores: 9470, filiados: 294 },
      { name: "Jaguaruna", habitantes: 21284, eleitores: 16158, filiados: 267 },
      { name: "Pedras Grandes", habitantes: 4343, eleitores: 4207, filiados: 83 },
      { name: "Sangão", habitantes: 13567, eleitores: 8979, filiados: 216 },
      { name: "Treze de Maio", habitantes: 7585, eleitores: 6497, filiados: 79 },
      { name: "Tubarão", habitantes: 115495, eleitores: 82244, filiados: 1611 }
    ]
  },
  {
    region: "BRAÇO DO NORTE",
    cities: [
      { name: "Armazém", habitantes: 9188, eleitores: 7212, filiados: 152 },
      { name: "Braço do Norte", habitantes: 35534, eleitores: 25390, filiados: 375 },
      { name: "Grão-Pará", habitantes: 6397, eleitores: 5604, filiados: 66 },
      { name: "Rio Fortuna", habitantes: 5006, eleitores: 4385, filiados: 138 },
      { name: "Santa Rosa de Lima", habitantes: 2128, eleitores: 2033, filiados: 77 },
      { name: "São Ludgero", habitantes: 14211, eleitores: 9716, filiados: 229 },
      { name: "São Martinho", habitantes: 3501, eleitores: 3192, filiados: 38 }
    ]
  },
  {
    region: "LAGUNA",
    cities: [
      { name: "Garopaba", habitantes: 32962, eleitores: 23132, filiados: 274 },
      { name: "Imaruí", habitantes: 12127, eleitores: 10111, filiados: 201 },
      { name: "Imbituba", habitantes: 56107, eleitores: 41547, filiados: 1236 },
      { name: "Laguna", habitantes: 43992, eleitores: 36462, filiados: 558 },
      { name: "Paulo Lopes", habitantes: 9661, eleitores: 7358, filiados: 58 },
      { name: "Pescaria Brava", habitantes: 10531, eleitores: 8365, filiados: 372 }
    ]
  },
  {
    region: "SANTO AMARO",
    cities: [
      { name: "Águas Mornas", habitantes: 7082, eleitores: 6485, filiados: 170 },
      { name: "Angelina", habitantes: 5472, eleitores: 5081, filiados: 53 },
      { name: "Anitápolis", habitantes: 3726, eleitores: 3314, filiados: 52 },
      { name: "Rancho Queimado", habitantes: 3435, eleitores: 3803, filiados: 91 },
      { name: "Santo Amaro da Imperatriz", habitantes: 29392, eleitores: 19705, filiados: 428 },
      { name: "São Bonifácio", habitantes: 2986, eleitores: 2915, filiados: 43 },
      { name: "São Pedro de Alcântara", habitantes: 6076, eleitores: 4716, filiados: 72 }
    ]
  },
  {
    region: "TIJUCAS",
    cities: [
      { name: "Canelinha", habitantes: 13413, eleitores: 10126, filiados: 181 },
      { name: "Major Gercino", habitantes: 3258, eleitores: 3339, filiados: 158 },
      { name: "São João Batista", habitantes: 34733, eleitores: 23277, filiados: 139 },
      { name: "Tijucas", habitantes: 56674, eleitores: 34348, filiados: 381 }
    ]
  },
  {
    region: "FLORIANÓPOLIS",
    cities: [
      { name: "Antônio Carlos", habitantes: 12118, eleitores: 9111, filiados: 122 },
      { name: "Biguaçu", habitantes: 82028, eleitores: 56158, filiados: 667 },
      { name: "Florianópolis", habitantes: 576361, eleitores: 410812, filiados: 3916 },
      { name: "Governador Celso Ramos", habitantes: 17920, eleitores: 16864, filiados: 260 },
      { name: "Palhoça", habitantes: 245477, eleitores: 146889, filiados: 1293 },
      { name: "São José", habitantes: 289949, eleitores: 191370, filiados: 3070 }
    ]
  }
];
