import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1509223197845-458d87318791?w=1200&h=1260&fit=crop";
const BRAND_GREEN = "#16a34a";
const BRAND_DARK = "#0a3d2e";
const TEXT_WHITE = "#ffffff";
const TEXT_MUTED = "#d1fae5";

function truncate(s: string, max: number): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "plant";
    const slug = url.searchParams.get("slug");
    if (!slug) return new Response("Missing slug parameter", { status: 400 });

    let title = "Flora Medical Global";
    let subtitle = "";
    let imageUrl = FALLBACK_IMAGE;
    let badge = "Medicinal Plant";

    if (type === "plant") {
      const { data } = await supabase.from("plants")
        .select("name_en, scientific_name, thumbnail_url, images, category, family")
        .eq("slug", slug).maybeSingle();
      if (data) {
        title = data.name_en || "Plant";
        subtitle = data.scientific_name || data.family || "";
        imageUrl = data.thumbnail_url || (Array.isArray(data.images) && data.images[0]) || FALLBACK_IMAGE;
        badge = data.category === "indoor" ? "Indoor Plant" : data.category === "garden" ? "Garden Plant" : data.category === "both" ? "Indoor & Garden" : "Medicinal Plant";
      }
    } else if (type === "blog") {
      const { data } = await supabase.from("blog_posts")
        .select("title_en, excerpt_en, cover_image, social_media_image, category")
        .eq("slug", slug).maybeSingle();
      if (data) {
        title = data.title_en || "Blog Post";
        subtitle = data.excerpt_en ? truncate(data.excerpt_en, 80) : "";
        imageUrl = data.social_media_image || data.cover_image || FALLBACK_IMAGE;
        badge = data.category || "Blog";
      }
    }

    title = truncate(title, 60);
    subtitle = truncate(subtitle, 80);

    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "1200px", height: "630px", backgroundColor: BRAND_DARK }}>
          <div style={{ display: "flex", width: "720px", height: "630px", position: "relative", overflow: "hidden" }}>
            <img src={imageUrl} width={720} height={630} style={{ width: "720px", height: "630px", objectFit: "cover" }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "630px", background: `linear-gradient(to right, transparent, ${BRAND_DARK})` }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", width: "480px", height: "630px", padding: "60px 50px", justifyContent: "space-between", backgroundColor: BRAND_DARK }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", backgroundColor: BRAND_GREEN, borderRadius: "10px", fontSize: "26px" }}>🌿</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: TEXT_WHITE, fontSize: "20px", fontWeight: 700, lineHeight: 1.1 }}>Flora Medical</span>
                <span style={{ color: TEXT_MUTED, fontSize: "14px", fontWeight: 400, lineHeight: 1.1 }}>Global Encyclopedia</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignSelf: "flex-start", padding: "6px 14px", backgroundColor: BRAND_GREEN, color: TEXT_WHITE, fontSize: "14px", fontWeight: 600, borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{badge}</div>
              <div style={{ display: "flex", color: TEXT_WHITE, fontSize: title.length > 30 ? "44px" : "52px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1px" }}>{title}</div>
              {subtitle && (
                <div style={{ display: "flex", color: TEXT_MUTED, fontSize: "20px", fontWeight: 400, fontStyle: type === "plant" ? "italic" : "normal", lineHeight: 1.3 }}>{subtitle}</div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: TEXT_MUTED, fontSize: "16px", fontWeight: 500, paddingTop: "16px", borderTop: `1px solid ${BRAND_GREEN}` }}>floramedicalglobal.com</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    return new Response(`Failed: ${(error as Error).message}`, { status: 500 });
  }
}
