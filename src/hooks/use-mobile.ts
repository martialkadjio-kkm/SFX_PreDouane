import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isHydrated, setIsHydrated] = React.useState(false)

  React.useEffect(() => {
    // Marquer comme hydraté
    setIsHydrated(true)
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Pendant l'hydratation, assumer desktop pour éviter le mismatch
  // Une fois hydraté, utiliser la vraie valeur
  if (!isHydrated) {
    return false // Assumer desktop pendant l'hydratation
  }

  return !!isMobile
}
