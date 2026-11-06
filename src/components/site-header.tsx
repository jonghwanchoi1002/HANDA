"use client";
import NavDropdown from "./nav-dropdown";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./site-header.module.css";
const menus = [["/#about","HANDA 소개"],["/members","멤버소개"],["/wiki","비즈니스 위키"],["/stories","정기모임 후기"],["/testimonials","Testimonial"]];
export default function SiteHeader({accountMenu}:{accountMenu:React.ReactNode}) {
  const path=usePathname();
  return <header className={styles.header} data-site-header>
    <div className={styles.inner}>
      <Link href="/" className={styles.logo} aria-label="HANDA 홈">HANDA<span>.</span><small>BERLIN FOUNDERS COMMUNITY</small></Link>
      <nav className={styles.nav} aria-label="주 메뉴">{menus.map(([href,label])=><Link key={href} href={href} aria-current={href!=="/#about" && (path===href||path.startsWith(href+"/"))?"page":undefined}>{label}</Link>)}<NavDropdown label="내 계정">{accountMenu}</NavDropdown></nav>
    </div>
  </header>;
}
