import { useState, useRef, useEffect } from 'react';

type Option = {
  id: number;
  label: string;
  sublabel?: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function ProductSearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar producto',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => String(o.id) === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enfocar el buscador al abrir
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  function handleSelect(id: number) {
    onChange(String(id));
    setOpen(false);
    setSearch('');
  }

  function handleClear() {
    onChange('');
    setOpen(false);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`
          w-full p-3 rounded-lg text-left text-sm
          flex items-center justify-between gap-2
          ${disabled ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'}
        `}
      >
        <span className={selected ? 'text-white' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-gray-400 flex-shrink-0">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute z-50 w-full mt-1
          bg-gray-800 border border-gray-600
          rounded-xl shadow-2xl
          overflow-hidden
        ">
          {/* Buscador */}
          <div className="p-2 border-b border-gray-700">
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-700 text-sm text-white placeholder-gray-400 outline-none"
            />
          </div>

          {/* Lista con scroll */}
          <div className="overflow-y-auto max-h-60">
            {/* Opción vacía */}
            <button
              type="button"
              onClick={handleClear}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-700"
            >
              {placeholder}
            </button>

            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500 text-center">
                No se encontraron productos
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`
                    w-full text-left px-4 py-2.5 text-sm
                    hover:bg-gray-700 transition-colors
                    ${String(option.id) === value ? 'bg-blue-900/40 text-white' : 'text-gray-200'}
                  `}
                >
                  <span>{option.label}</span>
                  {option.sublabel && (
                    <span className="ml-2 text-gray-400 text-xs">{option.sublabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}