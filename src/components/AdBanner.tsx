import { useEffect } from 'react'
import { isAdMobSupported, removeBanner } from '../lib/admob'

/** TEMPORARY: ads are hidden while payments are disabled so free-tier
 *  users don't see banners they can't currently pay to remove. The
 *  AdMob init call is skipped entirely to avoid network / SDK startup
 *  cost. Revert this file to re-enable the banner + interstitial flow
 *  (see git history for the full original). */
export default function AdBanner() {
  useEffect(() => {
    if (!isAdMobSupported()) return
    // In case a previous session left a banner on screen, tear it down.
    void removeBanner()
  }, [])

  return null
}
