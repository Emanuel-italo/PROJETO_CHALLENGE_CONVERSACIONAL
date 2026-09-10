// useMockColar.ts
//
// POC: simula os dados que uma futura coleira ClyvoVet (temperatura +
// batimentos) mandaria pro app. Gera um valor base estável por pet (mesmo
// pet sempre começa na mesma faixa) e vai variando levemente com o tempo,
// pra parecer uma leitura "viva" sem precisar de hardware nenhum.

import { useEffect, useMemo, useState } from "react";

function semente(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return h;
}

const INTERVALO_MS = 2500;

const LOCAIS_REFERENCIA = [
  "Quintal de casa",
  "Sala de casa",
  "Rua das Acácias",
  "Praça do bairro",
  "Parque próximo",
];

export function useMockColar(petId: string | undefined) {
  const s = useMemo(() => semente(petId || "clyvo"), [petId]);

  const bpmBase = 68 + (s % 45); // ~68-112 bpm de repouso
  const tempBase = 37.8 + ((s % 12) / 10); // ~37.8-38.9 °C
  const distanciaBase = s % 3 === 0 ? 0 : 15 + (s % 180); // metros de casa

  const [bpm, setBpm] = useState(bpmBase);
  const [temperatura, setTemperatura] = useState(tempBase);
  const [distanciaM, setDistanciaM] = useState(distanciaBase);
  const [localIndice, setLocalIndice] = useState(s % LOCAIS_REFERENCIA.length);
  const [atualizadoEm, setAtualizadoEm] = useState(Date.now());

  useEffect(() => {
    setBpm(bpmBase);
    setTemperatura(tempBase);
    setDistanciaM(distanciaBase);
    setAtualizadoEm(Date.now());

    const id = setInterval(() => {
      setBpm((atual) => {
        const proximo = atual + (Math.random() * 6 - 3);
        return Math.min(140, Math.max(58, Math.round(proximo)));
      });
      setTemperatura((atual) => {
        const proximo = atual + (Math.random() * 0.2 - 0.1);
        return Math.min(39.6, Math.max(37.2, Math.round(proximo * 10) / 10));
      });
      setDistanciaM((atual) => {
        const proximo = atual + (Math.random() * 12 - 6);
        return Math.round(Math.min(400, Math.max(0, proximo)));
      });
      // De vez em quando "o pet anda" pra outro ponto de referência.
      if (Math.random() < 0.15) {
        setLocalIndice((atual) => (atual + 1) % LOCAIS_REFERENCIA.length);
      }
      setAtualizadoEm(Date.now());
    }, INTERVALO_MS);

    return () => clearInterval(id);
  }, [bpmBase, tempBase, distanciaBase]);

  return {
    bpm,
    temperatura,
    distanciaM,
    localReferencia: LOCAIS_REFERENCIA[localIndice],
    emCasa: distanciaM < 10,
    atualizadoEm,
  };
}
