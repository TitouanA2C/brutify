import { cn } from "@/lib/utils";

interface GoldTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
}

export function GoldText({ children, className, as: Tag = "span" }: GoldTextProps) {
  return (
    <Tag
      className={cn("text-gold-gradient", className)}
    >
      {children}
    </Tag>
  );
}
