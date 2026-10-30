import { useCallback, useEffect, useState } from 'react'
import { parseAtlasQuery, serializeAtlasState, type AtlasState } from '@elements-map/core'

export function useAtlasState() {
  const [state, setState] = useState(() => parseAtlasQuery(window.location.search))

  useEffect(() => {
    const restore = () => setState(parseAtlasQuery(window.location.search))
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])

  const navigate = useCallback((patch: Partial<AtlasState>) => {
    const next = { ...parseAtlasQuery(window.location.search), ...patch }
    const query = serializeAtlasState(next)
    if (query !== window.location.search) window.history.pushState(null, '', `${window.location.pathname}${query}`)
    setState(next)
  }, [])

  return [state, navigate] as const
}
