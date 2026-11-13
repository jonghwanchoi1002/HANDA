import { memberWebsiteLabel, type MemberWebsiteLink } from "@/lib/content/member-websites";
import styles from "@/app/members/members.module.css";

export default function MemberWebsiteLinks({ links }: { links: MemberWebsiteLink[] }) {
  return links.length ? <ul className={styles.websites}>{links.map((link, index) => <li key={`${index}-${link.url}`}><a className={styles.back} href={link.url} target="_blank" rel="noopener noreferrer">{memberWebsiteLabel(link)} <span aria-hidden="true">↗</span></a></li>)}</ul> : <p>아직 등록된 웹사이트가 없습니다.</p>;
}
