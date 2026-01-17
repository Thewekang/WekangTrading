'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COMMON_TIMEZONES, getAllTimezones, getCurrentTimeInTimezone } from '@/lib/utils/timezones';
import { User, Mail, Shield, Globe, Lock, Save } from 'lucide-react';

interface AccountSummary {
  totalTrades: number;
  totalSummaries: number;
  totalTargets: number;
  totalBadges: number;
  totalNotifications: number;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
  preferredTimezone: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [allTimezones, setAllTimezones] = useState<string[]>([]);

  // Profile editing state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Timezone preferences state
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Kuala_Lumpur');
  const [currentTime, setCurrentTime] = useState('');
  const [savingTimezone, setSavingTimezone] = useState(false);

  // Fetch user info on mount
  useEffect(() => {
    fetchUserInfo();
    // Get all available timezones
    setAllTimezones(getAllTimezones());
  }, []);

  // Update current time when timezone changes
  useEffect(() => {
    if (selectedTimezone) {
      const updateTime = () => {
        setCurrentTime(getCurrentTimeInTimezone(selectedTimezone));
      };
      
      updateTime(); // Initial update
      const interval = setInterval(updateTime, 1000); // Update every second
      
      return () => clearInterval(interval);
    }
  }, [selectedTimezone]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const result = await response.json();
        setUserInfo(result.data);
        setName(result.data.name);
        setEmail(result.data.email);
        setSelectedTimezone(result.data.preferredTimezone || 'Asia/Kuala_Lumpur');
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update profile');
      }

      showToast('Profile updated successfully', 'success');
      setUserInfo(result.data);
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveTimezone = async () => {
    setSavingTimezone(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredTimezone: selectedTimezone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update timezone');
      }

      showToast('Timezone preferences saved. Refreshing page...', 'success');
      
      // Reload page to apply timezone changes throughout the app
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      showToast(error.message || 'Failed to update timezone', 'error');
    } finally {
      setSavingTimezone(false);
    }
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Account reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [resetting, setResetting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match", 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to change password');
      }

      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const openResetModal = async () => {
    try {
      const response = await fetch('/api/users/me/reset');
      const result = await response.json();
      
      if (result.success && result.data) {
        setAccountSummary(result.data);
        setShowResetModal(true);
      }
    } catch (error) {
      showToast('Failed to load account summary', 'error');
    }
  };

  const handleResetAccount = async () => {
    if (resetConfirmation !== 'RESET MY ACCOUNT') {
      showToast('Please type "RESET MY ACCOUNT" to confirm', 'error');
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/users/me/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation: resetConfirmation,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to reset account');
      }

      showToast('Account reset successfully', 'success');
      setShowResetModal(false);
      setResetConfirmation('');
      
      // Reload page to show empty state
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      showToast(error.message || 'Failed to reset account', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Profile Information */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={userInfo?.role !== 'ADMIN'}
              className={userInfo?.role !== 'ADMIN' ? 'bg-gray-50' : ''}
            />
            {userInfo?.role !== 'ADMIN' && (
              <p className="text-xs text-gray-600 mt-1">Contact admin to change your name</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={userInfo?.role !== 'ADMIN'}
              className={userInfo?.role !== 'ADMIN' ? 'bg-gray-50' : ''}
            />
            {userInfo?.role !== 'ADMIN' && (
              <p className="text-xs text-gray-600 mt-1">Contact admin to change your email</p>
            )}
          </div>
          <div>
            <Label>Role</Label>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                value={userInfo?.role || ''}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>
          {userInfo?.role === 'ADMIN' && (
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile || (name === userInfo?.name && email === userInfo?.email)}
            >
              <Save className="mr-2 h-4 w-4" />
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          )}
        </div>
      </Card>

      {/* Timezone Preferences */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Display Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="timezone">Preferred Timezone</Label>
            <Select
              value={selectedTimezone}
              onValueChange={setSelectedTimezone}
            >
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectGroup>
                  <SelectLabel>Common Timezones</SelectLabel>
                  {COMMON_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>All Timezones</SelectLabel>
                  {allTimezones
                    .filter(tz => !COMMON_TIMEZONES.some(common => common.value === tz))
                    .map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600 mt-1">
              All timestamps will be displayed in this timezone.
              <br />
              Current time in selected timezone: <strong>{currentTime}</strong>
            </p>
          </div>
          <Button
            onClick={handleSaveTimezone}
            disabled={savingTimezone || selectedTimezone === userInfo?.preferredTimezone}
          >
            <Save className="mr-2 h-4 w-4" />
            {savingTimezone ? 'Saving...' : 'Save Timezone Preferences'}
          </Button>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-600 mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={changingPassword}>
            <Lock className="mr-2 h-4 w-4" />
            {changingPassword ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </Card>

      {/* Account Actions - Only show for non-admin users */}
      {userInfo?.role !== 'ADMIN' && (
        <Card className="p-6 mb-6 border-red-200">
        <h2 className="text-xl font-bold mb-4 text-red-600">Danger Zone</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Reset Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              Permanently delete all your trading data. This action cannot be undone.
              Your account and login will remain active.
            </p>
            <Button
              variant="destructive"
              onClick={openResetModal}
            >
              Reset My Account
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && accountSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ WARNING: This action cannot be undone!</h2>
            <p className="mb-4">This will permanently delete:</p>
            <ul className="list-disc list-inside text-sm mb-4 space-y-1">
              <li><strong>{accountSummary.totalTrades}</strong> trades</li>
              <li><strong>{accountSummary.totalSummaries}</strong> daily summaries</li>
              <li><strong>{accountSummary.totalTargets}</strong> performance targets</li>
              <li><strong>{accountSummary.totalBadges}</strong> earned badges (achievements)</li>
              <li><strong>{accountSummary.totalNotifications}</strong> notifications</li>
              <li>All streaks (win, log, SOP)</li>
              <li>All user statistics</li>
            </ul>
            <p className="text-sm text-gray-600 mb-4">
              Your account and login will remain active. You can start fresh with new trades and earn badges again.
            </p>
            <div className="mb-4">
              <Label htmlFor="reset-confirmation">
                Type <strong>"RESET MY ACCOUNT"</strong> to confirm:
              </Label>
              <Input
                id="reset-confirmation"
                type="text"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="RESET MY ACCOUNT"
                className="mt-2 font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleResetAccount}
                disabled={resetting || resetConfirmation !== 'RESET MY ACCOUNT'}
                className="flex-1"
              >
                {resetting ? 'Resetting...' : 'Reset Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmation('');
                }}
                disabled={resetting}
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
