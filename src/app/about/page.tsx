import type { Metadata } from "next";
import styles from "./about.module.css";
export const metadata:Metadata={title:"HANDA란? | HANDA"};
export default function AboutPage(){
  return <><p className={styles.eyebrow}>ABOUT HANDA</p><h1>HANDA란?</h1><section className={styles.panel}><h2>HANDA를 소개합니다.</h2><p>커뮤니티 소개 내용을 준비하고 있습니다.</p></section></>;
}
