// useBreedPhoto.ts
//
// Quando o pet não tem foto própria cadastrada, busca uma foto real
// condizente com a raça (ex.: Labrador -> foto de um Labrador de verdade)
// em APIs públicas e gratuitas — sem precisar de chave:
//   • Cães: Dog CEO API (https://dog.ceo)
//   • Gatos: CATAAS  (https://cataas.com)
//
// Resultado é cacheado em memória por espécie+raça, então a mesma
// combinação não bate na rede de novo durante a sessão.

import { useEffect, useState } from "react";
import { Pet } from "../types";

const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

function fold(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(MARCAS_DIACRITICAS, "")
    .toLowerCase()
    .trim();
}

const TERMOS_CACHORRO = ["cachorro", "cao", "dog", "canino", "canina"];
const TERMOS_GATO = ["gato", "gata", "cat", "felino", "felina"];

function ehCachorro(especie: string): boolean {
  const e = fold(especie);
  return TERMOS_CACHORRO.some((t) => e.includes(t));
}

function ehGato(especie: string): boolean {
  const e = fold(especie);
  return TERMOS_GATO.some((t) => e.includes(t));
}

// Mapa best-effort de raças (pt-BR, sem acento) -> slug da Dog CEO API.
// Raças não mapeadas caem numa foto aleatória de cachorro (nunca ficam
// sem imagem nenhuma).
const RACAS_CACHORRO: Record<string, string> = {
  labrador: "labrador",
  "golden retriever": "retriever/golden",
  golden: "retriever/golden",
  poodle: "poodle/standard",
  "buldogue frances": "bulldog/french",
  "bulldog frances": "bulldog/french",
  "buldogue ingles": "bulldog/english",
  "bulldog ingles": "bulldog/english",
  buldogue: "bulldog/boston",
  bulldog: "bulldog/boston",
  "pastor alemao": "germanshepherd",
  rottweiler: "rottweiler",
  pitbull: "pitbull",
  "pit bull": "pitbull",
  chihuahua: "chihuahua",
  "husky siberiano": "husky",
  husky: "husky",
  "shih tzu": "shihtzu",
  shihtzu: "shihtzu",
  yorkshire: "terrier/yorkshire",
  pug: "pug",
  beagle: "beagle",
  dalmata: "dalmatian",
  boxer: "boxer",
  doberman: "doberman",
  cocker: "spaniel/cocker",
  "cocker spaniel": "spaniel/cocker",
  maltes: "maltese",
  lhasa: "lhasa",
  akita: "akita",
  basset: "hound/basset",
  "basset hound": "hound/basset",
  schnauzer: "schnauzer/miniature",
  "sao bernardo": "stbernard",
  samoieda: "samoyed",
  samoyeda: "samoyed",
  weimaraner: "weimaraner",
  pequines: "pekinese",
  "spitz alemao": "pomeranian",
  "lulu da pomerania": "pomeranian",
  "border collie": "collie/border",
  corgi: "corgi/cardigan",
  mastim: "mastiff/english",
  mastiff: "mastiff/english",
  galgo: "greyhound/italian",
  whippet: "whippet",
  "dogue alemao": "dane/great",
  "dogo alemao": "dane/great",
};

const DOG_RANDOM = "https://dog.ceo/api/breeds/image/random";

async function buscarFotoCachorro(racaBruta: string): Promise<string | null> {
  const slug = RACAS_CACHORRO[fold(racaBruta)];
  const endpoint = slug ? `https://dog.ceo/api/breed/${slug}/images/random` : DOG_RANDOM;

  try {
    const resposta = await fetch(endpoint);
    const dados = await resposta.json();
    if (dados?.status === "success" && typeof dados.message === "string") {
      return dados.message;
    }
    throw new Error("resposta inesperada");
  } catch {
    if (!slug) return null;
    // O slug pode não existir de fato na API — tenta uma foto genérica
    // de cachorro antes de desistir.
    try {
      const resposta = await fetch(DOG_RANDOM);
      const dados = await resposta.json();
      return dados?.status === "success" ? dados.message : null;
    } catch {
      return null;
    }
  }
}

function fotoGato(racaBruta: string): string {
  const tag = fold(racaBruta).replace(/\s+/g, "");
  return tag ? `https://cataas.com/cat?tag=${encodeURIComponent(tag)}` : "https://cataas.com/cat";
}

const cache = new Map<string, string>();

/** Foto real de referência da raça do pet, ou null se não for possível achar uma. */
export function useBreedPhoto(pet: Pick<Pet, "species" | "breed"> | null | undefined): string | null {
  const especie = pet?.species ?? "";
  const raca = pet?.breed ?? "";
  const chave = `${fold(especie)}::${fold(raca)}`;

  const [url, setUrl] = useState<string | null>(() => cache.get(chave) ?? null);

  useEffect(() => {
    if (!pet) {
      setUrl(null);
      return;
    }

    const emCache = cache.get(chave);
    if (emCache) {
      setUrl(emCache);
      return;
    }

    setUrl(null);
    let vivo = true;

    if (ehGato(especie)) {
      const resultado = fotoGato(raca);
      cache.set(chave, resultado);
      setUrl(resultado);
      return;
    }

    if (ehCachorro(especie) || !especie.trim()) {
      buscarFotoCachorro(raca).then((resultado) => {
        if (!vivo || !resultado) return;
        cache.set(chave, resultado);
        setUrl(resultado);
      });
    }

    return () => {
      vivo = false;
    };
  }, [chave, pet, especie, raca]);

  return url;
}
