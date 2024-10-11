import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@11.11.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === 'POST') {
    try {
      const data = await req.json()
      const { record  } = data
      console.log('email' ,record.user_id, data)
      console.log('referralCode', record.referral_code)
      if (!record.user_id) {
        return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 })
      }

      // Fetch user email from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(record.user_id)

      if (userError || !user) {
        throw new Error('Failed to fetch user data')
      }

      console.log('user', user)

      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { tolt_referral: record.referral_code || '' },
      })
      console.log('customer created!', customer )
      return new Response(JSON.stringify({ customerId: customer.id }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
})
