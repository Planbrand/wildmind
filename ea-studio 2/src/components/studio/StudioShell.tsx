'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Brand = { id: string; name: string; color: string; slug: string; mrr_pence: number; inbox_count: number }

const NAV = [
  { key: 'dashboard',  label: 'Home',       icon: HomeIcon },
  { key: 'brands',     label: 'Brands',     icon: BrandsIcon },
  { key: 'campaigns',  label: 'Campaigns',  icon: CampaignIcon },
  { key: 'pipeline',   label: 'Pipeline',   icon: PipelineIcon },
  { key: 'finances',   label: 'Finances',   icon: FinanceIcon },
  { key: 'tasks',      label: 'Tasks',      icon: TaskIcon },
]

export default function StudioShell({
  children, userName, userEmail: _userEmail, brands
}: {
  children: React.ReactNode
  userName: string
  userEmail: string
  brands: Brand[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [copilot, setCopilot] = useState('')
  const currentSection = pathname.split('/studio/')[1]?.split('/')[0] || 'dashboard'
  const initials = userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleCopilot(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && copilot.trim()) {
      router.push(`/studio/dashboard?q=${encodeURIComponent(copilot.trim())}`)
      setCopilot('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Co-pilot bar ── */}
      <div style={{
        height: 48, flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: '12px',
      }}>
        {/* Logo */}
        <Link href="/studio/dashboard" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '7px',
            background: 'var(--text)', color: '#fff',
            fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            letterSpacing: '-.5px',
          }}>{initials}</div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
            Wild<span style={{ color: 'var(--accent)' }}>mind</span>
          </span>
        </Link>

        <span style={{ color: 'var(--border)', fontSize: '18px', fontWeight: 200 }}>|</span>

        {/* Co-pilot input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: '13px', pointerEvents: 'none',
          }}>💬</span>
          <input
            value={copilot}
            onChange={e => setCopilot(e.target.value)}
            onKeyDown={handleCopilot}
            placeholder="Ask Wildmind anything… or trigger an action"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12,
              height: 32, borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              fontSize: '13px', color: 'var(--text)',
              boxSizing: 'border-box', outline: 'none',
            }}
          />
        </div>

        {/* Sign out */}
        <button onClick={signOut} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--dim)', fontSize: '12px', flexShrink: 0,
          padding: '4px 8px', borderRadius: '6px',
        }}>
          Sign out
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 200, flexShrink: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 0' }}>
            {NAV.map(item => {
              const active = currentSection === item.key ||
                (item.key === 'dashboard' && currentSection === '')
              const Icon = item.icon
              return (
                <Link key={item.key} href={`/studio/${item.key}`} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  color: active ? 'var(--text)' : 'var(--muted)',
                  background: active ? 'var(--bg)' : 'transparent',
                  textDecoration: 'none', marginBottom: '2px',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                }}>
                  <span style={{ width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0.5 }}>
                    <Icon />
                  </span>
                  {item.label}
                </Link>
              )
            })}

            {/* Brands sub-list */}
            {brands.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--dim)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '0 10px 6px' }}>
                  Brands
                </div>
                {brands.map(b => {
                  const active = pathname.startsWith(`/studio/brands/${b.slug}`)
                  return (
                    <Link key={b.id} href={`/studio/brands/${b.slug}`} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 10px', borderRadius: '7px',
                      fontSize: '12px', color: active ? 'var(--text)' : 'var(--muted)',
                      background: active ? 'var(--bg)' : 'transparent',
                      fontWeight: active ? 600 : 400,
                      textDecoration: 'none', marginBottom: '1px',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                      {b.mrr_pence > 0 && (
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>
                          £{Math.round(b.mrr_pence / 100)}
                        </span>
                      )}
                    </Link>
                  )
                })}
                <Link href="/studio/brands/new" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 10px', borderRadius: '7px',
                  fontSize: '12px', color: 'var(--dim)',
                  textDecoration: 'none', marginTop: '2px',
                }}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span> Add brand
                </Link>
              </div>
            )}
          </nav>

          {/* Bottom: Inbox shortcut */}
          <div style={{ padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <Link href="/studio/inbox" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', borderRadius: '8px',
              fontSize: '12px', color: 'var(--muted)', textDecoration: 'none',
            }}>
              <InboxIcon />
              Inbox
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

/* ── Icons ── */
function HomeIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function BrandsIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
}
function CampaignIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
}
function PipelineIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
}
function FinanceIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function TaskIcon() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
}
function InboxIcon() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
}
