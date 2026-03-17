'use client'

import { createContext, useContext } from 'react'

export type DashboardUser = {
  id: string
  email: string | null
}

const DashboardUserContext = createContext<DashboardUser | null>(null)

export function DashboardUserProvider({
  user,
  children,
}: {
  user: DashboardUser
  children: React.ReactNode
}) {
  return <DashboardUserContext.Provider value={user}>{children}</DashboardUserContext.Provider>
}

export function useDashboardUser() {
  const user = useContext(DashboardUserContext)
  if (!user) {
    throw new Error('useDashboardUser must be used within DashboardUserProvider')
  }
  return user
}
