import type { ReactNode } from 'react'

/** Shell wrapper kept around for historical imports — the daily-usage
 *  limit and auto-opening paywall it used to own have moved into
 *  SlimeApp (save/share counters via useFreeTierLimits). */
export default function PremiumGate({ children }: { children: ReactNode }) {
  return <>{children}</>
}
