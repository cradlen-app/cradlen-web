import { getStaffInitials } from "../lib/staff.utils";

type StaffAvatarProps = {
  name: string;
};

export function StaffAvatar({ name }: StaffAvatarProps) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-semibold text-white">
      {getStaffInitials(name)}
    </div>
  );
}
