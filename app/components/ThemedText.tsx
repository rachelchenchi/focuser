import { Text, TextProps } from 'react-native';
import React from 'react';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'default' | 'defaultSemiBold';
}

export function ThemedText({ type = 'default', style, ...props }: ThemedTextProps) {
  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return { fontSize: 24, fontWeight: '700' as const };
      case 'subtitle':
        return { fontSize: 18, fontWeight: '600' as const };
      case 'defaultSemiBold':
        return { fontSize: 16, fontWeight: '600' as const };
      default:
        return { fontSize: 16 };
    }
  };

  return <Text style={[getTextStyle(), style]} {...props} />;
}
