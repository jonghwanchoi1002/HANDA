import { ContentText } from "@/components/rich-text";
import type { ContentMap } from "@/lib/content/schema";
import JoinAction from "./join/join-action";
import styles from "./about.module.css";
const recruitmentFormUrl="https://forms.gle/SXXxb8321efoPFta8";
export default function PageContent({page,eyebrow}:{page:ContentMap["page"];eyebrow:string}){
  return <><p className={styles.eyebrow}>{eyebrow}</p><h1><ContentText content={page} field="title" inline/></h1>
    <section className={styles.panel}><h2><ContentText content={page} field="heading" inline/></h2><ContentText content={page} field="body"/></section>
    <div className={styles.application}>{page.slug==="join"?<JoinAction label={page.ctaLabel} formUrl={recruitmentFormUrl}/>:<a className={styles.button} href={page.ctaUrl} target="_blank" rel="noopener noreferrer">{page.ctaLabel}</a>}</div>
    {(page.secondaryHeading||page.secondaryBody)&&<section className={`${styles.panel} ${styles.sage}`}><h2><ContentText content={page} field="secondaryHeading" inline/></h2><ContentText content={page} field="secondaryBody"/>{page.slug==="join"&&<a className={`${styles.button} ${styles.secondary}`} href={recruitmentFormUrl} target="_blank" rel="noopener noreferrer">다음 모집 안내받기</a>}</section>}
  </>;
}
