/**
 * The screen-copy catalogue.
 *
 * Keys are the board's route slugs, so a screen's dictionary is findable from
 * its URL and vice versa. Read through `useStrings`, never imported directly
 * by a screen — that keeps the locale decision in one place.
 */
import { OTP, SIGN_IN, SIGN_UP, SPLASH, WELCOME } from "@/i18n/strings/auth"
import {
  BIOMETRICS,
  BIOMETRICS_DONE,
  EXPLAINER,
  KYC,
  KYC_PENDING,
  KYC_VERIFIED,
  RECOVERY_KIT,
  SETUP_COMPLETE,
} from "@/i18n/strings/setup"
import { ADD_ASSET, ASSETS, ASSET_DETAIL } from "@/i18n/strings/assets"
import {
  ASSET_NEW,
  NEW_ACCOUNT,
  NEW_BANK,
  NEW_CRYPTO,
  NEW_DOCUMENT,
  NEW_NOTE,
  NEW_PHOTOS,
} from "@/i18n/strings/asset-new"
import { COMMON, TABS } from "@/i18n/strings/common"
import { HOME, LOCK, NOTIFICATIONS } from "@/i18n/strings/home"
import { GUARDIAN_APPROVE, RECOVERY } from "@/i18n/strings/recovery"
import {
  AUDIT,
  AUTO_LOCK,
  DEVICES,
  LEGAL,
  PLAN,
  SETTINGS,
} from "@/i18n/strings/settings"
import {
  HEIRS,
  HEIR_NEW,
  HEIR_PREVIEW,
  ROUTING,
} from "@/i18n/strings/will"
import {
  CHECKIN,
  CLAIM_VETO,
  GUARDIAN,
  GUARDIAN_ACCEPT,
  PROTECTION,
} from "@/i18n/strings/protection"

export const SCREEN_STRINGS = {
  common: COMMON,
  tabs: TABS,

  home: HOME,
  settings: SETTINGS,
  "settings/lock": AUTO_LOCK,
  "settings/audit": AUDIT,
  "settings/plan": PLAN,
  "settings/devices": DEVICES,
  "settings/legal": LEGAL,
  lock: LOCK,
  notifications: NOTIFICATIONS,

  splash: SPLASH,
  welcome: WELCOME,
  "auth/signup": SIGN_UP,
  "auth/otp": OTP,
  "auth/signin": SIGN_IN,

  "setup/kyc": KYC,
  "setup/kyc/pending": KYC_PENDING,
  "setup/kyc/verified": KYC_VERIFIED,
  "setup/explainer": EXPLAINER,
  "setup/biometrics": BIOMETRICS,
  "setup/biometrics/done": BIOMETRICS_DONE,
  "setup/recovery-kit": RECOVERY_KIT,
  "setup/complete": SETUP_COMPLETE,

  assets: ASSETS,
  "assets/new-sheet": ADD_ASSET,
  "assets/detail": ASSET_DETAIL,
  "assets/new": ASSET_NEW,
  "assets/new/crypto": NEW_CRYPTO,
  "assets/new/bank": NEW_BANK,
  "assets/new/document": NEW_DOCUMENT,
  "assets/new/photos": NEW_PHOTOS,
  "assets/new/account": NEW_ACCOUNT,
  "assets/new/note": NEW_NOTE,

  heirs: HEIRS,
  "heirs/new": HEIR_NEW,
  "will/routing": ROUTING,
  "heirs/preview": HEIR_PREVIEW,

  protection: PROTECTION,
  "protection/guardian": GUARDIAN,
  "protection/guardian/accept": GUARDIAN_ACCEPT,
  "protection/checkin": CHECKIN,
  "protection/claim": CLAIM_VETO,

  recovery: RECOVERY,
  "recovery/approve": GUARDIAN_APPROVE,
} as const

export type ScreenName = keyof typeof SCREEN_STRINGS
