import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

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

// Admin client dùng service role key để bypass RLS (chỉ dùng phía server)
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

// Anon client dùng để xác thực session token của người gọi API
function getSupabaseAnon(authHeader: string | null) {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        authHeader ? { global: { headers: { Authorization: authHeader } } } : undefined
    );
}

export async function POST(req: Request) {
    try {
        // ✅ SECURITY FIX #5 (Rate Limiting): Giới hạn 5 lần tạo payment link / IP / phút
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const rateLimit = checkRateLimit(`payment:${ip}`, { limit: 5, windowMs: 60 * 1000 });
        if (!rateLimit.success) {
            return NextResponse.json(
                { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) }
                }
            );
        }

        // ✅ SECURITY FIX #3 (IDOR): Không nhận userId từ body mà xác thực từ JWT session
        // Điều này ngăn attacker giả mạo userId của người dùng khác.
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
        }

        const supabaseAnon = getSupabaseAnon(authHeader);
        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized: invalid session' }, { status: 401 });
        }

        const userId = user.id; // ✅ userId an toàn, lấy từ server-side JWT, không phải từ body

        // ✅ SECURITY FIX #4 (Bruteforce): Dùng UUID ngẫu nhiên thay vì timestamp 6 số
        // Làm cho pending_order_code không thể bị đoán hoặc bruteforce.
        const pendingOrderCode = crypto.randomUUID();

        // Đồng thời tạo một numeric orderCode nhỏ cho PayOS (yêu cầu là số)
        const orderCode = Number(String(Date.now()).slice(-8));

        // Lưu pendingOrderCode (UUID) vào profile để webhook đối chiếu
        const supabaseAdmin = getSupabaseAdmin();
        const { error: dbError } = await supabaseAdmin
            .from('profiles')
            .update({ pending_order_code: pendingOrderCode })
            .eq('id', userId);

        if (dbError) {
            console.error('Database error storing pending order code:', dbError);
            return NextResponse.json({ error: 'Failed to initialize order in database' }, { status: 500 });
        }

        // The URL the user will be redirected to after paying (or cancelling)
        const domain = req.headers.get('origin') || 'http://localhost:3000';

        const body = {
            orderCode: orderCode,
            amount: 199000, // 199,000 VND for Lifetime Premium
            description: "Nang cap Premium",
            returnUrl: `${domain}?premium=success&ref=${pendingOrderCode}`,
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
