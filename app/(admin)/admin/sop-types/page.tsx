'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TiptapEditor } from '@/components/editors/TiptapEditor';

interface SopType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  detailContentShort: string | null;
  detailContentLong: string | null;
  detailImagesShort: string | null; // Migration 0006: JSON array
  detailImagesLong: string | null; // Migration 0006: JSON array
  detailImageNotesShort: string | null; // Migration 0006: Plain text
  detailImageNotesLong: string | null; // Migration 0006: Plain text
  detailEnabledShort: boolean;
  detailEnabledLong: boolean;
  detailUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSopTypesPage() {
  const [sopTypes, setSopTypes] = useState<SopType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearTarget, setClearTarget] = useState<'short' | 'long' | 'both' | null>(null);
  const [selectedSopType, setSelectedSopType] = useState<SopType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    detailContentShort: '',
    detailContentLong: '',
    detailEnabledShort: false,
    detailEnabledLong: false,
    detailImagesShort: [] as string[],
    detailImagesLong: [] as string[],
    detailImageNotesShort: '',
    detailImageNotesLong: ''
  });
  
  const [activeTab, setActiveTab] = useState<'basic' | 'details'>('basic');

  useEffect(() => {
    fetchSopTypes();
  }, []);

  const fetchSopTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/sop-types');
      const result = await response.json();
      
      if (result.success) {
        setSopTypes(result.data);
      }
    } catch (error) {
      showToast('Failed to load SOP types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/sop-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create SOP type');
      }
      
      showToast('SOP type created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', sortOrder: 0 });
      fetchSopTypes();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleUpdate = async () => {
    if (!selectedSopType) return;
    
    try {
      // Encode images and notes into content with special markers
      const shortContentWithMeta = JSON.stringify({
        content: formData.detailContentShort,
        images: formData.detailImagesShort,
        notes: formData.detailImageNotesShort
      });
      
      const longContentWithMeta = JSON.stringify({
        content: formData.detailContentLong,
        images: formData.detailImagesLong,
        notes: formData.detailImageNotesLong
      });
      
      const response = await fetch(`/api/admin/sop-types/${selectedSopType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          sortOrder: formData.sortOrder,
          detailContentShort: shortContentWithMeta,
          detailContentLong: longContentWithMeta,
          detailEnabledShort: formData.detailEnabledShort,
          detailEnabledLong: formData.detailEnabledLong
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update SOP type');
      }
      
      showToast('SOP type updated successfully', 'success');
      setShowEditModal(false);
      setSelectedSopType(null);
      setActiveTab('basic');
      fetchSopTypes();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleToggleActive = async (sopType: SopType) => {
    try {
      const response = await fetch(`/api/admin/sop-types/${sopType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !sopType.active })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update SOP type');
      }
      
      showToast(`SOP type ${sopType.active ? 'deactivated' : 'activated'}`, 'success');
      fetchSopTypes();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will permanently delete the SOP type.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/sop-types/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete SOP type');
      }
      
      showToast('SOP type deleted successfully', 'success');
      fetchSopTypes();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleClearStrategy = async () => {
    if (!selectedSopType || !clearTarget) return;
    
    try {
      // Prepare clear data based on target
      const clearData: any = {};
      
      if (clearTarget === 'short') {
        clearData.detailContentShort = JSON.stringify({
          content: '',
          images: [],
          notes: ''
        });
        clearData.detailEnabledShort = false;
      } else if (clearTarget === 'long') {
        clearData.detailContentLong = JSON.stringify({
          content: '',
          images: [],
          notes: ''
        });
        clearData.detailEnabledLong = false;
      } else if (clearTarget === 'both') {
        // Clear both SHORT and LONG
        clearData.detailContentShort = JSON.stringify({
          content: '',
          images: [],
          notes: ''
        });
        clearData.detailContentLong = JSON.stringify({
          content: '',
          images: [],
          notes: ''
        });
        clearData.detailEnabledShort = false;
        clearData.detailEnabledLong = false;
      }
      
      const response = await fetch(`/api/admin/sop-types/${selectedSopType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clearData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to clear strategy');
      }
      
      // Update local form state
      if (clearTarget === 'short') {
        setFormData({
          ...formData,
          detailContentShort: '',
          detailImagesShort: [],
          detailImageNotesShort: '',
          detailEnabledShort: false
        });
      } else {
        setFormData({
          ...formData,
          detailContentLong: '',
          detailImagesLong: [],
          detailImageNotesLong: '',
          detailEnabledLong: false
        });
      }
      
      showToast(
        clearTarget === 'both' 
          ? 'All strategy details cleared successfully' 
          : `${clearTarget.toUpperCase()} strategy cleared successfully`,
        'success'
      );
      setShowClearConfirmModal(false);
      setClearTarget(null);
      fetchSopTypes(); // Refresh the list
    } catch (error: any) {
      showToast(error.message || 'Failed to clear strategy', 'error');
      setShowClearConfirmModal(false);
      setClearTarget(null);
    }
  };

  const handleClearDetailFromList = async (sopType: SopType) => {
    // Set selected SOP for confirmation modal
    setSelectedSopType(sopType);
    setClearTarget('both');
    setShowClearConfirmModal(true);
  };

  const openEditModal = (sopType: SopType) => {
    setSelectedSopType(sopType);
    
    // Parse SHORT strategy data
    // After Migration 0006, always use separate columns
    const shortContent = sopType.detailContentShort || '';
    const shortImages = sopType.detailImagesShort ? JSON.parse(sopType.detailImagesShort) : [];
    const shortNotes = sopType.detailImageNotesShort || '';
    
    // Parse LONG strategy data
    // After Migration 0006, always use separate columns
    const longContent = sopType.detailContentLong || '';
    const longImages = sopType.detailImagesLong ? JSON.parse(sopType.detailImagesLong) : [];
    const longNotes = sopType.detailImageNotesLong || '';
    
    setFormData({
      name: sopType.name,
      description: sopType.description || '',
      sortOrder: sopType.sortOrder,
      detailContentShort: shortContent,
      detailContentLong: longContent,
      detailEnabledShort: sopType.detailEnabledShort,
      detailEnabledLong: sopType.detailEnabledLong,
      detailImagesShort: shortImages,
      detailImagesLong: longImages,
      detailImageNotesShort: shortNotes,
      detailImageNotesLong: longNotes
    });
    setActiveTab('basic');
    setShowEditModal(true);
  };
  
  const getDetailStatus = (sopType: SopType) => {
    const shortEnabled = sopType.detailEnabledShort;
    const longEnabled = sopType.detailEnabledLong;
    
    // Check if SHORT has actual content (not empty string)
    const hasShort = !!(sopType.detailContentShort && sopType.detailContentShort.trim() !== '' && sopType.detailContentShort !== '{}');
    // Check if LONG has actual content (not empty string)
    const hasLong = !!(sopType.detailContentLong && sopType.detailContentLong.trim() !== '' && sopType.detailContentLong !== '{}');
    
    if (shortEnabled && longEnabled) {
      return { icon: '✅', text: 'Both', color: 'bg-green-100 text-green-800' };
    } else if (shortEnabled) {
      return { icon: '📉', text: 'Short', color: 'bg-blue-100 text-blue-800' };
    } else if (longEnabled) {
      return { icon: '📈', text: 'Long', color: 'bg-purple-100 text-purple-800' };
    } else if (hasShort || hasLong) {
      return { icon: '⚠️', text: 'Draft', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { icon: '➖', text: 'None', color: 'bg-gray-100 text-gray-600' };
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4"><div className="text-center">Loading...</div></div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">⚙️ SOP Types Management</h1>
            <p className="text-gray-600">Configure trading SOP types for traders to categorize their trades</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            ➕ Create SOP Type
          </Button>
        </div>

        {sopTypes.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No SOP Types Yet</h3>
            <p className="text-gray-600 mb-4">
              Create SOP types to help traders categorize their trading strategies
            </p>
            <p className="text-sm text-gray-500 mb-4">
              💡 Default "Others" option is always available when no SOP types exist
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create First SOP Type
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Name</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                  <th className="text-center p-4 font-semibold">Sort Order</th>
                  <th className="text-center p-4 font-semibold">Status</th>
                  <th className="text-center p-4 font-semibold">Detail Status</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sopTypes.map((sopType) => {
                  const detailStatus = getDetailStatus(sopType);
                  return (
                    <tr key={sopType.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{sopType.name}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {sopType.description || <span className="text-gray-400 italic">No description</span>}
                      </td>
                      <td className="text-center p-4">{sopType.sortOrder}</td>
                      <td className="text-center p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sopType.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {sopType.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-center p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${detailStatus.color}`}>
                          {detailStatus.icon} {detailStatus.text}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openEditModal(sopType)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleToggleActive(sopType)}
                          >
                            {sopType.active ? 'Deactivate' : 'Activate'}
                          </Button>
                          {(detailStatus.text !== 'None') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-orange-600 hover:bg-orange-50 border-orange-300"
                              onClick={() => handleClearDetailFromList(sopType)}
                            >
                              Clear Detail
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDelete(sopType.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4">Create SOP Type</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Breakout, Retracement, Trend Following"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Create</Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: '', description: '', sortOrder: 0 });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Edit Modal - Enhanced with Tabs */}
        {showEditModal && selectedSopType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl p-6 my-8 max-h-[90vh] flex flex-col">
              <h2 className="text-2xl font-bold mb-4">Edit SOP Type: {selectedSopType.name}</h2>
              
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'basic' | 'details')} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details & Formatting</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4 overflow-y-auto flex-1">
                  <div>
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Short Description</Label>
                    <Input
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description for dropdown (max ~200 chars)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shown in trade entry forms</p>
                  </div>
                  <div>
                    <Label htmlFor="edit-sortOrder">Sort Order</Label>
                    <Input
                      id="edit-sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                  </div>
                </TabsContent>

                {/* Details & Formatting Tab */}
                <TabsContent value="details" className="space-y-6 mt-4 overflow-y-auto flex-1">
                  {/* SHORT Entry Strategy */}
                  <div className="border rounded-lg p-4 bg-blue-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          📉 SHORT Entry Strategy
                        </h3>
                        <p className="text-sm text-gray-600">For bearish/sell strategies</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 border-red-300"
                          onClick={() => {
                            setClearTarget('short');
                            setShowClearConfirmModal(true);
                          }}
                        >
                          🗑️ Clear
                        </Button>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="enable-short">Show to users</Label>
                          <Switch
                            id="enable-short"
                            checked={formData.detailEnabledShort}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, detailEnabledShort: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <TiptapEditor
                      content={formData.detailContentShort}
                      onChange={(content) => setFormData({ ...formData, detailContentShort: content })}
                      placeholder="Describe the SHORT entry strategy..."
                      entryType="short"
                      images={formData.detailImagesShort}
                      onImagesChange={(images) => setFormData({ ...formData, detailImagesShort: images })}
                      imageNotes={formData.detailImageNotesShort}
                      onImageNotesChange={(notes) => setFormData({ ...formData, detailImageNotesShort: notes })}
                    />
                  </div>

                  {/* LONG Entry Strategy */}
                  <div className="border rounded-lg p-4 bg-purple-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          📈 LONG Entry Strategy
                        </h3>
                        <p className="text-sm text-gray-600">For bullish/buy strategies</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 border-red-300"
                          onClick={() => {
                            setClearTarget('long');
                            setShowClearConfirmModal(true);
                          }}
                        >
                          🗑️ Clear
                        </Button>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="enable-long">Show to users</Label>
                          <Switch
                            id="enable-long"
                            checked={formData.detailEnabledLong}
                            onCheckedChange={(checked) => 
                              setFormData({ ...formData, detailEnabledLong: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <TiptapEditor
                      content={formData.detailContentLong}
                      onChange={(content) => setFormData({ ...formData, detailContentLong: content })}
                      placeholder="Describe the LONG entry strategy..."
                      entryType="long"
                      images={formData.detailImagesLong}
                      onImagesChange={(images) => setFormData({ ...formData, detailImagesLong: images })}
                      imageNotes={formData.detailImageNotesLong}
                      onImageNotesChange={(notes) => setFormData({ ...formData, detailImageNotesLong: notes })}
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold mb-1">💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Use "Insert Template" button to start with structured format</li>
                      <li>Upload chart screenshots (max 500KB per image)</li>
                      <li>Enable "Show to users" to publish strategy guide</li>
                      <li>You can enable both SHORT and LONG strategies independently</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-6 border-t mt-6">
                <Button 
                  onClick={handleUpdate} 
                  className="flex-1"
                >
                  💾 Save Changes
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSopType(null);
                    setActiveTab('basic');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Clear Strategy Confirmation Modal */}
        {showClearConfirmModal && clearTarget && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-red-600">
                {clearTarget === 'both' 
                  ? '🗑️ Clear All Strategy Details' 
                  : `Clear ${clearTarget === 'short' ? '📉 SHORT' : '📈 LONG'} Strategy`}
              </h2>
              <p className="mb-4">
                {clearTarget === 'both' 
                  ? 'Are you sure you want to clear ALL strategy details (both SHORT and LONG)?' 
                  : `Are you sure you want to clear the ${clearTarget.toUpperCase()} strategy?`}
              </p>
              <p className="text-sm text-gray-600 mb-6">This will permanently delete:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-6">
                <li>{clearTarget === 'both' ? 'All strategy content (SHORT & LONG)' : 'Strategy content (HTML text)'}</li>
                <li>All uploaded images</li>
                <li>Chart notes and annotations</li>
                <li>{clearTarget === 'both' ? 'Both visibility toggles (will be disabled)' : 'Visibility toggle (will be disabled)'}</li>
              </ul>
              <p className="text-sm font-bold text-red-600 mb-6">
                ⚠️ This action cannot be undone and will be saved immediately to the database.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={handleClearStrategy} 
                  className="flex-1"
                >
                  {clearTarget === 'both' ? 'Clear All Details' : 'Clear Strategy'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowClearConfirmModal(false);
                    setClearTarget(null);
                  }} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
