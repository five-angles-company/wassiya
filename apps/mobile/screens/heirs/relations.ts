/**
 * The eight relationships an heir can have, and how to read one back.
 *
 * ## Why the stored value is English
 *
 * `heirs.add` writes whatever the chip's `value` is, so the record holds
 * `"daughter"`, not `"ابنة"`. That is deliberate — the will document renders
 * from this same table, and a record whose meaning changes with the reader's
 * locale is not a record. The consequence is that **anything displaying
 * `heir.relation` has to translate it**, and `heirs.list` deliberately does not:
 * the deployment has no locale.
 *
 * That consequence used to be unhandled. ٥.١ interpolated `heir.relation`
 * straight into the card, so an Arabic-first RTL screen read "daughter · +966
 * 55 ••• 2210". This table is exported so the list and the form share one
 * definition rather than the list growing a second, partial copy.
 */
export const RELATIONS = [
  ["daughter", "relDaughter"],
  ["son", "relSon"],
  ["husband", "relHusband"],
  ["wife", "relWife"],
  ["father", "relFather"],
  ["mother", "relMother"],
  ["sibling", "relSibling"],
  ["other", "relOther"],
] as const

/**
 * Localise a stored relation.
 *
 * Falls back to the raw value rather than to a placeholder: an unrecognised
 * relation means a record written by a version this one does not know about,
 * and showing what is actually stored beats showing "—" over a real value.
 */
export function relationLabel(
  relation: string,
  t: Record<string, string | undefined>
): string {
  const found = RELATIONS.find(([value]) => value === relation)
  if (found === undefined) return relation
  return t[found[1]] ?? relation
}
