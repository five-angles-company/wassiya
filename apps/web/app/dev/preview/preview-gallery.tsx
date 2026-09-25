"use client"

import { FileTextIcon } from "lucide-react"

import { Ask } from "@/components/doc/ask"
import { Ledger } from "@/components/doc/ledger"
import { Paper } from "@/components/doc/paper"
import { StatusBanner } from "@/components/doc/status-banner"
import { EmptyState } from "@/components/empty-state"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"
import { AssetRow } from "@/features/box/components/asset-row"
import { BoxGate } from "@/features/box/components/box-gate"
import { heirView, type HeirCaseFacts } from "@/features/claims/lib/heir-view"
import { CLAIM_STATUS } from "@/features/claims/strings/claim-status"
import { CaseList } from "@/features/overview/components/case-list"
import { WelcomeDoors } from "@/features/overview/components/welcome-doors"

const DAY = 24 * 60 * 60 * 1000
// Fixed, so the gallery draws the same picture every time.
const NOW = Date.UTC(2026, 8, 24)

const STATES: { name: string; facts: Omit<HeirCaseFacts, "submittedAt"> }[] = [
  { name: "certificate", facts: { status: "submitted", vetoDeadline: null, certificateReceived: false, isMine: true } },
  { name: "review", facts: { status: "submitted", vetoDeadline: null, certificateReceived: true, isMine: true } },
  { name: "veto", facts: { status: "awaiting_veto", vetoDeadline: NOW + 21 * DAY, certificateReceived: true, isMine: true, reviewedAt: NOW - 9 * DAY } },
  { name: "released", facts: { status: "released", vetoDeadline: NOW - 2 * DAY, certificateReceived: true, isMine: true, reviewedAt: NOW - 32 * DAY, releasedAt: NOW - 2 * DAY } },
  { name: "vetoed", facts: { status: "vetoed", vetoDeadline: NOW + 4 * DAY, certificateReceived: true, isMine: true } },
  { name: "closed", facts: { status: "closed", vetoDeadline: null, certificateReceived: false, isMine: true } },
]

export function PreviewGallery() {
  const locale = useLocale()
  const common = t(COMMON, locale)
  const status = t(CLAIM_STATUS, locale)

  return (
    <div className="flex flex-col gap-24">
      <section id="doors">
        <WelcomeDoors name={locale === "ar" ? "سارة" : "Sara"} />
      </section>

      <section id="list">
        <CaseList
          name={locale === "ar" ? "سارة" : "Sara"}
          deliveries={[
            { deliveryId: "d1", status: "ready", subjectName: locale === "ar" ? "محمد" : "Mohammed", expiresAt: NOW + 300 * DAY },
            { deliveryId: "d2", status: "awaiting_heir", subjectName: null, expiresAt: NOW + 360 * DAY },
          ]}
          cases={[
            { id: "k57abcdefghijk", subjectName: locale === "ar" ? "عبدالله" : "Abdullah", status: "awaiting_veto", submittedAt: NOW - 12 * DAY },
          ]}
        />
      </section>

      {STATES.map(({ name, facts }) => {
        const view = heirView({ ...facts, submittedAt: NOW - 14 * DAY }, locale)
        return (
          <section key={name} id={`case-${name}`} className="flex flex-col gap-6">
            <p className="text-muted-foreground font-mono text-[12px]" dir="ltr">
              case: {name}
            </p>
            <StatusBanner tone={view.tone} icon={view.icon} headline={view.headline} date={view.date}>
              {view.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </StatusBanner>
            {view.askTitle !== null && (
              <Ask eyebrow={common.askEyebrow} title={view.askTitle} icon={FileTextIcon}>
                <p className="text-muted-foreground text-[14px]">(panel)</p>
              </Ask>
            )}
            <Ledger title={status.timelineTitle} entries={view.ledger} nowLabel={common.stepNow} />
          </section>
        )
      })}

      <section id="gate">
        <BoxGate expiresAt={NOW + 340 * DAY} busy={false} onUnlock={() => {}} />
      </section>

      <section id="assets">
        <Paper>
          <ul className="divide-border divide-y">
            <AssetRow
              item={{
                assetId: "a1",
                type: "crypto",
                title: locale === "ar" ? "محفظة بيتكوين" : "Bitcoin wallet",
                via: "direct",
                fields: [
                  { key: "kind", value: "hardware" },
                  { key: "network", value: "Bitcoin" },
                  { key: "phrase", value: "abandon ability able about above absent absorb abstract absurd abuse access accident" },
                ],
                fileUrls: [],
              }}
            />
            <AssetRow
              item={{ assetId: "a2", type: "document", title: locale === "ar" ? "صك المنزل" : "House deed", byteSize: 820_000, via: "allHeirs", fields: [{ key: "kind", value: "deed" }], fileUrls: ["#"], dek: new Uint8Array(32) }}
            />
            <AssetRow item={{ assetId: "k97fz0a8nq3", type: "photos", title: null, via: "direct", fields: [], fileUrls: [] }} />
          </ul>
        </Paper>
      </section>

      <section id="empty">
        <EmptyState title={locale === "ar" ? "لا إشعارات بعد" : "No notifications yet"} body="…" />
      </section>
    </div>
  )
}
