import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ value, onChange, placeholder = 'Search…', className }: Props) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-8 w-full"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
