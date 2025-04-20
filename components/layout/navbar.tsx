"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";

export function Navbar(){

    const {data: session} = useSession();

    const router = useRouter()
    const pathname = usePathname()

    const isAuthPage = pathname === "/login" || pathname === "/register"

    if(isAuthPage){
        return;
    }

    return (
        <header className="w-full border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <link href="/" className="flex items-center gap-2">
        <span className="text-xl font-bold"> MovieRecs</span></link>
        <nav className="ml-auto flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:underline">
            Home
          </Link>
          <Link href="/movies" className="text-sm font-medium hover:underline">
            Movies
          </Link>
          {session ? (
            <>
            <Link href="/recommendations" className="text-sm font-medium hover:underline">
              Recommendations
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.user.name || session.user.email}
              </span>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/" })}
                size="sm"
              >
                Logout
              </Button>
            </div>
          </>):
          (
            <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              size="sm"
            >
              Login
            </Button>
            <Button onClick={() => router.push("/register")} size="sm">
              Register
            </Button>
          </div>
          )}
          </nav>
        </div>
        </header>
    )
}