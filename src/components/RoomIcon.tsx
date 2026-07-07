type RoomIconProps = {
  color: string;
  size?: number;
  className?: string;
};

export function RoomIcon({ color, size = 12, className = "" }: RoomIconProps) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden
    />
  );
}
