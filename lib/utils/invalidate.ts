import { useEffect } from "react";

export function invalidate(table: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(`planner:${table}`));
  }
}

export function useInvalidation(table: string, refetch: () => void) {
  useEffect(() => {
    window.addEventListener(`planner:${table}`, refetch);
    return () => window.removeEventListener(`planner:${table}`, refetch);
  }, [table, refetch]);
}
