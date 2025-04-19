import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const ArrowLeft = (props) => {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <Path
        d="M8 12L16 12M8 12C8 11.2998 9.9943 9.99153 10.5 9.5M8 12C8 12.7002 9.9943 14.0085 10.5 14.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ArrowLeft;
