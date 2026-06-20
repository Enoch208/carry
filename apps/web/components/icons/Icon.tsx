import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

type IconProps = {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

export function Icon({
  icon,
  size = 20,
  strokeWidth = 1.5,
  className,
  ...rest
}: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      {...rest}
    />
  );
}
