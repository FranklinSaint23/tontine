import React from 'react'

export default function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-black/70">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
