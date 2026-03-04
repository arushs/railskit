import { useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      const { ok } = await api.put("/api/auth/profile", {
        user: { name, avatar_url: avatarUrl || null },
      });
      if (ok) {
        updateUser({ name, avatar_url: avatarUrl || null });
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const { ok, data } = await api.put<{ error?: string }>("/api/auth/password", {
        user: { current_password: currentPassword, password: newPassword },
      });
      if (ok) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(data.error || "Failed to update password");
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardHeader className="p-6">
          <CardTitle className="text-zinc-900 dark:text-white">Profile</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar src={avatarUrl || null} fallback={name || user?.email || "U"} size="lg" />
              <div className="flex-1">
                <Label htmlFor="avatar_url">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatarUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-name">Display Name</Label>
              <Input
                id="settings-name"
                placeholder="Your name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" type="email" value={user?.email || ""} disabled />
              <p className="text-xs text-zinc-400">Contact support to change your email.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={profileSaving}>
                {profileSaving ? "Saving\u2026" : "Save Changes"}
              </Button>
              {profileSuccess && (
                <span className="text-sm text-emerald-500">Profile updated!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardHeader className="p-6">
          <CardTitle className="text-zinc-900 dark:text-white">Change Password</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={passwordSaving}>
                {passwordSaving ? "Updating\u2026" : "Update Password"}
              </Button>
              {passwordSuccess && (
                <span className="text-sm text-emerald-500">Password updated!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
