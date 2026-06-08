import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Classe utility — combina clsx (condicionais) com tailwind-merge (resolve conflitos).
 *
 * Why: sem twMerge, escrever `cn('p-2', cond && 'p-4')` produz `"p-2 p-4"`
 * e o Tailwind aplica o que vier por último no CSS, não na intenção. twMerge
 * resolve isso olhando os tokens do design system.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
