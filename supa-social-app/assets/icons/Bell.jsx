import React from 'react';
import Svg, { Path } from 'react-native-svg';

const Bell = (props) => {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <Path
        d="M21 17.5H3C4.50991 16.896 5.5 15.4336 5.5 13.8074V9C5.5 5.41015 8.41015 2.5 12 2.5C15.5899 2.5 18.5 5.41015 18.5 9V13.8074C18.5 15.4336 19.4901 16.896 21 17.5Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 20.5C13.8557 21.1186 12.9733 21.5 12 21.5C11.0267 21.5 10.1443 21.1186 9.5 20.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Bell;
