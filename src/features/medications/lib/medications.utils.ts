export function generateMedicationCode(name: string, strength: string): string {
  const n = name.trim();
  if (!n) return "";

  // 3-letter name abbreviation: first char + next consonants
  const first = n[0].toUpperCase();
  const consonants = n.slice(1).replace(/[aeiou\s\-]/gi, "").toUpperCase();
  const nameAbbr = (first + consonants).slice(0, 3);

  const s = strength.trim();
  if (!s) return nameAbbr;

  const match = s.match(/^([\d.]+)\s*([a-z]+)?/i);
  if (!match) return nameAbbr;

  const num = parseFloat(match[1]);
  const unit = (match[2] ?? "").toLowerCase();

  let strengthPart: string;
  if (unit === "mg" && num >= 1000) {
    const g = num / 1000;
    strengthPart = `${Number.isInteger(g) ? g : g}G`;
  } else if (unit === "g") {
    strengthPart = `${Number.isInteger(num) ? num : num}G`;
  } else if (unit === "mcg") {
    strengthPart = `${Number.isInteger(num) ? num : num}MCG`;
  } else if (unit === "ml") {
    strengthPart = `${Number.isInteger(num) ? num : num}ML`;
  } else {
    strengthPart = String(Number.isInteger(num) ? num : num);
  }

  return nameAbbr + strengthPart;
}