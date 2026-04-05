'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Brand = { id: string; name: string; color: string }

export function AddTaskButton({ brands, ownerId }: { brands: Brand[]; ownerId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', body: '', priority: '2', due_date: '', brand_id: '',
  })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function submit() {
    if (!form.title.trim()) return
    startTransition(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase.from('tasks_v2').insert({
        owner_id: ownerId,
        title: form.title.trim(),
        body: form.body || null,
        assignee: 'sezay',
        status: 'pending',
        priority: parseInt(form.priority),
        source: 'manual',
        due_date: form.due_date || null,
        brand_id: form.brand_id || null,
      })
      setOpen(false)
      setForm({ title: '', body: '', priority: '2', due_date: '', brand_id: '' })
      router.refresh()
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
        background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
      }}>
        + Add task
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Add task</div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--muted)', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <F label="Task *" value={form.title} onChange={v => set('title', v)} autoFocus />
              <F label="Details (optional)" value={form.body} onChange={v => set('body', v)} textarea />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <L>Priority</L>
                  <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inp}>
                    <option value="1">High</option>
                    <option value="2">Medium</option>
                    <option value="3">Low</option>
                  </select>
                </div>
                <F label="Due date" value={form.due_date} onChange={v => set('due_date', v)} type="date" />
              </div>
              {brands.length > 0 && (
                <div>
                  <L>Brand (optional)</L>
                  <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)} style={inp}>
                    <option value="">No brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} style={btnG}>Cancel</button>
              <button onClick={submit} disabled={isPending || !form.title.trim()} style={btnP}>
                {isPending ? 'Adding…' : 'Add task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function L({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>{children}</div>
}

function F({ label, value, onChange, type = 'text', autoFocus, textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; autoFocus?: boolean; textarea?: boolean
}) {
  return (
    <div>
      <L>{label}</L>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inp} autoFocus={autoFocus} />
      }
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text)', background: 'var(--bg)', fontFamily: 'inherit', boxSizing: 'border-box' }
const btnP: React.CSSProperties = { padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }
const btnG: React.CSSProperties = { padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer' }
