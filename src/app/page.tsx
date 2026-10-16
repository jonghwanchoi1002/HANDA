import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label="HANDA 홈">HANDA<span>✳</span></Link>
        <a className={styles.nav} href="#about">HANDA 소개 ↗</a>
      </header>
      <main>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>작은 시작, 새로운 가능성</p>
          <h1>생각을 넘어,<br />이제 <span>한다.</span></h1>
          <p className={styles.description}>아이디어가 첫걸음이 되는 곳.<br />HANDA의 이야기를 이곳에서 시작합니다.</p>
          <a className={styles.button} href="#about">HANDA 알아보기 <span>↓</span></a>
          <div className={styles.note}>HELLO, WORLD. THIS IS HANDA.</div>
        </section>
        <section id="about" className={styles.about}>
          <p className={styles.eyebrow}>ABOUT HANDA</p>
          <h2>하나씩 만들어 갑니다.</h2>
          <p>지금은 HANDA의 첫 페이지입니다. 앞으로 이 공간에 서비스와 이야기를 차근차근 담아갈 예정입니다.</p>
          <div className={styles.cards}>
            <article><span>01 / 시작</span><h3>우리만의 공간</h3><p>HANDA를 소개하는 홈페이지의 첫걸음입니다.</p></article>
            <article><span>02 / 다음</span><h3>함께 쌓는 이야기</h3><p>새로운 소식과 기능을 하나씩 준비하겠습니다.</p></article>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>© 2026 HANDA <span>하나씩, 꾸준히.</span></footer>
    </div>
  );
}
