'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateContact(
  id: string,
  fields: {
    name?: string
    email?: string
    phone?: string
    company?: string
    role?: string
    country?: string
    stage?: string
    notes?: string
    ea_note?: string
    next_action?: string
    last_contact_date?: string
    is_person?: boolean
  }
) {
  const supabase = await createClient()
  await supabase.from('contacts').update(fields).eq('id', id)
  revalidatePath(`/studio/people/${id}`)
  revalidatePath('/studio/people')
}

export async function addContact(fields: {
  name: string
  email?: string
  phone?: string
  company?: string
  role?: string
  stage?: string
  brand_id?: string
  is_person?: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('contacts').insert({
    owner_id: user.id,
    stage: 'cold',
    is_person: true,
    ...fields,
  })
  revalidatePath('/studio/people')
}

export async function markThreadRead(threadId: string) {
  const supabase = await createClient()
  await supabase.from('email_threads').update({ is_read: true }).eq('id', threadId)
  revalidatePath(`/studio/inbox/${threadId}`)
  revalidatePath('/studio/inbox')
}
