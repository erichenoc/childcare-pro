'use client'

import { useEffect, useCallback, useRef } from 'react'

/**
 * Hook to warn users about unsaved changes when navigating away.
 * Adds a beforeunload event listener when there are unsaved changes.
 *
 * @param hasUnsavedChanges - Whether there are currently unsaved changes
 * @param message - Optional custom warning message (browser may override this)
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
) {
  const messageRef = useRef(message)
  messageRef.current = message

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges) return
    e.preventDefault()
    // Modern browsers ignore custom messages but still show a dialog
    e.returnValue = messageRef.current
    return messageRef.current
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, handleBeforeUnload])
}

export default useUnsavedChanges
