'use client'
import { useState, useTransition } from 'react'
import { updateContact } from './actions'

type Contact = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
  company: string | null
  country: string | null
  stage: string
  notes: string | null
  ea_note: string | null
  next_action: string | null
  last_contact_date: string | null
}

const STAGES = ['lead', 'cold', 'warm', 'hot', 'client', 'partner']

export function ContactEditor({ contact }: { contact: Contact }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    role: contact.role || '',
    company: contact.company || '',
    country: contact.country || '',
    stage: contact.stage || 'cold',
    notes: contact.notes || '',
    next_action: contact.next_action || '',
    last_contact_date: contact.last_contact_date || '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function save() {
    startTransition(async () => {
      await updateContact(contact.id, {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        role: form.role || undefined,
        company: form.company || undefined,
        country: form.country || undefined,
        stage: form.stage,
        notes: form.notes || undefined,
        next_action: form.next_action || undefined,
        last_contact_date: form.last_contact_date || undefined,
      })
      setEditing(false)
    })
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{
          padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          background: 'transparent', color: 'var(--muted)',
          border: '1px solid var(--border)', cursor: 'pointer',
        }}
      >
        Edit contact
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) setEditing(false) }}
    >
      <div style={{
        background: 'var(--surface)', borderRadius: '16px',
        border: '1px solid var(--border)', width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Edit contact</div>
          <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Name" value={form.name} onChange={v => set('name', v)} required />
          <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
          <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Role" value={form.role} onChange={v => set('role', v)} />
            <Field label="Company" value={form.company} onChange={v => set('company', v)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Country" value={form.country} onChange={v => set('country', v)} />
            <div>
              <div style={labelStyle}>Stage</div>
              <select value={form.stage} onChange={e => set('stage', e.target.value)} style={inputStyle}>
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <Field label="Next action" value={form.next_action} onChange={v => set('next_action', v)} />
          <Field label="Last contact date" value={form.last_contact_date} onChange={v => set('last_contact_date', v)} type="date" />
          <TextAreaField label="Notes" value={form.notes} onChange={v => set('notes', v)} />
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={btnGhost}>Cancel</button>
          <button onClick={save} disabled={isPending || !form.name.trim()} style={btnPrimary}>
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <div style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
      />
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
