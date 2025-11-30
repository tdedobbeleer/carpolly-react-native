import React from 'react';
import { Text, TextProps } from 'react-native';

interface CustomTextProps extends TextProps {
  children?: React.ReactNode;
}

const globalTextStyle = {
  fontFamily: 'Neucha_400Regular',
};

const CustomText: React.FC<CustomTextProps> = ({ style, children, ...props }) => {
  return (
    <Text style={[globalTextStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default CustomText;