export const formatarData = (data: string): string => {
  if (!data) return "—";
  const partes = data.split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return data;
};

export const formatarHorario = (horario: string): string => {
  if (!horario) return "—";
  return horario.length === 5 ? horario : horario.slice(0, 5);
};

export const obterCorStatus = (status: string): string => {
  switch (status) {
    case "done":
    case "ativo":
    case "ok":
      return "#2ECC71";
    case "pendente":
    case "agendada":
      return "#F39C12";
    case "cancelada":
    case "inativo":
      return "#E74C3C";
    default:
      return "#1A6EBD";
  }
};

export const obterTextoStatus = (status: string): string => {
  switch (status) {
    case "done":
      return "Aplicada";
    case "pendente":
      return "Pendente";
    case "ativo":
      return "Em uso";
    case "inativo":
      return "Concluído";
    case "agendada":
      return "Agendada";
    case "cancelada":
      return "Cancelada";
    default:
      return status;
  }
};

export const calcularIdadeTexto = (anos: string): string => {
  const n = parseFloat(anos);
  if (isNaN(n)) return anos;
  if (n < 1) return `${Math.round(n * 12)} meses`;
  return `${n} ${n === 1 ? "ano" : "anos"}`;
};

export const primeiroNome = (nome: string): string =>
  nome?.split(" ")[0] ?? "Tutor";
