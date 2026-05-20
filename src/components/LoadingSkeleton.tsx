import type { CSSProperties } from "react";

interface Props {
  width?: string;
  height?: string;
  borderRadius?: string;
  count?: number;
  style?: CSSProperties;
}

export default function LoadingSkeleton({ width = "100%", height = "16px", borderRadius = "6px", count = 1, style }: Props) {
  const items = Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton" style={{ width, height, borderRadius, marginBottom: count > 1 ? "10px" : 0, ...style }} />
  ));
  return <div role="status" aria-label="লোড হচ্ছে">{items}</div>;
}

export function PageSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      <LoadingSkeleton height="32px" width="60%" count={1} style={{ marginBottom: 20 }} />
      <LoadingSkeleton height="14px" count={3} />
      <div style={{ height: 16 }} />
      <LoadingSkeleton height="120px" borderRadius="12px" count={1} style={{ marginBottom: 12 }} />
      <LoadingSkeleton height="80px" borderRadius="12px" count={2} />
    </div>
  );
}
