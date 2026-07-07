import Link from "next/link";
import { RoomIcon } from "@/components/RoomIcon";

type IgPostCardProps = {
  href: string;
  title: string;
  subtitle: string;
  meta?: string;
  location?: string;
  roomColor: string;
  badge?: React.ReactNode;
};

export function IgPostCard({
  href,
  title,
  subtitle,
  meta,
  location,
  roomColor,
  badge,
}: IgPostCardProps) {
  return (
    <article className="ig-post">
      <Link href={href} className="ig-post-link">
        <header className="ig-post-header">
          <div className="ig-post-avatar-wrap">
            <span className="ig-story-ring">
              <span className="ig-post-avatar">
                <RoomIcon color={roomColor} size={14} />
              </span>
            </span>
            <div className="min-w-0">
              <p className="ig-post-username">{subtitle}</p>
              {location ? <p className="ig-post-location">{location}</p> : null}
            </div>
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
        </header>

        <div className="ig-post-body">
          <h2 className="ig-post-title">{title}</h2>
          {meta ? <p className="ig-post-meta">{meta}</p> : null}
        </div>
      </Link>
    </article>
  );
}
