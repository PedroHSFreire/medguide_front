"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Calendar, HelpCircle, LayoutDashboard, User } from "lucide-react";
import { useAuth } from "../../app/lib/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof User;
};

const PATIENT_ITEMS: NavItem[] = [
  { href: "/pacient/dashboard", label: "Painel", icon: LayoutDashboard },
  { href: "/pacient/profile", label: "Perfil", icon: User },
  { href: "/doubts", label: "Dúvidas", icon: HelpCircle },
];

const DOCTOR_ITEMS: NavItem[] = [
  { href: "/doctor/dashboard", label: "Agenda", icon: Calendar },
  { href: "/doctor/profile", label: "Perfil", icon: User },
  { href: "/doubts", label: "Dúvidas", icon: HelpCircle },
];

type NavRole = "pacient" | "doctor" | null;

const HIDDEN_PATHS = new Set([
  "/",
  "/pacient/login",
  "/pacient/register",
  "/doctor/login",
  "/doctor/register",
]);

function resolveRole(
  pathname: string,
  isPatientAuth: boolean,
  isDoctorAuth: boolean
): NavRole {
  if (HIDDEN_PATHS.has(pathname)) {
    return null;
  }

  if (pathname.startsWith("/pacient/")) {
    return isPatientAuth ? "pacient" : null;
  }

  if (pathname.startsWith("/doctor/")) {
    return isDoctorAuth ? "doctor" : null;
  }

  if (pathname === "/doubts") {
    if (isPatientAuth) return "pacient";
    if (isDoctorAuth) return "doctor";
  }

  return null;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/doubts") {
    return pathname === "/doubts";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { status: sessionStatus } = useSession();

  const isPatientAuth = isAuthenticated && user?.role === "pacient";
  const isDoctorAuth =
    sessionStatus === "authenticated" ||
    (isAuthenticated && user?.role === "doctor");

  if (authLoading || sessionStatus === "loading") {
    return null;
  }

  const role = resolveRole(pathname, isPatientAuth, isDoctorAuth);
  if (!role) {
    return null;
  }

  const items = role === "pacient" ? PATIENT_ITEMS : DOCTOR_ITEMS;

  return (
    <>
      <div
        className="h-16 md:hidden pb-safe"
        aria-hidden="true"
      />
      <nav
        className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-gray-200 bg-white pb-safe"
        aria-label="Navegação principal"
      >
        <ul className="flex h-16 items-stretch justify-around">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isItemActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                    active
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
