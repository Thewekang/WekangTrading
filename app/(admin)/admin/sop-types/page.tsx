'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';

interface SopType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSopTypesPage() {
  const [sopTypes, setSopTypes] = useState<SopType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSopType, setSelectedSopType] = useState<SopType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0
  });

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSopType) return;
    
    try {
      const response = await fetch(`/api/admin/sop-types/${selectedSopType.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update SOP type');
      }
      
      showToast('SOP type updated successfully', 'success');
      setShowEditModal(false);
      setSelectedSopType(null);
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

  const openEditModal = (sopType: SopType) => {
    setSelectedSopType(sopType);
    setFormData({
      name: sopType.name,
      description: sopType.description || '',
      sortOrder: sopType.sortOrder
    });
    setShowEditModal(true);
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
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sopTypes.map((sopType) => (
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
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
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
                ))}
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

        {/* Edit Modal */}
        {showEditModal && selectedSopType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4">Edit SOP Type</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
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
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sortOrder">Sort Order</Label>
                  <Input
                    id="edit-sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Update</Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSopType(null);
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
      </div>
    </div>
  );
}
