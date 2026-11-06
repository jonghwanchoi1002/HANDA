"use client";
import NavDropdown from "./nav-dropdown";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./site-header.module.css";
const menus = [["/#top","HANDA 소개"],["/members","멤버 소개"],["/wiki","비즈니스 위키"],["/stories","정기모임 후기"],["/testimonials","Testimonial"]];
export default function SiteHeader({accountMenu}:{accountMenu:React.ReactNode}) {
  const path=usePathname();
  return <header className={styles.header} data-site-header>
    <div className={styles.inner}>
      <Link href="/" className={styles.logo} aria-label="HANDA 홈"><Image src="/brand/handa-logo-cream.svg" alt="HANDA · Berlin Founders Community" width={200} height={52} priority/></Link>
      <nav className={styles.nav} aria-label="주 메뉴">{menus.map(([href,label])=><Link key={href} href={href} onClick={event=>{
        if(href==="/#top"&&path==="/"&&!event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){
          event.preventDefault();
          window.history.replaceState(null,"","/#top");
          window.scrollTo({top:0,behavior:"instant"});
        }
      }} aria-current={(href==="/#top"?path==="/":path===href||path.startsWith(href+"/"))?"page":undefined}>{label}</Link>)}<NavDropdown label="내 계정">{accountMenu}</NavDropdown></nav>
    </div>
  </header>;
}
