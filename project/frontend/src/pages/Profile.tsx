import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Lock, Loader2, CheckCircle2 } from 'lucide-react'
import { useUIStore, useAuthStore } from '@/store'
import { profileSchema, changePasswordSchema, type ProfileFormData, type ChangePasswordFormData } from '@/lib/validators'
import { getPasswordStrength, getAvatarGradient, getInitials } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

export default function Profile() {
  const { setPageTitle, setBreadcrumbs } = useUIStore()
  const { user, updateUser } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => {
    setPageTitle('Profile & Settings')
    setBreadcrumbs([])
  }, [setPageTitle, setBreadcrumbs])

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
  })

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPassword = passwordForm.watch('newPassword', '')
  const strength = getPasswordStrength(newPassword)

  const onProfileSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    updateUser({ name: data.name, email: data.email })
    toast.success('Profile updated')
    setSaving(false)
  }

  const onPasswordSubmit = async (_data: ChangePasswordFormData) => {
    setChangingPw(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success('Password changed successfully')
    passwordForm.reset()
    setChangingPw(false)
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Avatar Card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: getAvatarGradient(user.name) }}
          >
            {getInitials(user.name)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize">{user.role}</Badge>
              <span className="text-xs text-slate-400">Member since {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="w-4 h-4" /> Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...profileForm.register('name')} className={profileForm.formState.errors.name ? 'border-red-500' : ''} />
                  {profileForm.formState.errors.name && <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" {...profileForm.register('email')} className={profileForm.formState.errors.email ? 'border-red-500' : ''} />
                  {profileForm.formState.errors.email && <p className="text-xs text-red-500">{profileForm.formState.errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && <p className="text-xs text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && <p className="text-xs text-red-500">{passwordForm.formState.errors.newPassword.message}</p>}
                  {newPassword.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((s) => (
                          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= strength.score ? strength.color : 'bg-slate-200'}`} />
                        ))}
                      </div>
                      <p className={`text-xs ${strength.score <= 2 ? 'text-orange-500' : 'text-emerald-600'}`}>{strength.label}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" disabled={changingPw}>
                  {changingPw ? <><Loader2 className="w-4 h-4 animate-spin" /> Changing...</> : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
