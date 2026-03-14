import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, X, Download, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store'
import { useDebounce } from '@/hooks'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Warehouse, Location } from '@/types'

const mockWarehouses: Warehouse[] = [
  { id: '1', name: 'Main Warehouse', shortCode: 'MW', address: '123 Industrial Avenue, Zone A', locationCount: 4, productCount: 145 },
  { id: '2', name: 'North Branch', shortCode: 'NB', address: '456 Commerce Drive, Block B', locationCount: 2, productCount: 67 },
  { id: '3', name: 'South Depot', shortCode: 'SD', address: '789 Storage Lane, Unit 5', locationCount: 3, productCount: 34 },
]

const mockLocations: Record<string, Location[]> = {
  '1': [
    { id: '1', name: 'Rack A', shortCode: 'RA', warehouseId: '1' },
    { id: '2', name: 'Rack B', shortCode: 'RB', warehouseId: '1' },
    { id: '3', name: 'Yard', shortCode: 'YD', warehouseId: '1' },
    { id: '4', name: 'Cold Storage', shortCode: 'CS', warehouseId: '1', parentId: '1' },
  ],
  '2': [
    { id: '5', name: 'Zone A', shortCode: 'ZA', warehouseId: '2' },
    { id: '6', name: 'Zone B', shortCode: 'ZB', warehouseId: '2' },
  ],
  '3': [
    { id: '7', name: 'Bay 1', shortCode: 'B1', warehouseId: '3' },
    { id: '8', name: 'Bay 2', shortCode: 'B2', warehouseId: '3' },
    { id: '9', name: 'Returns', shortCode: 'RT', warehouseId: '3' },
  ],
}

export default function Warehouses() {
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [addingLocation, setAddingLocation] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [newLocationCode, setNewLocationCode] = useState('')

  useEffect(() => {
    setPageTitle('Warehouses')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  const selected = mockWarehouses.find((w) => w.id === selectedId)
  const locations = selectedId ? (mockLocations[selectedId] || []) : []

  const filteredWarehouses = mockWarehouses.filter(
    (w) => !searchValue || w.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouses" count={mockWarehouses.length} />

      <div className="flex gap-6" style={{ minHeight: '70vh' }}>
        {/* Left Panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          <Button className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Warehouse
          </Button>
          
          <Input
            placeholder="Search warehouses..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="text-sm"
          />

          <div className="space-y-3">
            {filteredWarehouses.map((wh) => (
              <motion.div key={wh.id} whileHover={{ y: -1 }}>
                <Card
                  className={cn(
                    'p-4 cursor-pointer transition-all',
                    selectedId === wh.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-500'
                      : 'hover:border-slate-300'
                  )}
                  onClick={() => setSelectedId(wh.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{wh.name}</span>
                        <Badge variant="secondary" className="font-mono text-[10px] px-1.5">{wh.shortCode}</Badge>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{wh.address}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                          {wh.locationCount} locations
                        </span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                          {wh.productCount} products
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1">
          {!selected ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState title="Select a warehouse" description="Choose a warehouse from the left panel to view details" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Warehouse Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Warehouse Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Name</label>
                      <Input defaultValue={selected.name} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-500">Short Code</label>
                      <Input defaultValue={selected.shortCode} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">Address</label>
                    <textarea className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" rows={2} defaultValue={selected.address} />
                  </div>
                  <Button size="sm">Save Changes</Button>
                </CardContent>
              </Card>

              {/* Locations */}
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Locations</CardTitle>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddingLocation(true)}>
                    <Plus className="w-3.5 h-3.5" /> Add Location
                  </Button>
                </CardHeader>
                <CardContent>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left text-table-header uppercase text-slate-500 pb-3">Name</th>
                        <th className="text-left text-table-header uppercase text-slate-500 pb-3">Code</th>
                        <th className="text-left text-table-header uppercase text-slate-500 pb-3">Parent</th>
                        <th className="text-right text-table-header uppercase text-slate-500 pb-3 w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map((loc) => (
                        <tr key={loc.id} className="border-b border-slate-50 dark:border-slate-800/50 h-12">
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              {loc.parentId && <span className="text-slate-300 pl-4 border-l-2 border-dashed border-slate-300">↳</span>}
                              <span className="font-medium text-slate-900 dark:text-white">{loc.name}</span>
                            </div>
                          </td>
                          <td><Badge variant="secondary" className="font-mono text-[10px]">{loc.shortCode}</Badge></td>
                          <td className="text-sm text-slate-500">
                            {loc.parentId ? locations.find(l => l.id === loc.parentId)?.name || '—' : '—'}
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Add location inline row */}
                      {addingLocation && (
                        <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                          <td className="py-2 pr-2">
                            <Input placeholder="Location name" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} className="h-8 text-sm" autoFocus />
                          </td>
                          <td className="py-2 pr-2">
                            <Input placeholder="Code" value={newLocationCode} onChange={(e) => setNewLocationCode(e.target.value)} className="h-8 text-sm w-20" />
                          </td>
                          <td></td>
                          <td className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setAddingLocation(false)}>Cancel</Button>
                              <Button size="sm" onClick={() => { setAddingLocation(false); setNewLocationName(''); setNewLocationCode('') }}>Save</Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {locations.length === 0 && !addingLocation && (
                    <EmptyState title="No locations" description="Add locations to organize stock within this warehouse" />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
