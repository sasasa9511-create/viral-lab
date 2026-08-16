import supabase from "../lib/supabase";

/**
 * دریافت آمار کلی داشبورد
 */
export async function getDashboardStats(userId = null) {
  const fallbackStats = {
    totalContent: 0,
    viralContent: 0,
    averageScore: 0,
    totalViews: 0
  };

  if (!supabase) {
    return fallbackStats;
  }

  let query = supabase
    .from("content_analytics")
    .select("*");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getDashboardStats:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return fallbackStats;
  }

  const totalContent = data.length;

  const viralContent = data.filter(
    (item) => Number(item.viral_score ?? 0) >= 80
  ).length;

  const totalScore = data.reduce(
    (sum, item) => sum + Number(item.viral_score ?? 0),
    0
  );

  const totalViews = data.reduce(
    (sum, item) => sum + Number(item.views ?? 0),
    0
  );

  return {
    totalContent,
    viralContent,
    averageScore:
      totalContent > 0
        ? Math.round(totalScore / totalContent)
        : 0,
    totalViews
  };
}