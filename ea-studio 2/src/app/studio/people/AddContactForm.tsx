'use client'
import { useState, useTransition } from 'react'
import { addContact } from './actions'

type Brand = { id: string; name: string; color: string }

const STAGES = ['lead', 'cold', 'warm', 'hot', 'client', 'partner']

export function AddContactButton({ brands }: { brands: Brand[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', role: '',
    stage: 'cold', brand_id: '', is_person: 'true',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function submit() {
    if (!form.name.trim()) return
    startTransition(async () => {
      await addContact({
        name: form.name.trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
        company: form.company || undefined,
        role: form.role || undefined,
        stage: form.stage,
        brand_id: form.brand_id || undefined,
        is_person: form.is_person === 'true',
      })
      setOpen(false)
      setForm({ name: '', email: '', phone: '', company: '', role: '', stage: 'cold', brand_id: '', is_person: 'true' })
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
        }}
      >
        + Add contact
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{
            background: 'var(--surface)', borderRadius: '16px',
            border: '1px solid var(--border)', width: '100%', maxWidth: 480,
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Add contact</div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--muted)', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <Field label="Name *" value={form.name} onChange={v => set('name', v)} />
              <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Company" value={form.company} onChange={v => set('company', v)} />
                <Field label="Role" value={form.role} onChange={v => set('role', v)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={labelStyle}>Stage</div>
                  <select value={form.stage} onChange={e => set('stage', e.target.value)} style={inputStyle}>
                    {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <div style={labelStyle}>Type</div>
                  <select value={form.is_person} onChange={e => set('is_person', e.target.value)} style={inputStyle}>
                    <option value="true">Person</option>
                    <option value="false">Other</option>
                  </select>
                </div>
              </div>
              {brands.length > 0 && (
                <div>
                  <div style={labelStyle}>Brand</div>
                  <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)} style={inputStyle}>
                    <option value="">No brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} style={btnGhost}>Cancel</button>
              <button onClick={submit} disabled={isPending || !form.name.trim()} style={btnPrimary}>
                {isPending ? 'Adding…' : 'Add contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 600, color: 'var(--dim)',
  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: '8px',
  border: '1px solid var(--border)', fontSize: '13px',
  color: 'var(--text)', background: 'var(--bg)',
  fontFamily: 'inherit', boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', borderRadius: '8px', border: 'none',
  background: 'var(--accent)', color: '#fff', fontSize: '13px',
  fontWeight: 600, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  padding: '8px 16px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'transparent',
  fontSize: '13px', color: 'var(--muted)', cursor: 'pointer',
}
