"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "./navigation";
import styles from "./MobileNav.module.css";

export default function MobileNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => {
    const update = () => setHash(window.location.hash.replace("#", ""));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const active = pathname === "/" ? hash || "overview" : NAV_ITEMS.find((item) => item.route === pathname)?.id;
  return <nav className={styles.nav} aria-label="Navegação principal">
    {NAV_ITEMS.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.id} aria-current={active === item.id ? "page" : undefined}><Icon size={16} /><span>{item.label}</span></Link>; })}
  </nav>;
}
