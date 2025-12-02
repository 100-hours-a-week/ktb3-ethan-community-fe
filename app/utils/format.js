export function formatDate(value) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 19).replace("T", " ");
}


export const getInfoOrDefault = (info) => info ?? "불러오는 중...";
export const getProfileImageOrDefault = (user) => (user?.profileImageUrl ?? "/images/profile_placeholder.svg");
