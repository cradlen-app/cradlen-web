/**
 * Emits a schema.org JSON-LD block.
 *
 * `type="application/ld+json"` is an HTML *data block*, not an executable
 * script, so the CSP `script-src` directive does not apply to it and no nonce
 * is needed.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Escaping `<` blocks a `</script>` breakout if any interpolated value
      // ever carries markup. Safe today (every value is ours), cheap insurance.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
