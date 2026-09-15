"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isActiveRoute, MOBILE_MORE_ITEMS, MOBILE_PRIMARY_ITEMS } from "./navigation";
import styles from "./MobileNav.module.css";

export default function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") setMoreOpen(false);
      if (event instanceof PointerEvent && root.current && !root.current.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, []);
  const moreActive = MOBILE_MORE_ITEMS.some((item) => isActiveRoute(pathname, item.href));
  return <nav ref={root} className={styles.nav} aria-label="Navegação mobile">
    <div className={styles.morePanel} hidden={!moreOpen} role="menu" aria-label="Mais destinos">
      {MOBILE_MORE_ITEMS.map((item) => { const Icon = item.icon; return <Link role="menuitem" href={item.href} key={item.id} onClick={() => setMoreOpen(false)}><Icon size={17} /><span>{item.label}</span></Link>; })}
    </div>
    {MOBILE_PRIMARY_ITEMS.map((item) => { const Icon = item.icon; return <Link href={item.href} key={item.id} aria-current={isActiveRoute(pathname, item.href) ? "page" : undefined}><Icon size={18} /><span>{item.label}</span></Link>; })}
    <button type="button" aria-label="Mais destinos" aria-current={moreActive ? "page" : undefined} aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}><MoreHorizontal size={19} /><span>Mais</span></button>
  </nav>;
}
