import React from 'react'

const colorStyles = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-500',
  purple: 'bg-purple-100 text-purple-600',
  gold: 'bg-gold/15 text-gold',
}

const textStyles = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-500',
  purple: 'text-purple-600',
  gold: 'text-gold',
}

export default function StatCard({ label, value, icon: Icon, color = 'gold', subtext = '' }) {
  return (
    <article className="flex flex-col justify-between rounded-xl border border-black/10 bg-white p-5 shadow-sm">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Icon size={20} className={textStyles[color]} />
          <p className={`text-sm font-medium ${textStyles[color]}`}>{label}</p>
        </div>
        <p className="text-4xl font-bold text-blue-800">{value}</p>
      </div>
      {subtext ? <p className="mt-4 text-sm text-black/50">{subtext}</p> : null}
    </article>
  )
}
