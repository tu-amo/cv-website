'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateDisplayName(formData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const displayName = (formData.get('display_name') || '').trim()
    if (!displayName) redirect('/profile?error=Name cannot be empty')

    const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, display_name: displayName })

    if (error) redirect(`/profile?error=${encodeURIComponent(error.message)}`)

    revalidatePath('/', 'layout')
    redirect('/profile?success=Name updated')
}

export async function updateEmail(formData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const newEmail = (formData.get('email') || '').trim()
    if (!newEmail) redirect('/profile?error=Email cannot be empty')

    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) redirect(`/profile?error=${encodeURIComponent(error.message)}`)

    // Supabase sends a confirmation to the new email before switching
    redirect('/profile?success=Check your new email inbox to confirm the change')
}

export async function updateUnitSystem(formData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const unit_system = formData.get('unit_system')
    const valid = ['metric', 'uk_imperial', 'us_imperial']
    if (!valid.includes(unit_system)) {
        redirect('/profile?error=Invalid unit system selection')
    }

    const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, unit_system })

    if (error) redirect(`/profile?error=${encodeURIComponent(error.message)}`)

    revalidatePath('/', 'layout')
    redirect('/profile?success=Measurement preference updated')
}

