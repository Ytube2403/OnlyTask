import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo PayOS. Do lỗi build của Next.js với file CJS, module trả về một object có key 'PayOS'
const payosModule = require('@payos/node');
const PayOS = payosModule.PayOS || payosModule.default || payosModule;

export const dynamic = 'force-dynamic';

let payosClient: any = null;
function getPayOS() {
    if (!payosClient) {
        payosClient = new PayOS(
            process.env.PAYOS_CLIENT_ID || 'dummy_client_id_for_build',
            process.env.PAYOS_API_KEY || 'dummy_api_key_for_build',
            process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key_for_build'
        );
    }
    return payosClient;
}

// We need the service role key to bypass RLS when updating the user's premium status via webhook
let supabaseAdminClient: any = null;
function getSupabaseAdmin() {
    if (!supabaseAdminClient) {
        supabaseAdminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
            process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'
        );
    }
    return supabaseAdminClient;
}

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Generate a unique 6-digit order code using timestamp
        const orderCode = Number(String(Date.now()).slice(-6));

        // Save this pending order code to the user's profile so the webhook knows who paid
        const supabaseAdmin = getSupabaseAdmin();
        const { error: dbError } = await supabaseAdmin
            .from('profiles')
            .update({ pending_order_code: orderCode })
            .eq('id', userId);

        if (dbError) {
            console.error('Database error storing pending order code:', dbError);
            return NextResponse.json({ error: 'Failed to initialize order in database' }, { status: 500 });
        }

        // The URL the user will be redirected to after paying (or cancelling)
        // We try to get it from the request origin, or default to localhost
        const domain = req.headers.get('origin') || 'http://localhost:3000';

        const body = {
            orderCode: orderCode, // Unique order code
            amount: 199000, // E.g., 199,000 VND for Lifetime Premium
            description: "Nang cap Premium",
            returnUrl: `${domain}?premium=success`,
            cancelUrl: `${domain}?premium=cancel`,
        };

        // Create payment link via PayOS
        const payos = getPayOS();
        const paymentLinkRes = await payos.createPaymentLink(body);

        return NextResponse.json({
            checkoutUrl: paymentLinkRes.checkoutUrl
        });

    } catch (error: any) {
        console.error('Error creating payment link:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
