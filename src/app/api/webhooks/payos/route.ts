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
            process.env.PAYOS_CLIENT_ID || '123', // Dummy default to prevent crash on boot before keys exist
            process.env.PAYOS_API_KEY || '123',
            process.env.PAYOS_CHECKSUM_KEY || '123'
        );
    }
    return payosClient;
}

// We need the service role key to bypass RLS to update the profile from the Backend
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
        const body = await req.json();

        // Verify the Webhook signature to ensure it actually came from PayOS
        const payos = getPayOS();
        const webhookData = payos.verifyPaymentWebhookData(body);

        if (webhookData.code === "00") {
            // Payment was successful
            const orderCode = webhookData.orderCode;

            console.log(`Payment successful for order code: ${orderCode}`);

            // 1. Find the user with this pending order code
            // 2. Set them to premium
            // 3. Clear the pending order code

            const supabaseAdmin = getSupabaseAdmin();
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({
                    is_premium: true,
                    premium_updated_at: new Date().toISOString(),
                    pending_order_code: null
                })
                .eq('pending_order_code', orderCode);

            if (error) {
                console.error('Error updating premium status in database:', error);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, message: "Payment not completed" });

    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 400 });
    }
}
