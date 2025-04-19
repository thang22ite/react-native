import React from 'react';
import Svg, { Circle } from 'react-native-svg';

const ThreeDotsHorizontal = (props) => {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Circle cx={6} cy={12} r={1.5} fill="currentColor" />
      <Circle cx={12} cy={12} r={1.5} fill="currentColor" />
      <Circle cx={18} cy={12} r={1.5} fill="currentColor" />
    </Svg>
  );
};

export default ThreeDotsHorizontal;
