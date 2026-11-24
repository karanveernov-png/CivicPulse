import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { appReducer, type AppState, type AppAction } from './appReducer'
import { generateSeedIssues } from '../data/seedIssues'
import { loadPersistedState, savePersistedState, clearPersistedState, getDemoVoterId } from '../lib/storage'
import type { CivicIssue } from '../types'

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  voterId: string
  resetDemoData: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function initState(): AppState {
  const persisted = loadPersistedState()
  if (persisted) {
    return { issues: persisted.issues, currentUserId: persisted.currentUserId, currentRole: persisted.currentRole }
  }
  return { issues: generateSeedIssues(), currentUserId: 'demo-citizen-1', currentRole: 'citizen' }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, initState)
  const voterId = useMemo(() => getDemoVoterId(), [])

  useEffect(() => {
    savePersistedState({ issues: state.issues, currentUserId: state.currentUserId, currentRole: state.currentRole })
  }, [state])

  const resetDemoData = () => {
    clearPersistedState()
    const fresh: CivicIssue[] = generateSeedIssues()
    dispatch({ type: 'RESET', issues: fresh })
  }

  return (
    <AppContext.Provider value={{ state, dispatch, voterId, resetDemoData }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
