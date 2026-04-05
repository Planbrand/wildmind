'use client'
import { useState, useTransition } from 'react'
import { addAgendaEntry, addContact, addGoal } from './actions'

const STAGES = ['lead', 'cold', 'warm', 'hot', 'client', 'partner']

/* ─────────────────────────── Add Agenda Note ─────────────────────────── */
export function AddAgendaButton({ brandId, ownerId, slug }: { brandId: string; ownerId: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function submit() {
    if (!title.trim()) return
    startTransition(async () => {
      await addAgendaEntry(brandId, ownerId, title, body, slug)
      setOpen(false)
      setTitle('')
      setBody('')
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnPrimary}>+ Add note</button>
      {open && (
        <Modal title="Add agenda note" onClose={() => setOpen(false)}>
          <Field label="Title *" value={title} onChange={setTitle} />
          <TextArea label="Details" value={body} onChange={setBody} />
          <Footer onCancel={() => setOpen(false)} onSubmit={submit} isPending={isPending} disabled={!title.trim()} label="Add note" />
        </Modal>
      )}
    </>
  )
}

/* ─────────────────────────── Add Contact ─────────────────────────── */
export function AddContactBrandButton({ brandId, ownerId, slug }: { brandId: string; ownerId: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', email: '', company: '', stage: 'cold' })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function submit() {
    if (!form.name.trim()) return
    startTransition(async () => {
      await addContact(brandId, ownerId, form.name, form.email, form.company, form.stage, slug)
      setOpen(false)
      setForm({ name: '', email: '', company: '', stage: 'cold' })
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnPrimary}>+ Add contact</button>
      {open && (
        <Modal title="Add contact" onClose={() => setOpen(false)}>
          <Field label="Name *" value={form.name} onChange={v => set('name', v)} />
          <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
          <Field label="Company" value={form.company} onChange={v => set('company', v)} />
          <div>
            <div style={labelStyle}>Stage</div>
            <select value={form.stage} onChange={e => set('stage', e.target.value)} style={inputStyle}>
              {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <Footer onCancel={() => setOpen(false)} onSubmit={submit} isPending={isPending} disabled={!form.name.trim()} label="Add contact" />
        </Modal>
      )}
    </>
  )
}

/* ─────────────────────────── Add Goal ─────────────────────────── */
export function AddGoalButton({ brandId, ownerId, slug }: { brandId: string; ownerId: string; slug: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ title: '', description: '', targetDate: '' })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function submit() {
    if (!form.title.trim()) return
    startTransition(async () => {
      await addGoal(brandId, ownerId, form.title, form.description, form.targetDate, slug)
      setOpen(false)
      setForm({ title: '', description: '', targetDate: '' })
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnPrimary}>+ Add goal</button>
      {open && (
        <Modal title="Add goal" onClose={() => setOpen(false)}>
          <Field label="Title *" value={form.title} onChange={v => set('title', v)} />
          <TextArea label="Description" value={form.description} onChange={v => set('description', v)} />
          <Field label="Target date" value={form.targetDate} onChange={v => set('targetDate', v)} type="date" />
          <Footer onCancel={() => setOpen(false)} onSubmit={submit} isPending={isPending} disabled={!form.title.trim()} label="Add goal" />
        </Modal>
      )}
    </>
  )
}

/* ─────────────────────────── Shared UI ─────────────────────────── */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%', maxWidth: 460 }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--muted)', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Footer({ onCancel, onSubmit, isPending, disabled, label }: {
  onCancel: () => void; onSubmit: () => void; isPending: boolean; disabled: boolean; label: string
}) {
  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
      <button onClick={onCancel} style={btnGhost}>Cancel</button>
      <button onClick={onSubmit} disabled={isPending || disabled} style={btnPrimaryFull}>
        {isPending ? 'Saving…' : label}
      </button>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: '68px' }} />
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
  padding: '7px 14px', borderRadius: '8px', border: 'none',
  background: 'var(--accent)', color: '#fff', fontSize: '12px',
  fontWeight: 600, cursor: 'pointer', flexShrink: 0,
}
const btnPrimaryFull: React.CSSProperties = {
  padding: '8px 20px', borderRadius: '8px', border: 'none',
  background: 'var(--accent)', color: '#fff', fontSize: '13px',
  fontWeight: 600, cursor: 'pointer',
}
const btnGhost: React.CSSProperties = {
  padding: '8px 16px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'transparent',
  fontSize: '13px', color: 'var(--muted)', cursor: 'pointer',
}
