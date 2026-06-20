import { TextInputProps } from 'react-native';

import { AppInput } from '@/src/components/forms/AppInput';

interface SearchInputProps extends Pick<TextInputProps, 'autoFocus'> {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}

export function SearchInput({ label, placeholder, value, onChangeText, autoFocus }: SearchInputProps) {
  return (
    <AppInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      autoFocus={autoFocus}
      leftIconName="search-outline"
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
    />
  );
}
