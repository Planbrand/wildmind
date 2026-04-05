'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCampaign(ownerId: string, brandId: string, name: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('campaigns').insert({
    owner_id: ownerId,
    brand_id: brandId,
    name,
    status: 'draft',
  }).select('id').single()
  revalidatePath('/studio/campaigns')
  return data?.id
}

export async function updateCampaignStatus(id: string, status: string) {
  const supabase = await createClient()
  await supabase.from('campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/studio/campaigns')
  revalidatePath(`/studio/campaigns/${id}`)
}

export async function approveCampaign(id: string) {
  const supabase = await createClient()
  await supabase.from('campaigns').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id)
  await supabase.from('campaign_approvals').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('campaign_id', id)
  revalidatePath('/studio/campaigns')
  revalidatePath('/studio/dashboard')
}

export async function requestChanges(campaignId: string, feedback: string) {
  const supabase = await createClient()
  await supabase.from('campaign_approvals')
    .update({ status: 'changes_requested', feedback, updated_at: new Date().toISOString() })
    .eq('campaign_id', campaignId)
  await supabase.from('campaigns')
    .update({ status: 'draft', approval_notes: feedback, updated_at: new Date().toISOString() })
    .eq('id', campaignId)
  revalidatePath('/studio/campaigns')
}
