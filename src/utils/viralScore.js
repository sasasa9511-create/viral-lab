/**
 * محاسبه امتیاز وایرال شدن محتوا
 *
 * ورودی‌ها بین 0 تا 100 هستند.
 */
export function calculateViralScore({
  hook = 0,
  emotion = 0,
  novelty = 0,
  shareability = 0,
  relevance = 0
}) {
  const values = [
    Number(hook),
    Number(emotion),
    Number(novelty),
    Number(shareability),
    Number(relevance)
  ];

  const safeValues = values.map((value) =>
    Math.max(0, Math.min(100, value))
  );

  const score =
    safeValues[0] * 0.25 +
    safeValues[1] * 0.2 +
    safeValues[2] * 0.2 +
    safeValues[3] * 0.2 +
    safeValues[4] * 0.15;

  return Math.round(score);
}

export function getViralLevel(score) {
  const value = Number(score);

  if (value >= 90) {
    return {
      label: "فوق‌العاده وایرال",
      level: "excellent"
    };
  }

  if (value >= 75) {
    return {
      label: "پتانسیل وایرال بالا",
      level: "high"
    };
  }

  if (value >= 55) {
    return {
      label: "پتانسیل متوسط",
      level: "medium"
    };
  }

  return {
    label: "نیازمند بهبود",
    level: "low"
  };
}