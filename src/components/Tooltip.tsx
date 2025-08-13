import React, { useState } from 'react'

export function Tooltip({
  children,
  content,
}: {
  children: React.ReactNode
  content: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div className="absolute z-20 mt-1 px-2 py-1 text-xs bg-black text-white rounded shadow">
          {content}
        </div>
      )}
    </div>
  )
}