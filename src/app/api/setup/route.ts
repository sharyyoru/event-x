import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 })
  }

  // Use service role key for admin operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Create test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: 'wilson@mutant.ae',
      password: 'wilsontest',
      email_confirm: true,
      user_metadata: {
        full_name: 'Wilson Test'
      }
    })

    if (userError) {
      // User might already exist
      if (userError.message.includes('already')) {
        return NextResponse.json({ message: 'User already exists', email: 'wilson@mutant.ae' })
      }
      throw userError
    }

    return NextResponse.json({ 
      message: 'Test user created successfully',
      email: 'wilson@mutant.ae',
      userId: user.user?.id
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to this endpoint to create test user',
    testUser: {
      email: 'wilson@mutant.ae',
      password: 'wilsontest'
    }
  })
}
