export type SellerFooterFields = {
  sellerPhone?: string;
  sellerWebsite?: string;
  sellerEmail?: string;
  sellerIce?: string;
  sellerIf?: string;
  sellerRc?: string;
  sellerCnss?: string;
  sellerAddress?: string;
  /** Legacy free-text — used when structured fields are empty */
  sellerLegal?: string;
  sellerContact?: string;
};

export function hasStructuredSellerFooter(fields: SellerFooterFields): boolean {
  return Boolean(
    fields.sellerPhone?.trim() ||
      fields.sellerWebsite?.trim() ||
      fields.sellerEmail?.trim() ||
      fields.sellerIce?.trim() ||
      fields.sellerIf?.trim() ||
      fields.sellerRc?.trim() ||
      fields.sellerCnss?.trim() ||
      fields.sellerAddress?.trim(),
  );
}

export function hasSellerFooter(fields: SellerFooterFields): boolean {
  return (
    hasStructuredSellerFooter(fields) ||
    Boolean(fields.sellerLegal?.trim() || fields.sellerContact?.trim())
  );
}

function formatWebsite(url: string): string {
  let w = url.trim().replace(/^https?:\/\//i, "");
  if (!w) return "";
  w = w.toUpperCase();
  return w.startsWith("WWW.") ? w : `WWW.${w}`;
}

/** Single-line footer like: TEL : … / WWW.… / EMAIL : … / ICE: … / IF : … / RC : … / CNSS : … / ADRESSE : … */
export function formatSellerFooterLine(fields: SellerFooterFields): string {
  const parts: string[] = [];
  if (fields.sellerPhone?.trim()) parts.push(`TEL : ${fields.sellerPhone.trim()}`);
  if (fields.sellerWebsite?.trim()) parts.push(formatWebsite(fields.sellerWebsite));
  if (fields.sellerEmail?.trim()) parts.push(`EMAIL : ${fields.sellerEmail.trim().toUpperCase()}`);
  if (fields.sellerIce?.trim()) parts.push(`ICE: ${fields.sellerIce.trim()}`);
  if (fields.sellerIf?.trim()) parts.push(`IF : ${fields.sellerIf.trim()}`);
  if (fields.sellerRc?.trim()) parts.push(`RC : ${fields.sellerRc.trim()}`);
  if (fields.sellerCnss?.trim()) parts.push(`CNSS : ${fields.sellerCnss.trim()}`);
  if (fields.sellerAddress?.trim()) parts.push(`ADRESSE : ${fields.sellerAddress.trim().toUpperCase()}`);
  return parts.join(" /");
}

export function buildSellerFooterLines(fields: SellerFooterFields): string[] {
  if (hasStructuredSellerFooter(fields)) {
    const line = formatSellerFooterLine(fields);
    return line ? [line] : [];
  }
  return [fields.sellerAddress, fields.sellerLegal, fields.sellerContact].filter(
    (l): l is string => Boolean(l?.trim()),
  );
}
