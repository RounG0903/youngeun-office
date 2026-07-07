type UserAvatarProps = {
  name: string;
  size?: "sm" | "md";
  className?: string;
};

export function UserAvatar({ name, size = "sm", className = "" }: UserAvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    <span
      className={`user-avatar user-avatar-${size} ${className}`.trim()}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
