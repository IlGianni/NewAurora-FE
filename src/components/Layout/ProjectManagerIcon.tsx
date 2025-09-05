import type {IconSvgProps} from "./types";

import React from "react";

export const ProjectManagerIcon: React.FC<IconSvgProps> = ({size = 32, width, height, ...props}) => (
  <svg fill="none" height={size || height} viewBox="0 0 32 32" width={size || width} {...props}>
    <path
      clipRule="evenodd"
      d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 2c6.627 0 12 5.373 12 12s-5.373 12-12 12S4 22.627 4 16 9.373 4 16 4zm-1 6v6h6v-2h-4v-4h-2zm8 8v2h-6v-2h6z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);