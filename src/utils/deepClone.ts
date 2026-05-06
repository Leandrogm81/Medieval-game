/**
 * Clona profundamente um objeto usando structuredClone (nativo).
 * Fornece um fallback para JSON.parse/stringify caso o ambiente não suporte.
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}
