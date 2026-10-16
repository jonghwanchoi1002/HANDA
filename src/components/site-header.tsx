import Link from "next/link";
import AccountNav from "./account-nav";
import styles from "@/app/page.module.css";

const menus = [
  ["/#about", "HANDA 소개"], ["/members", "멤버"], ["/wiki", "비즈니스 위키"],
  ["/stories", "모임 후기"], ["/testimonials", "참가자 이야기"],
];

export default function SiteHeader({ active }: { active?: string }) {
  return <header className={styles.header}>
    <Link className={styles.logo} href="/" aria-label="HANDA 홈">HANDA<span>.</span><small>BERLIN FOUNDERS COMMUNITY</small></Link>
    <nav aria-label="주 메뉴" className={styles.nav}>
      {menus.map(([href, label]) => <Link key={href} href={href} aria-current={active === href ? "page" : undefined}>{label}</Link>)}
      <AccountNav />
    </nav>
  </header>;
}
