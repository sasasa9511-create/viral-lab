import supabase from "../lib/supabase";
/**
 * دریافت ایده‌های محتوایی
 */
export async function getContentIdeas(userId = null) {
  if (!supabase) {
    return [];
  }
  let query = supabase
    .from("content_ideas")
    .select("*")
    .order("created_at", {
      ascending: false
    });
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { data, error } = await query;
  if (error) {
    console.error("getContentIdeas:", error);
    throw error;
  }
  return data ?? [];
}
/**
 * ایجاد ایده جدید
 */
export async function createContentIdea({
  userId = null,
  title,
  description = "",
  platform = "instagram",
  score = 0,
  status = "draft"
}) {
  if (!supabase) {
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      description,
      platform,
      score,
      status,
      created_at: new Date().toISOString()
    };
  }
  const { data, error } = await supabase
    .from("content_ideas")
    .insert({
      user_id: userId,
      title,
      description,
      platform,
      score,
      status
    })
    .select()
    .single();
  if (error) {
    console.error("createContentIdea:", error);
    throw error;
  }
  return data;
}
/**
 * حذف ایده
 */
export async function deleteContentIdea(id) {
  if (!supabase) {
    return true;
  }
  const { error } = await supabase
    .from("content_ideas")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("deleteContentIdea:", error);
    throw error;
  }
  return true;
}