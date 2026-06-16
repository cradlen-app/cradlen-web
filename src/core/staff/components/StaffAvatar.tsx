import { User } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { getStaffInitials } from "../lib/staff.utils";

type StaffAvatarProps = {
  name: string;
  imageUrl?: string | null;
  className?: string;
};

export function StaffAvatar({ name, imageUrl, className }: StaffAvatarProps) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={cn("size-8 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  const initials = getStaffInitials(name);

  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white",
        className,
      )}
    >
      {initials || <User className="size-[45%]" aria-hidden="true" strokeWidth={1.75} />}
    </div>
  );
}
