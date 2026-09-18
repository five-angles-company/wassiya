/**
 * The screen-copy catalogue.
 *
 * Keys are route slugs, so a screen's dictionary is findable from
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
import { RECOVERY } from "@/i18n/strings/recovery"
import {
  AUDIT,
  AUTO_LOCK,
  DEVICES,
  LEGAL,
  PLAN,
  EMAIL_CHANGE,
  PROFILE,
  SETTINGS,
} from "@/i18n/strings/settings"
import {
  HEIRS,
  HEIR_NEW,
  HEIR_EDIT,
  HEIR_PREVIEW,
  RECIPIENTS,
} from "@/i18n/strings/heirs"
import {
  CHECKIN,
  CLAIM_VETO,
  GUARDIAN,
  PROTECTION,
} from "@/i18n/strings/protection"

export const SCREEN_STRINGS = {
  common: COMMON,
  tabs: TABS,

  home: HOME,
  settings: SETTINGS,
  "settings/profile": PROFILE,
  "settings/email": EMAIL_CHANGE,
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
  "heirs/edit": HEIR_EDIT,
  "assets/recipients": RECIPIENTS,
  "heirs/preview": HEIR_PREVIEW,

  protection: PROTECTION,
  // The owner's own screen. The guardian-side sets that used to sit beside it
  // — accept, claim, and the recovery approval — left with those screens:
  // guardians are web users, and mobile is the owner's app.
  "protection/guardian": GUARDIAN,
  "protection/checkin": CHECKIN,
  "protection/claim": CLAIM_VETO,

  recovery: RECOVERY,
} as const

export type ScreenName = keyof typeof SCREEN_STRINGS
