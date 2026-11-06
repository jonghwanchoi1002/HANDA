"use client";
import NavDropdown from "./nav-dropdown";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./site-header.module.css";
const menus = [["/members","멤버 소개"],["/wiki","비즈니스 위키"],["/stories","정기모임 후기"],["/testimonials","Testimonial"]];
const introductionMenus = [["/about","HANDA란?"],["/about/guide","운영 방식 및 참여 안내"],["/about/join","참여 신청하기"]];
export default function SiteHeader({accountMenu}:{accountMenu:React.ReactNode}) {
  const path=usePathname();
  return <header className={styles.header} data-site-header>
    <div className={styles.inner}>
      <Link href="/#top" className={styles.logo} aria-label="HANDA 홈" onClick={event=>{
        if(path==="/"&&!event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){
          event.preventDefault();
          window.history.replaceState(null,"","/#top");
          window.scrollTo({top:0,behavior:"instant"});
        }
      }}><Image src="/brand/handa-logo-cream.svg" alt="HANDA · Berlin Founders Community" width={200} height={52} priority/></Link>
      <nav className={styles.nav} aria-label="주 메뉴">
        <NavDropdown label="HANDA 소개" active={path==="/about"||path.startsWith("/about/")}>{introductionMenus.map(([href,label])=><Link key={href} href={href} aria-current={path===href?"page":undefined}>{label}</Link>)}</NavDropdown>
        {menus.map(([href,label])=><Link key={href} href={href} aria-current={path===href||path.startsWith(href+"/")?"page":undefined}>{label}</Link>)}
        <NavDropdown label="내 계정">{accountMenu}</NavDropdown>
      </nav>
    </div>
  </header>;
}
