'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, CheckCircle, XCircle, Trash2, Clock } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
}

export default function InviteCodesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [codeToDeactivate, setCodeToDeactivate] = useState<InviteCode | null>(null);

  useEffect(() => {
    fetchInviteCodes();
  }, []);

  async function fetchInviteCodes() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/invite-codes');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setInviteCodes(data.data);
    } catch (error) {
      console.error('Error fetching invite codes:', error);
      showToast('Failed to load invite codes', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function createInviteCode() {
    setCreating(true);
    try {
      const response = await fetch('/api/admin/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxUses,
          expiresInDays: expiresInDays === '' ? undefined : expiresInDays,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');
      
      const data = await response.json();
      showToast(`Invite code created: ${data.data.code}`, 'success');
      setShowCreateModal(false);
      setMaxUses(1);
      setExpiresInDays('');
      fetchInviteCodes();
    } catch (error) {
      console.error('Error creating invite code:', error);
      showToast('Failed to create invite code', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function deactivateCode(id: string) {
    try {
      const response = await fetch(`/api/admin/invite-codes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to deactivate');
      
      showToast('Invite code deactivated', 'success');
      setShowDeactivateModal(false);
      setCodeToDeactivate(null);
      fetchInviteCodes();
    } catch (error) {
      console.error('Error deactivating invite code:', error);
      showToast('Failed to deactivate invite code', 'error');
    }
  }

  function openDeactivateModal(code: InviteCode) {
    setCodeToDeactivate(code);
    setShowDeactivateModal(true);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  function isAvailable(code: InviteCode): boolean {
    return code.active && 
           code.usedCount < code.maxUses && 
           !isExpired(code.expiresAt);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invite Codes</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage registration invite codes for new traders
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Code
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inviteCodes.length}</div>
            <p className="text-xs text-gray-600">Total Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {inviteCodes.filter(c => isAvailable(c)).length}
            </div>
            <p className="text-xs text-gray-600">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {inviteCodes.reduce((sum, c) => sum + c.usedCount, 0)}
            </div>
            <p className="text-xs text-gray-600">Total Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {inviteCodes.filter(c => !c.active).length}
            </div>
            <p className="text-xs text-gray-600">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Invite Codes</CardTitle>
          <CardDescription>
            Click code to copy. Users who registered are shown below each code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : inviteCodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No invite codes yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {inviteCodes.map((code) => {
                const available = isAvailable(code);
                const expired = isExpired(code.expiresAt);

                return (
                  <div
                    key={code.id}
                    className={`border rounded-lg p-4 ${
                      available ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Code */}
                        <div className="flex items-center gap-3 mb-2">
                          <button
                            onClick={() => copyCode(code.code)}
                            className="text-2xl font-mono font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                          >
                            {code.code}
                            {copiedCode === code.code ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          {available && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
                              Available
                            </span>
                          )}
                          {!code.active && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                              Inactive
                            </span>
                          )}
                          {expired && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
                              Expired
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>Uses:</span>
                            <span className="font-medium">
                              {code.usedCount} / {code.maxUses}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Created: {formatDate(code.createdAt)}</span>
                          </div>
                          {code.expiresAt && (
                            <div className="flex items-center gap-1">
                              <span>Expires: {formatDate(code.expiresAt)}</span>
                            </div>
                          )}
                        </div>

                        {/* Users who registered */}
                        {code.users.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">
                              Registered Users ({code.users.length}):
                            </div>
                            <div className="space-y-1">
                              {code.users.map((user) => (
                                <div key={user.id} className="text-sm text-gray-600 flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-gray-400">·</span>
                                  <span>{user.email}</span>
                                  <span className="text-gray-400">·</span>
                                  <span className="text-xs">{formatDate(user.createdAt)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div>
                        {code.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeactivateModal(code)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Invite Code</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="maxUses">Maximum Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  max="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-600 mt-1">
                  How many people can use this code
                </p>
              </div>

              <div>
                <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="Optional"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={createInviteCode}
                disabled={creating}
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create Code'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setMaxUses(1);
                  setExpiresInDays('');
                }}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && codeToDeactivate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Deactivate Invite Code</h2>
            <p className="mb-4">
              Are you sure you want to deactivate this invite code?
            </p>
            <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-lg text-center">
              {codeToDeactivate.code}
            </div>
            <div className="text-sm text-gray-600 mb-6">
              <p>• Used: {codeToDeactivate.usedCount} / {codeToDeactivate.maxUses}</p>
              <p>• Registered users: {codeToDeactivate.users.length}</p>
              {codeToDeactivate.expiresAt && (
                <p>• Expires: {formatDate(codeToDeactivate.expiresAt)}</p>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This code will no longer be usable for registration.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={() => deactivateCode(codeToDeactivate.id)} 
                className="flex-1"
              >
                Deactivate Code
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeactivateModal(false);
                  setCodeToDeactivate(null);
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
  );
}
