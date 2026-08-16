const PREFIX = "virallab:";

export function saveLocal(key, value) {
  try {
    localStorage.setItem(
      `${PREFIX}${key}`,
      JSON.stringify(value)
    );

    return true;
  } catch (error) {
    console.error("saveLocal:", error);
    return false;
  }
}

export function getLocal(key, fallback = null) {
  try {
    const value = localStorage.getItem(
      `${PREFIX}${key}`
    );

    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("getLocal:", error);
    return fallback;
  }
}

export function removeLocal(key) {
  try {
    localStorage.removeItem(`${PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error("removeLocal:", error);
    return false;
  }
}

export function clearViralLabStorage() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));

    return true;
  } catch (error) {
    console.error("clearViralLabStorage:", error);
    return false;
  }
}