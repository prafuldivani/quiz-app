"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin layout with navigation
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navLinks = [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/quizzes", label: "Quizzes", exact: false },
  ];

  const isActive = (link: { href: string; exact: boolean }) => {
    if (link.exact) return pathname === link.href;
    return pathname.startsWith(link.href);
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-xl font-bold tracking-tight">
              QuizApp
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link) ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0)}
                  </div>
                  <span className="hidden md:inline max-w-[120px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium truncate">{session.user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="sm:hidden border-b">
        <div className="w-full max-w-6xl mx-auto px-6 py-2 flex gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex-1">
              <Button
                variant={isActive(link) ? "secondary" : "ghost"}
                size="sm"
                className="w-full h-9"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="w-full max-w-6xl mx-auto px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
