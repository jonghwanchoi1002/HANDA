import type { Metadata } from "next";
import styles from "../about.module.css";
export const metadata:Metadata={title:"운영 방식 및 참여 안내 | HANDA"};
export default function GuidePage(){
  return <><p className={styles.eyebrow}>HOW HANDA WORKS</p><h1>운영 방식 및 참여 안내</h1><section className={styles.panel}><h2>함께하는 방법을 안내해 드릴게요.</h2><p>운영 방식과 참여 안내 내용을 준비하고 있습니다.</p></section></>;
}
