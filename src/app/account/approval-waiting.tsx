import styles from "@/app/login/auth.module.css";
export default function ApprovalWaiting(){
  return <p role="status" className={styles.intro}>이용 승인 요청 중입니다.</p>;
}
