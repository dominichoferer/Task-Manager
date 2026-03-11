'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTaskStore, type Company, type Theme } from '@/store/useTaskStore';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6',
];

const THEMES: { id: Theme; label: string; bg: string; accent: string; description: string; dark: boolean }[] = [
  { id: 'nacht',  label: 'Nacht',  bg: '#0d0d1a', accent: '#6366f1', description: 'Dunkles Marineblau', dark: true },
  { id: 'ozean',  label: 'Ozean',  bg: '#050e1c', accent: '#3b82f6', description: 'Tiefes Meeresblau',  dark: true },
  { id: 'vulkan', label: 'Vulkan', bg: '#180a0a', accent: '#f43f5e', description: 'Warmes Dunkelrot',   dark: true },
  { id: 'wald',   label: 'Wald',   bg: '#071610', accent: '#22c55e', description: 'Dunkles Waldgrün',   dark: true },
  { id: 'tag',    label: 'Tag',    bg: '#f8f9fa', accent: '#4f46e5', description: 'Helles Weiß',        dark: false },
  { id: 'sand',   label: 'Sand',   bg: '#f5f0e8', accent: '#4f46e5', description: 'Warmes Beige',       dark: false },
];

export function SettingsPage() {
  const { companies, createCompany, updateCompany, deleteCompany, theme, setTheme } = useTaskStore();
  const [editId, setEditId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newAbbr, setNewAbbr] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleAdd() {
    if (!newName.trim() || !newAbbr.trim()) return;
    setAdding(true);
    try {
      await createCompany({ name: newName.trim(), abbreviation: newAbbr.trim().toUpperCase(), color: newColor });
      setNewName('');
      setNewAbbr('');
      setNewColor(PRESET_COLORS[0]);
      setShowForm(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold c-text">Einstellungen</h1>
        <p className="c-muted mt-1 text-sm">Design und Firmen verwalten</p>
      </div>

      {/* Theme section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold c-text">Design</h2>
          <p className="text-sm c-muted mt-0.5">Wähle ein Farbthema für die App</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                'relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                theme === t.id
                  ? 'border-indigo-500/60 bg-indigo-600/10'
                  : 'border-theme bg-surface hover:border-theme-md'
              )}
            >
              {/* Color preview swatch */}
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 border border-black/10 relative overflow-hidden"
                style={{ backgroundColor: t.bg }}
              >
                <div
                  className="absolute bottom-1 right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.accent }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium c-text">{t.label}</p>
                <p className="text-xs c-muted truncate">{t.description}</p>
              </div>
              {theme === t.id && (
                <Check className="absolute top-3 right-3 h-4 w-4 text-indigo-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Companies section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold c-text">Firmen</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Firma hinzufügen
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-theme bg-surface p-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Firmenname</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Muster GmbH"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kürzel (max. 6 Zeichen)</Label>
                <Input
                  value={newAbbr}
                  onChange={(e) => setNewAbbr(e.target.value.slice(0, 6))}
                  placeholder="z.B. MG"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Farbe</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-8 h-8 rounded-full transition-all relative"
                    style={{ backgroundColor: c }}
                  >
                    {newColor === c && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer border border-white/20 bg-transparent"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3">
              <span className="text-sm c-muted">Vorschau:</span>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold"
                style={{
                  backgroundColor: newColor + '25',
                  border: `1px solid ${newColor}50`,
                  color: newColor,
                }}
              >
                {newAbbr || 'MG'}
              </span>
              <span className="text-sm text-white/60">{newName || 'Firmenname'}</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={adding || !newName || !newAbbr} size="sm">
                Speichern
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Company list */}
        <div className="space-y-2">
          {companies.length === 0 && (
            <p className="text-sm c-subtle text-center py-8">
              Noch keine Firmen angelegt
            </p>
          )}
          {companies.map((company) => (
            <CompanyRow
              key={company.id}
              company={company}
              isEditing={editId === company.id}
              onEdit={() => setEditId(company.id)}
              onCancelEdit={() => setEditId(null)}
              onSave={() => setEditId(null)}
              presetColors={PRESET_COLORS}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompanyRow({
  company,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  presetColors,
}: {
  company: Company;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  presetColors: string[];
}) {
  const { updateCompany, deleteCompany } = useTaskStore();
  const [name, setName] = useState(company.name);
  const [abbr, setAbbr] = useState(company.abbreviation);
  const [color, setColor] = useState(company.color);

  async function handleSave() {
    await updateCompany(company.id, { name, abbreviation: abbr.toUpperCase(), color });
    onSave();
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-indigo-500/30 bg-surface p-4 space-y-3 animate-fade-in">
        <div className="grid grid-cols-2 gap-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Input value={abbr} onChange={(e) => setAbbr(e.target.value.slice(0, 6))} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {presetColors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full relative"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto" />}
            </button>
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded-full cursor-pointer border border-white/20 bg-transparent" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}><Check className="h-3.5 w-3.5 mr-1" />Speichern</Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}><X className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between px-4 py-3 rounded-xl border border-theme bg-surface-xs hover:border-theme-md transition-all">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold"
          style={{
            backgroundColor: company.color + '25',
            border: `1px solid ${company.color}50`,
            color: company.color,
          }}
        >
          {company.abbreviation}
        </span>
        <span className="text-sm c-text">{company.name}</span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 hover:text-red-400"
          onClick={() => deleteCompany(company.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
