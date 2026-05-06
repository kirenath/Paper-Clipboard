import { Suspense } from "react"
import { LoginCard } from "@/components/login-card"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  )
}
