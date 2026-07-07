export const AUDIT_ACTION_LABELS: Record<string, string> = {
  "user.delete": "회원 삭제",
  "user.apply_penalty": "패널티 적용",
  "user.clear_penalty": "패널티 해제",
  "user.toggle_checkin": "체크인 설정 변경",
  "room.create": "회의실 추가",
  "room.update": "회의실 수정",
  "room.delete": "회의실 삭제",
  "reservation.create": "예약 추가",
  "reservation.cancel": "예약 취소",
  "tablet.create": "태블릿 계정 생성",
  "tablet.delete": "태블릿 계정 삭제",
  "tablet.update_pin": "태블릿 PIN 변경",
  "settings.update_checkin": "체크인 설정 변경",
  "admin.update_pin": "관리자 PIN 변경",
  "role.grant_sub_admin": "부관리자 부여",
  "role.revoke_sub_admin": "부관리자 회수",
  "database.create": "DB 레코드 생성",
  "database.update": "DB 레코드 수정",
  "database.delete": "DB 레코드 삭제",
};

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}
