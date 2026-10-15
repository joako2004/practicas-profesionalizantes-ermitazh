export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function contarCaracteres(texto: string): number {
  return texto.replace(/\s/g, "").length;
}
