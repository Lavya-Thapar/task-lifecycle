export const calculatePriorityFromDueDate = (dueDate) => {
  const now = new Date();
  const diffInMs = new Date(dueDate) - now;
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 24) return "High";
  if (diffInHours <= 72) return "Medium";
  return "Low";
};