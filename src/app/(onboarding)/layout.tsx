import { AuroraBackground } from "@/components/layout/AuroraBackground"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AuroraBackground />
      <div className="relative z-10">{children}</div>
    </>
  )
}
