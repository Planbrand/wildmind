import { createClient } from '@/lib/supabase/server'
import { AddTaskButton } from './AddTaskButton'

const PRIORITY_META: Record<number, { label: string; color: string }> = {
  1: { label: 'High',   color: '#dc2626' },
  2: { label: 'Medium', color: '#f59e0b' },
  3: { label: 'Low',    color: '#6b7280' },
}

const SOURCE_META: Record<string, { label: string; color: string }> = {
  manual:   { label: 'Manual',    color: '#6b7280' },
  call:     { label: 'From call', color: '#8b5cf6' },
  email:    { label: 'From email', color: '#3b82f6' },
  ai:       { label: 'AI',        color: '#16a34a' },
  campaign: { label: 'Campaign',  color: '#f59e0b' },
}

type Task = {
  id: string; title: string; body: string | null
  assignee: string; status: string; priority: number
  source: string; due_date: string | null; brand_id: string | null
  created_at: string; brands?: { name: string; color: string } | null
}

async function markDone(taskId: string) {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const { revalidatePath } = await import('next/cache')
  const supabase = await createClient()
  await supabase.from('tasks_v2').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', taskId)
  revalidatePath('/studio/tasks')
}

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: brands } = await supabase
    .from('brands').select('id,name,color').order('sort_order')

  const { data: v2Tasks } = await supabase
    .from('tasks_v2')
    .select('*, brands(name,color)')
    .eq('owner_id', user.id)
    .order('priority')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(100)
    .catch(() => ({ data: null })) as { data: Task[] | null }

  const all = (v2Tasks || []) as Task[]
  const today = new Date().toISOString().split('T')[0]

  const myTasks  = all.filter(t => t.assignee !== 'ai' && t.status === 'pending')
  const aiTasks  = all.filter(t => t.assignee === 'ai'  && t.status !== 'done')
  const doneTasks = all.filter(t => t.status === 'done').slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Tasks</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            {myTasks.length} yours · {aiTasks.length} AI running
            {myTasks.filter(t => t.due_date && t.due_date < today).length > 0 && (
              <span style={{ color: '#dc2626', fontWeight: 700 }}>
                {' '}· {myTasks.filter(t => t.due_date && t.due_date < today).length} overdue
              </span>
            )}
          </div>
        </div>
        <AddTaskButton brands={brands || []} ownerId={user.id} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Your queue */}
          <div>
            <SectionTitle label="Your queue" count={myTasks.length} color="var(--accent)" />
            {myTasks.length === 0 ? (
              <EmptyCard icon="✅" title="All clear" sub="No tasks waiting for you." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myTasks.map(t => {
                  const pm = PRIORITY_META[t.priority] || PRIORITY_META[2]
                  const sm = SOURCE_META[t.source] || SOURCE_META.manual
                  const brand = t.brands as { name: string; color: string } | null
                  const overdue = !!(t.due_date && t.due_date < today)
                  const dueToday = t.due_date === today
                  return (
                    <div key={t.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: '10px', padding: '12px 14px',
                      borderLeft: `3px solid ${overdue ? '#dc2626' : pm.color}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>{t.title}</div>
                        <form action={markDone.bind(null, t.id)}>
                          <button type="submit" style={{
                            background: 'none', border: '1px solid var(--border)', borderRadius: '50%',
                            width: 22, height: 22, cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', color: 'var(--dim)',
                          }} title="Mark done">✓</button>
                        </form>
                      </div>
                      {t.body && <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', lineHeight: 1.5 }}>{t.body}</div>}
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <Badge label={pm.label} color={pm.color} />
                        <Badge label={sm.label} color={sm.color} />
                        {brand && <Badge label={brand.name} color={brand.color} />}
                        {t.due_date && (
                          <span style={{ fontSize: '10px', fontWeight: 700, marginLeft: 'auto', color: overdue ? '#dc2626' : dueToday ? '#f59e0b' : 'var(--dim)' }}>
                            {overdue ? '⚠ Overdue' : dueToday ? '📅 Today' : t.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* AI + Done */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div>
              <SectionTitle label="🤖 AI running" count={aiTasks.length} color="#16a34a" />
              {aiTasks.length === 0 ? (
                <EmptyCard icon="⚡" title="Nothing running" sub="AI tasks will appear here when campaigns are active." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiTasks.map(t => {
                    const sm = SOURCE_META[t.source] || SOURCE_META.ai
                    const brand = t.brands as { name: string; color: string } | null
                    return (
                      <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', borderLeft: '3px solid #16a34a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{t.title}</div>
                        </div>
                        {t.body && <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>{t.body}</div>}
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <Badge label={sm.label} color={sm.color} />
                          {brand && <Badge label={brand.name} color={brand.color} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {doneTasks.length > 0 && (
              <div>
                <SectionTitle label="Recently done" count={0} color="var(--dim)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {doneTasks.map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', opacity: 0.55 }}>
                      <span style={{ color: '#16a34a', fontSize: '12px' }}>✓</span>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', textDecoration: 'line-through' }}>{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function SectionTitle({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {label}
      {count > 0 && <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', background: color, color: '#fff' }}>{count}</span>}
    </div>
  )
}

function EmptyCard({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', textAlign: 'center' }}>
      <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{sub}</div>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px', background: color + '18', color }}>
      {label}
    </span>
  )
}
