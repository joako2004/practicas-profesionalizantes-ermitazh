// Los navegadores descartan tab y saltos de línea al interpretar una URL:
// "/\t/host" terminaría siendo "//host" (redirección a otro sitio).
function tieneCaracteresDeControl(valor: string): boolean {
  for (let i = 0; i < valor.length; i++) {
    const codigo = valor.charCodeAt(i);
    if (codigo <= 0x1f || codigo === 0x7f) {
      return true;
    }
  }
  return false;
}

export function destinoSeguro(valor: string): string {
  const valido =
    valor.startsWith("/") &&
    !valor.startsWith("//") &&
    !valor.includes("://") &&
    !valor.includes("\\") &&
    !tieneCaracteresDeControl(valor);
  return valido ? valor : "/";
}