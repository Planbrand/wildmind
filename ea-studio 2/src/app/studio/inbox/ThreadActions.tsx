'use client'
import { useEffect, useTransition } from 'react'
import { markThreadRead } from '../people/actions'

export function MarkReadOnMount({ threadId, isRead }: { threadId: string; isRead: boolean }) {
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!isRead) {
      startTransition(async () => {
        await markThreadRead(threadId)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId])

  return null
}
