'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTaskStore, type Company } from '@/store/useTaskStore';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6',
];

export function SettingsPage() {
  const { companies, createCompany, updateCompany, deleteCompany } = useTaskStore();
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
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Einstellungen</h1>
        <p className="text-white/40 mt-1 text-sm">Firmen und Farben verwalten</p>
      </div>

      {/* Companies section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Firmen</h2>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Firma hinzufügen
          </Button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
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
              <span className="text-sm text-white/40">Vorschau:</span>
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
            <p className="text-sm text-white/30 text-center py-8">
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
      <div className="rounded-xl border border-indigo-500/30 bg-white/5 p-4 space-y-3 animate-fade-in">
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
    <div className="group flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all">
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
        <span className="text-sm text-white">{company.name}</span>
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
