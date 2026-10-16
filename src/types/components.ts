import {TextInputProps} from 'react-native';

export interface LabeledIconInputProps extends TextInputProps {
  label?: string;
  iconName: string;
  error?: string;
  isPassword?: boolean;
}
