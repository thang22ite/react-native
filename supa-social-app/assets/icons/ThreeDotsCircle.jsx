import React from 'react';
import Svg, { Circle } from 'react-native-svg';

const ThreeDotsCircle = (props) => {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      {/* Outer circle */}
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {/* Three inner dots */}
      <Circle cx={8} cy={12} r={1.2} fill="currentColor" />
      <Circle cx={12} cy={12} r={1.2} fill="currentColor" />
      <Circle cx={16} cy={12} r={1.2} fill="currentColor" />
    </Svg>
  );
};

export default ThreeDotsCircle;
