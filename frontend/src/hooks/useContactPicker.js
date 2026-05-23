export function useContactPicker() {
  const isSupported =
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window

  const pick = async () => {
    try {
      const results = await navigator.contacts.select(['name', 'tel'], { multiple: false })
      if (!results.length) return null
      const contact = results[0]
      let number = (contact.tel?.[0] || '').replace(/\s+/g, '').replace(/-/g, '')
      // Convert +234XXXXXXXXX → 0XXXXXXXXX
      if (number.startsWith('+234')) number = '0' + number.slice(4)
      const name = contact.name?.[0] || ''
      return { number, name }
    } catch {
      return null
    }
  }

  return { isSupported, pick }
}
