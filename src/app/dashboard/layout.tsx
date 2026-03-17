import { redirect } from 'next/navigation'
import { DashboardUserProvider } from '@/components/DashboardUserProvider'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardUserProvider
      user={{
        id: user.id,
        email: user.email ?? null,
      }}
    >
      {children}
    </DashboardUserProvider>
  )
}
