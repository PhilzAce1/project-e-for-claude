import React from 'react';

interface IconProps {
  className?: string;
}

export const GoogleTagManager: React.FC<IconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    version="1.1"
    x="0px"
    y="0px"
    width="192px"
    height="192px"
    viewBox="0 0 192 192"
    enableBackground="new 0 0 192 192"
    xmlSpace="preserve"
    className={className}
  >
    <rect fill="none" width="192" height="192" />
    <g>
      <polygon
        fill="#8AB4F8"
        points="111.31,176.79 80.76,147 146.37,80 178,111  "
      />
      <path
        fill="#4285F4"
        d="M111.44,45.08L81,14L14.44,79.93c-8.58,8.58-8.58,22.49,0,31.08L80,177l31-29L61.05,95.47L111.44,45.08z"
      />
      <path
        fill="#8AB4F8"
        d="M177.56,80.44l-66-66c-8.59-8.59-22.52-8.59-31.11,0c-8.59,8.59-8.59,22.52,0,31.11l66,66   c8.59,8.59,22.52,8.59,31.11,0C186.15,102.96,186.15,89.03,177.56,80.44z"
      />
      <circle fill="#246FDB" cx="95.5" cy="162.5" r="21.5" />
    </g>
  </svg>
);
export const GoogleSearchConsole: React.FC<IconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1820 1024"
    fill="none"
    className={className}
  >
    <rect width="1820" height="1024" fill="white" />
    <path
      d="M1286.32 520.727C1286.32 493.498 1283.88 467.316 1279.34 442.182H917.68V590.895H1124.34C1115.27 638.72 1088.04 679.215 1047.19 706.444V803.142H1171.82C1244.43 736.116 1286.32 637.673 1286.32 520.727Z"
      fill="#4285F4"
    />
    <path
      d="M917.68 896C1021.36 896 1108.28 861.789 1171.82 803.142L1047.19 706.444C1012.98 729.484 969.346 743.447 917.68 743.447C817.84 743.447 733.011 676.073 702.64 585.309H574.873V684.451C638.058 809.775 767.571 896 917.68 896Z"
      fill="#34A853"
    />
    <path
      d="M702.64 584.96C694.96 561.92 690.422 537.484 690.422 512C690.422 486.516 694.96 462.08 702.64 439.04V339.898H574.873C548.691 391.564 533.68 449.862 533.68 512C533.68 574.138 548.691 632.436 574.873 684.102L674.364 606.604L702.64 584.96Z"
      fill="#FBBC05"
    />
    <path
      d="M917.68 280.902C974.233 280.902 1024.5 300.451 1064.65 338.153L1174.61 228.189C1107.93 166.051 1021.36 128 917.68 128C767.571 128 638.058 214.225 574.873 339.898L702.64 439.04C733.011 348.276 817.84 280.902 917.68 280.902Z"
      fill="#EA4335"
    />
  </svg>
);

export const GoogleAnalytics: React.FC<IconProps> = ({
  className = 'w-6 h-6'
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    version="1.1"
    x="0px"
    y="0px"
    width="192px"
    height="192px"
    viewBox="0 0 192 192"
    enableBackground="new 0 0 192 192"
    xmlSpace="preserve"
    className={className}
  >
    <rect x="0" y="0" fill="none" width="192" height="192" />
    <g>
      <g>
        <path
          fill="#F9AB00"
          d="M130,29v132c0,14.77,10.19,23,21,23c10,0,21-7,21-23V30c0-13.54-10-22-21-22S130,17.33,130,29z"
        />
      </g>
      <g>
        <path
          fill="#E37400"
          d="M75,96v65c0,14.77,10.19,23,21,23c10,0,21-7,21-23V97c0-13.54-10-22-21-22S75,84.33,75,96z"
        />
      </g>
      <g>
        <circle fill="#E37400" cx="41" cy="163" r="21" />
      </g>
    </g>
  </svg>
);
