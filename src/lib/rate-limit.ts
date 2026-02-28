/**
 * SECURITY FIX #5: Simple In-Memory Rate Limiter
 *
 * Giới hạn số lượng request từ cùng một IP address để ngăn chặn:
 * - DoS (Denial of Service) attack
 * - Brute force attack
 * - Cạn kiệt free tier quota của PayOS và Supabase
 *
 * Lưu ý: In-memory store sẽ reset khi server restart.
 * Để production scale (nhiều server), dùng Redis/Upstash.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Map lưu số lần request theo key (IP + endpoint)
const store = new Map<string, RateLimitEntry>();

// Dọn dẹp các entry đã hết hạn mỗi 5 phút
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitOptions {
    /** Số request tối đa trong khoảng `windowMs` */
    limit: number;
    /** Khoảng thời gian tính (milliseconds) */
    windowMs: number;
}

interface RateLimitResult {
    success: boolean;
    /** Số request còn lại trong window hiện tại */
    remaining: number;
    /** Thời gian (ms epoch) khi window sẽ reset */
    resetAt: number;
}

/**
 * Kiểm tra rate limit cho một key (thường là IP + endpoint)
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
        // Window mới: tạo entry mới
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + options.windowMs,
        };
        store.set(key, newEntry);
        return {
            success: true,
            remaining: options.limit - 1,
            resetAt: newEntry.resetAt,
        };
    }

    if (entry.count >= options.limit) {
        // Đã vượt quá giới hạn
        return {
            success: false,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    // Tăng đếm và tiếp tục
    entry.count += 1;
    return {
        success: true,
        remaining: options.limit - entry.count,
        resetAt: entry.resetAt,
    };
}
