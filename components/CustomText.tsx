import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface CustomTextProps extends TextProps {
  children?: React.ReactNode;
  type?: 'h1' | 'h2' | 'h3' | 'p';
}

const styles = StyleSheet.create({
  neucha: {
    fontFamily: "Neucha_400Regular"
  },
  h1: {
    fontFamily: "CabinSketch_400Regular",
    fontSize: 32,
  },
  h2: {
    fontFamily: "CabinSketch_400Regular",
    fontSize: 24,
  },
  h3: {
    fontFamily: "CabinSketch_400Regular",
    fontSize: 18,
  }
});

const CustomText: React.FC<CustomTextProps> = ({ style, children, type, ...props }) => {
  let baseStyle = styles.neucha;
  if (type === 'h1') baseStyle = styles.h1;
  else if (type === 'h2') baseStyle = styles.h2;
  else if (type === 'h3') baseStyle = styles.h3;

  let safeStyle: any = StyleSheet.flatten(style) || {};
  if (safeStyle.fontWeight !== undefined) {
    const { fontWeight, ...rest } = safeStyle;
    safeStyle = rest;
  }

  const flattenedStyle = StyleSheet.flatten([baseStyle, safeStyle]);
  return (
    <Text style={flattenedStyle} {...props}>
      {children}
    </Text>
  );
};

export default CustomText;