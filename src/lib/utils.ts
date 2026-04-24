import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TITLE_LOWERCASE = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "na", "no", "nas", "nos",
  "a", "o", "as", "os", "à", "às", "ao", "aos", "com", "para", "por",
]);

export function toTitleCase(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part, i) => {
      if (/^\s+$/.test(part) || part === "-") return part;
      // Preserve all-caps tokens of length <=3 (acronyms) found in original
      const original = input.split(/(\s+|-)/)[i];
      if (original && original.length <= 4 && original === original.toUpperCase() && /[A-Z]/.test(original)) {
        return original;
      }
      if (i > 0 && TITLE_LOWERCASE.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
