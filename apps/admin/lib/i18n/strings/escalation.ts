import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The five rungs of the check-in ladder, in order.
 *
 * Shared rather than owned by the check-ins feature: the dashboard's summary
 * bar names the same states, and shared code cannot import a feature's
 * dictionary. Two screens naming the same rung differently is the drift this
 * prevents.
 */
export const ESCALATION_LABELS = {
  idle: { ar: "منتظم", en: "On schedule" },
  day0: { ar: "فات الموعد", en: "Due" },
  day7: { ar: "أسبوع", en: "1 week" },
  day14: { ar: "أسبوعان", en: "2 weeks" },
  countdown: { ar: "مهلة الاعتراض", en: "Veto window" },
} as const satisfies Dictionary
