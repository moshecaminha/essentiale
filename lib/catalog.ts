// Catálogo oficial — espelha exatamente o site essentialefragrance.com.br (Nuvemshop).
// Não inventar itens aqui: qualquer mudança deve refletir o site oficial.

// Menu "Fragrâncias" do site (16 itens, na mesma ordem)
export const FRAGRANCES = [
  "Delicata",
  "Explosie",
  "Felicità",
  "Iluminatè",
  "Luxus",
  "Uniquè",
  "Poesie",
  "Vivace",
  "Serène",
  "Vollutà",
  "Vivaqua",
  "Speziata",
  "Solarie",
  "Voluttà",
  "Mièlle",
  "Avelinè",
] as const;

// "Dolcè" não está no menu, mas existe como variação de fragrância
// em produtos do site oficial (ex.: Mini Tábua Afetiva, Vela Personalizada).
export const FRAGRANCES_ADMIN = [...FRAGRANCES, "Dolcè"] as const;

// Menu "Coleções" do site
export const COLECOES = ["Afetos", "Kits"] as const;

// Categorias simples do menu principal (mesma ordem do site)
export const NAV_CATEGORIAS = [
  "Namorados",
  "Home Sprays",
  "Difusores",
  "Velas",
  "Sabonetes",
  "Essências",
] as const;

export const NAV_CATEGORIAS_FIM = ["Acessórios", "Corporativo e Eventos"] as const;
