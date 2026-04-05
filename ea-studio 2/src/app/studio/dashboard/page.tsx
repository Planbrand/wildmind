import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function pence(n: number) {
  const p = Math.round(n / 100)
  if (p >= 1000000) return '£' + (p / 1000000).toFixed(1) + 'm'
  if (p >= 1000) return '£' + Math.round(p / 1000) + 'k'
  return '£' + p.toLocaleString()
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: profile },
    { data: brands },
    { data: contacts },
    { data: threads },
    { data: campaigns },
    { data: tasks },
    { data: financeIn },
    { data: financeOut },
  ] = await Promise.all([
    supabase.from('user_profile').select('display_name').eq('user_id', user.id).single(),
    supabase.from('brands').select('id,name,color,slug,mrr_pence,pipeline_value_pence').eq('owner_id', user.id).eq('is_active', true).order('sort_order'),
    supabase.from('contacts').select('id,name,stage').eq('owner_id', user.id).in('stage', ['hot', 'warm']).limit(5),
    supabase.from('email_threads').select('id,is_read,category,received_at').eq('is_read', false).order('received_at', { ascending: false }).limit(50),
    supabase.from('campaigns').select('id,name,status,brand_id,sent_count,positive_count,brands(name,color)').order('created_at', { ascending: false }).limit(10).then(r => r).catch(() => ({ data: null })),
    supabase.from('tasks').select('id,title,assignee,due_date,status,brand_id').eq('status', 'pending').order('due_date').limit(10).then(r => r).catch(() => ({ data: null })),
    supabase.from('finance_transactions').select('id,amount_pence,description,category').eq('type', 'in').gte('date', today).lte('date', today).then(r => r).catch(() => ({ data: null })),
    supabase.from('finance_transactions').select('id,amount_pence,description,category').eq('type', 'out').gte('date', today).lte('date', today).then(r => r).catch(() => ({ data: null })),
  ])

  const name = profile?.display_name || user.email?.split('@')[0] || 'Sezay'
  const totalMrr = (brands || []).reduce((s, b) => s + (b.mrr_pence || 0), 0)
  const unreadCount = (threads || []).length
  const positiveReplies = (threads || []).filter(t => t.category === 'lead' || t.category === 'person').length
  const moneyIn = (financeIn || []).reduce((s, t) => s + (t.amount_pence || 0), 0)
  const moneyOut = (financeOut || []).reduce((s, t) => s + (t.amount_pence || 0), 0)

  const pendingCampaigns = (campaigns || []).filter((c: { status: string }) => c.status === 'pending_approval')
  const activeCampaigns = (campaigns || []).filter((c: { status: string }) => c.status === 'active')
  const myTasks = (tasks || []).filter((t: { assignee: string }) => t.assignee === 'sezay' || t.assignee !== 'ai')
  const aiTasks = (tasks || []).filter((t: { assignee: string }) => t.assignee === 'ai')

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
          {greeting()}, {name}.
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{dateStr}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>

        {/* ── 5 KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <KpiCard
            emoji="💰"
            label="Coming in today"
            value={moneyIn ? pence(moneyIn) : '—'}
            sub={financeIn?.length ? `${financeIn.length} payment${financeIn.length !== 1 ? 's' : ''}` : 'No payments today'}
            accent="#16a34a"
            href="/studio/finances"
          />
          <KpiCard
            emoji="💸"
            label="Going out today"
            value={moneyOut ? pence(moneyOut) : '—'}
            sub={financeOut?.length ? `${financeOut.length} scheduled` : 'Nothing scheduled'}
            accent="#dc2626"
            href="/studio/finances"
          />
          <KpiCard
            emoji="👥"
            label="Unread messages"
            value={String(unreadCount)}
            sub={positiveReplies > 0 ? `${positiveReplies} potential leads` : 'No new leads'}
            accent="#3b82f6"
            href="/studio/inbox"
          />
          <KpiCard
            emoji="📣"
            label="Active campaigns"
            value={String(activeCampaigns.length)}
            sub={pendingCampaigns.length > 0 ? `${pendingCampaigns.length} need approval` : 'All approved'}
            accent={pendingCampaigns.length > 0 ? '#f59e0b' : '#6b7280'}
            href="/studio/campaigns"
          />
          <KpiCard
            emoji="📈"
            label="Monthly revenue"
            value={totalMrr ? pence(totalMrr) : '—'}
            sub={`Target: £30k · ${totalMrr ? Math.round((totalMrr / 3000000) * 100) : 0}% there`}
            accent="var(--accent)"
            href="/studio/finances"
          />
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Waiting for you */}
          <Section title="⏳ Waiting for you" action={{ label: 'View all tasks', href: '/studio/tasks' }}>
            {pendingCampaigns.length === 0 && myTasks.length === 0 && unreadCount === 0 ? (
              <EmptyRow text="Nothing waiting — you're clear." />
            ) : (
              <>
                {pendingCampaigns.map((c: { id: string; name: string; brands: { color: string; name: string } | null }) => (
                  <QueueRow
                    key={c.id}
                    tag="Campaign approval"
                    tagColor="#f59e0b"
                    title={c.name}
                    brand={c.brands as { color: string; name: string } | null}
                    href="/studio/campaigns"
                  />
                ))}
                {unreadCount > 0 && (
                  <QueueRow
                    tag="Reply drafts"
                    tagColor="#3b82f6"
                    title={`${unreadCount} unread thread${unreadCount !== 1 ? 's' : ''} — Ava has drafts ready`}
                    brand={null}
                    href="/studio/inbox"
                  />
                )}
                {myTasks.slice(0, 3).map((t: { id: string; title: string; due_date: string | null }) => (
                  <QueueRow
                    key={t.id}
                    tag="Your task"
                    tagColor="#8b5cf6"
                    title={t.title}
                    brand={null}
                    href="/studio/tasks"
                    sub={t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : undefined}
                  />
                ))}
              </>
            )}
          </Section>

          {/* Running now */}
          <Section title="⚡ Running now" action={{ label: 'View campaigns', href: '/studio/campaigns' }}>
            {activeCampaigns.length === 0 && aiTasks.length === 0 ? (
              <EmptyRow text="No active campaigns. Start one →" href="/studio/campaigns" />
            ) : (
              <>
                {activeCampaigns.map((c: { id: string; name: string; sent_count: number; positive_count: number; brands: { color: string; name: string } | null }) => (
                  <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
                      {c.brands && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: (c.brands as { color: string }).color }}>
                          {(c.brands as { name: string }).name}
                        </span>
                      )}
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{c.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', paddingLeft: '14px' }}>
                      <Stat label="Sent" value={String(c.sent_count || 0)} />
                      <Stat label="Positive" value={String(c.positive_count || 0)} color="#16a34a" />
                    </div>
                  </div>
                ))}
                {aiTasks.slice(0, 3).map((t: { id: string; title: string }) => (
                  <div key={t.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px' }}>🤖</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{t.title}</span>
                  </div>
                ))}
              </>
            )}
          </Section>

          {/* Brands MRR */}
          <Section title="🏢 Brands" action={{ label: 'All brands', href: '/studio/brands' }}>
            {!brands || brands.length === 0 ? (
              <EmptyRow text="No brands yet. Add one →" href="/studio/brands/new" />
            ) : (
              brands.map(b => (
                <Link key={b.id} href={`/studio/brands/${b.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{b.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: b.mrr_pence ? '#16a34a' : 'var(--dim)' }}>
                    {b.mrr_pence ? pence(b.mrr_pence) : '£0'}/mo
                  </span>
                </Link>
              ))
            )}
          </Section>

          {/* Pipeline */}
          <Section title="🎯 Pipeline" action={{ label: 'Full pipeline', href: '/studio/pipeline' }}>
            {!contacts || contacts.length === 0 ? (
              <EmptyRow text="No hot or warm contacts yet." />
            ) : (
              contacts.map(c => {
                const initials = c.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                const colors: Record<string, { bg: string; text: string }> = {
                  hot: { bg: '#fef2f2', text: '#dc2626' },
                  warm: { bg: '#fffbeb', text: '#b45309' },
                }
                const sc = colors[c.stage] || colors.warm
                return (
                  <Link key={c.id} href={`/studio/people/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: sc.bg, color: sc.text, fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>{c.name}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.text }}>{c.stage}</span>
                  </Link>
                )
              })
            )}
          </Section>

        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function KpiCard({ emoji, label, value, sub, accent, href }: {
  emoji: string; label: string; value: string; sub: string; accent: string; href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '16px 18px',
        borderTop: `3px solid ${accent}`,
        transition: 'box-shadow .15s',
      }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>{emoji}</div>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--dim)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-.5px', marginBottom: '2px' }}>{value}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{sub}</div>
      </div>
    </Link>
  )
}

function Section({ title, children, action }: {
  title: string; children: React.ReactNode; action?: { label: string; href: string }
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        {action && (
          <Link href={action.href} style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function QueueRow({ tag, tagColor, title, brand, href, sub }: {
  tag: string; tagColor: string; title: string; brand: { color: string; name: string } | null; href: string; sub?: string
}) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: tagColor + '18', color: tagColor, flexShrink: 0, marginTop: 1 }}>
        {tag}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: brand ? '2px' : 0 }}>{title}</div>
        {brand && <div style={{ fontSize: '11px', color: brand.color, fontWeight: 600 }}>{brand.name}</div>}
        {sub && <div style={{ fontSize: '11px', color: 'var(--dim)' }}>{sub}</div>}
      </div>
      <span style={{ color: 'var(--dim)', fontSize: '14px', flexShrink: 0 }}>›</span>
    </Link>
  )
}

function EmptyRow({ text, href }: { text: string; href?: string }) {
  const inner = <div style={{ fontSize: '12px', color: 'var(--dim)', padding: '16px 0', textAlign: 'center' }}>{text}</div>
  if (href) return <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
  return inner
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--dim)' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}
