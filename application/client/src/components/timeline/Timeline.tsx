import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  eagerAvatarOnFirstItem?: boolean;
  timeline: Models.Post[];
}

export const Timeline = ({ eagerAvatarOnFirstItem = false, timeline }: Props) => {
  return (
    <section>
      {timeline.map((post, idx) => {
        return (
          <TimelineItem
            eagerAvatar={eagerAvatarOnFirstItem && idx === 0}
            key={post.id}
            post={post}
          />
        );
      })}
    </section>
  );
};
